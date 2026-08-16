# Руководство по интеграции узлов и сбору телеметрии (Alex HD Cluster)

Настоящее руководство описывает регламент подключения внешних серверов (TorrServer MatriX, Edge CDN HLS прокси, FFmpeg GPU транскодеров) к центральному бэкенду платформы Alex HD, структуру передаваемых пакетов телеметрии и алгоритмы балансировки нагрузки.

---

## 1. Архитектура взаимодействия

```
┌─────────────────────────────────────────────────────────────┐
│                    ALEX HD CORE SERVER                      │
│                  (https://alexhd.cloud)                     │
│                                                             │
│  [API Endpoint: POST /api/v1/admin/nodes/telemetry]        │
│  [Least-Loaded Router: /api/v1/playback/play]               │
└──────────────────▲────────────────────────────▲─────────────┘
                   │ Telemetry                  │ Telemetry
                   │ Heartbeat (10s)            │ Heartbeat (10s)
         ┌─────────┴────────┐          ┌────────┴─────────┐
         │                  │          │                  │
┌────────┴─────────┐ ┌──────┴────────┐ ┌────────┴─────────┐
│ Edge Node MOW-01 │ │ Edge Node FRA │ │ Transcoder GPU 1 │
│  TorrServer/HLS  │ │ TorrServer/HLS│ │  FFmpeg NVENC    │
└──────────────────┘ └───────────────┘ └──────────────────┘
```

---

## 2. Эндпоинты API телеметрии

### `POST /api/v1/admin/nodes/telemetry`
Принимает пакет состояния от фонового демона узла.

#### Заголовки (Headers):
```http
Content-Type: application/json
X-Node-Secret: <ВАШ_СЕКРЕТНЫЙ_ТОКЕН_ИЗ_ПАНЕЛИ_АДМИНИСТРАТОРА>
```

#### Тело запроса (JSON Payload):
```json
{
  "nodeId": "node-fra-01",
  "hostname": "194.87.142.10:8090",
  "region": "Франкфурт, DE",
  "cpuUsagePercent": 24.5,
  "ramUsagePercent": 42.1,
  "diskUsagePercent": 35.0,
  "bandwidthMbps": 4200.0,
  "activeStreams": 18,
  "pingMs": 14,
  "version": "TorrServer MatriX.134"
}
```

#### Ответ сервера (Success Response):
```json
{
  "status": "ok",
  "nodeId": "node-fra-01",
  "action": "updated",
  "timestamp": 1718000000000
}
```

---

## 3. Автоматическая установка в 1 команду (Ubuntu 22.04 / 24.04 / Debian)

Выполните на сервере узла:

```bash
curl -sSL https://alexhd.cloud/api/v1/install-agent.sh | sudo bash -s -- \
  --node-id="node-fra-01" \
  --type="torrserver" \
  --server="https://alexhd.cloud" \
  --secret="sec_alexhd_cluster_98f12a88" \
  --port=8090
```

---

## 4. Конфигурация Docker Compose (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  # 1. TorrServer MatriX Engine
  torrserver:
    image: yourok/torrserver:latest
    container_name: alexhd_torrserver
    restart: always
    environment:
      - TS_CACHE_SIZE=268435456 # 256 MB RAM Ring Buffer
      - TS_PRELOAD=15          # Предзагрузка 15% перед стартом
      - TS_TORR_DIR=/torrents
      - TS_LOG_LEVEL=INFO
    ports:
      - "8090:8090"
      - "51413:51413/tcp"
      - "51413:51413/udp"
    volumes:
      - ./torrents:/torrents
      - ./torrserver_db:/opt/torrserver/db

  # 2. Агент отправки телеметрии
  telemetry-agent:
    image: python:3.11-slim
    container_name: alexhd_telemetry_agent
    restart: always
    volumes:
      - ./agent:/app
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
    working_dir: /app
    environment:
      - NODE_ID=node-fra-01
      - NODE_ROLE=torrserver
      - NODE_PORT=8090
      - CORE_SERVER_URL=https://alexhd.cloud
      - NODE_SECRET=sec_alexhd_cluster_98f12a88
      - TELEMETRY_INTERVAL_SEC=10
    command: >
      bash -c "pip install --no-cache-dir requests psutil && python telemetry_daemon.py"

  # 3. Nginx Reverse Proxy с CORS для Smart TV (Tizen, webOS, MSX)
  nginx-edge:
    image: nginx:alpine
    container_name: alexhd_nginx_edge
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - torrserver
```

---

## 5. Демон сбора метрик (`telemetry_daemon.py`)

```python
#!/usr/bin/env python3
import time
import os
import psutil
import requests

NODE_ID = os.getenv("NODE_ID", "node-edge-01")
CORE_URL = os.getenv("CORE_SERVER_URL", "https://alexhd.cloud")
SECRET = os.getenv("NODE_SECRET", "sec_cluster_token")
TORR_PORT = os.getenv("NODE_PORT", "8090")
INTERVAL = int(os.getenv("TELEMETRY_INTERVAL_SEC", "10"))

while True:
    try:
        cpu = round(psutil.cpu_percent(interval=1), 1)
        ram = round(psutil.virtual_memory().percent, 1)
        disk = round(psutil.disk_usage('/').percent, 1)

        active_streams = 0
        bandwidth_mbps = 0.0
        try:
            r = requests.get(f"http://127.0.0.1:{TORR_PORT}/torrents/list", timeout=3)
            if r.status_code == 200:
                torrents = r.json()
                active = [t for t in torrents if t.get('stat') in (2, 3)]
                active_streams = len(active)
                dl_speed = sum(t.get('download_speed', 0) for t in active)
                bandwidth_mbps = round((dl_speed * 8) / (1024 * 1024), 2)
        except Exception:
            pass

        payload = {
            "nodeId": NODE_ID,
            "cpuUsagePercent": cpu,
            "ramUsagePercent": ram,
            "diskUsagePercent": disk,
            "bandwidthMbps": bandwidth_mbps,
            "activeStreams": active_streams,
            "version": "TorrServer MatriX.134"
        }

        headers = {
            "Content-Type": "application/json",
            "X-Node-Secret": SECRET
        }

        requests.post(f"{CORE_URL}/api/v1/admin/nodes/telemetry", json=payload, headers=headers, timeout=5)
    except Exception as e:
        print(f"[ERR] Telemetry Loop: {e}")

    time.sleep(INTERVAL)
```

---

## 6. Сетевые порты и Firewall (UFW)

Для корректной работы P2P-стриминга и клиентов Smart TV на сервере должны быть открыты:

| Порт | Протокол | Назначение |
|---|---|---|
| **8090** | TCP | TorrServer Web UI и стриминг |
| **51413** | TCP / UDP | BitTorrent DHT & Peer Wire (P2P раздача) |
| **80, 443** | TCP | Nginx HLS Reverse Proxy / SSL Let's Encrypt |
| **3000** | TCP | Core Backend API |

Команды настройки фаервола Ubuntu:
```bash
sudo ufw allow 8090/tcp
sudo ufw allow 51413/tcp
sudo ufw allow 51413/udp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

---

## 7. Алгоритм маршрутизации Least-Loaded

Когда клиент нажимает «Воспроизвести», ядро выбирает оптимальный узел по формуле:

$$\text{LoadFactor} = (\text{CPU} \times 0.3) + (\text{RAM} \times 0.3) + \left(\frac{\text{ActiveStreams}}{\text{MaxCapacity}} \times 0.4\right)$$

Узел с наименьшим значением $\text{LoadFactor}$ назначается целевым для генерации потока.
