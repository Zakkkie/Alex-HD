# Единое руководство по архитектуре, установке и защите Alex HD

Полное практическое руководство по архитектуре потокового воспроизведения **Zero-Disk On-Demand Streaming**, развертыванию медиа-платформы **Alex HD** с поддержкой Smart TV (Samsung Tizen, LG webOS, Android TV, Apple TV, Media Station X), стриминга на лету через **TorrServer MatriX** в оперативной памяти (RAM), поиска и индексации через **Prowlarr & FlareSolverr**, базы данных **PostgreSQL 15+**, прямого входа по **IP:Port БЕЗ домена**, фронтенда на **Vercel** и комплексной безопасности через **Fail2ban & SSH Hardening**.

---

## 📌 Быстрый выбор варианта установки

| Вариант | Фронтенд | Бэкенд и База | TorrServer & Prowlarr | Для кого подходит |
|---|---|---|---|---|
| **Вариант 1 (БЕЗ ДОМЕНА: Прямой IP:Port / All-in-One VPS)** | **Тот же VPS** (`http://IP:3000` или `http://IP`) | **Тот же VPS** (Node.js + PostgreSQL) | **Тот же VPS** (RAM буфер 200MB) | **Самый простой и быстрый способ**: не нужен домен, не нужны SSL-сертификаты, нет ошибки Mixed Content, всё работает сразу из коробки по чистому HTTP. |
| **Вариант 2 (Vercel CDN + VPS)** | **Vercel CDN** (`alex-hd.vercel.app`) | **VPS** (Node.js + PostgreSQL) | **VPS** (RAM буфер 200MB) | **Мгновенная загрузка интерфейса** через глобальный CDN Vercel без нагрузки на процессор VPS, тяжелый стриминг — на VPS. |
| **Вариант 3 (All-in-One VPS + Nginx SSL)** | **Тот же VPS** | **Тот же VPS** | **Тот же VPS** | При наличии своего домена (например `tv.mydomain.com`) с защищенным HTTPS через Let's Encrypt / Cloudflare. |
| **Вариант 4 (Docker Compose)** | **Контейнер** | **Контейнеры** | **Контейнеры** | Запуск полного изолированного стека (TorrServer + Prowlarr + FlareSolverr + Postgres) одной командой `docker compose up -d`. |
| **Вариант 5 (Только TorrServer)** | **Vercel / Локально** | Встроенная память | **VPS** (порт 8090) | Минимальная установка только стримингового движка без базы данных. |

---

# РАЗДЕЛ 0. Архитектура Zero-Disk Стриминга (Seerr + Prowlarr + TorrServer + Плеер)

### 💡 Философия Zero-Disk (Почему мы не скачиваем файлы на сервер):
В отличие от классических серверов-хранилищ (qBittorrent / Radarr / Sonarr / Plex), которым требуются накопители на **4–16 ТБ** стоимостью от 15 000 ₽/мес, **Alex HD** работает по принципу **потокового VOD-стриминга в реальном времени**:

1. **🎬 Каталог и Витрина (Seerr / Jellyseerr / Встроенный каталог Alex HD на TMDB API)**:
   Пользователь выбирает фильм или серию в каталоге с постерами в 4K, трейлерами, описанием, рейтингами, актёрами и сезонами.
2. **📡 Поисковый шлюз (Prowlarr)**:
   При выборе фильма Prowlarr мгновенно опрашивает десятки торрент-трекеров (RuTracker, Rutor, Kinozal, NNM-Club) и передает magnet-ссылку с максимальным числом сидов и нужным дубляжом.
3. **⚡️ Стриминг-движок (TorrServer MatriX в оперативной памяти)**:
   Берёт magnet-ссылку, подключается к пирам и последовательно загружает только нужные фрагменты в **RAM-буфер (200 МБ)**. **На диск VPS не пишется ни единого байта (`UseDisk: false`)!**
4. **▶️ Плеер (HTML5 / HLS / Smart TV)**:
   Видео запускается уже через **3–5 секунд** после клика на Play. После окончания просмотра буфер оперативной памяти автоматически освобождается.

### Сравнение: Торрент-качалка vs. Zero-Disk Стриминг:

| Параметр | Классическая торрент-качалка (qBittorrent / Radarr) | Наш Zero-Disk Стриминг (Alex HD + TorrServer) |
| :--- | :--- | :--- |
| **Хранилище на сервере** | Требуются диски на **4–16 ТБ** (очень дорого) | **0 байт на диске** (хватает 10–20 ГБ SSD за 200–300 ₽/мес) |
| **Время ожидания** | Ждать **15–40 минут**, пока файл скачается | Старт видео **через 3–5 секунд** |
| **Нагрузка на SSD** | Быстрый износ диска терабайтами записей | **0 износа** — всё работает в оперативной памяти (RAM) |
| **Обслуживание** | Нужно постоянно удалять старые фильмы | Диск никогда не забивается, можно смотреть бесконечно |

### Идеальная конфигурация TorrServer для стриминга в RAM:

Выполните на VPS следующую команду через API TorrServer:

```bash
curl -X POST http://127.0.0.1:8090/settings/set \
  -H "Content-Type: application/json" \
  -d '{
    "CacheSize": 209715200,
    "PreloadCache": 50,
    "UseDisk": false,
    "ReaderReadAHead": 95,
    "RetrackersMode": 1,
    "TorrentDisconnectTimeout": 30
  }'
```

* **`CacheSize: 209715200`** — 200 МБ RAM под кольцевой буфер (достаточно даже для 4K HDR Remux битрейтом 80-100 Мбит/с).
* **`UseDisk: false`** — полный запрет на сохранение торрентов на диск VPS.
* **`PreloadCache: 50`** — старт плеера сразу после предзагрузки половины буфера (3–5 сек).
* **`RetrackersMode: 1`** — включение локальных пиров и ретрекеров для максимальной скорости в РФ/СНГ.

---

# РАЗДЕЛ 1. ВАРИАНТ БЕЗ ДОМЕНА: Прямой доступ по IP:Port (All-in-One VPS)

Этот вариант **идеален для быстрого старта**. Вам не нужно покупать домен, настраивать DNS-записи или мучиться с выпуском SSL-сертификатов.

### 🌟 Главные преимущества работы напрямую по IP:
1. **0 рублей расходов на домен.**
2. **НЕТ ошибки Mixed Content**: так как весь сайт, API и TorrServer работают по протоколу `http://`, браузеры (Chrome, Edge, Safari) и Smart TV никогда не блокируют видеопотоки.
3. **Единый сервер**: бэкенд, фронтенд, база данных, поиск Prowlarr и стриминг TorrServer крутятся на одном недорогом VPS.

---

### Шаг 1. Подключение к чистому VPS (Ubuntu 22.04 / 24.04 LTS)

```bash
ssh root@IP_ВАШЕГО_VPS
```

---

### Шаг 2. Обновление системы, утилиты и Swap 4GB

```bash
# 1. Обновляем репозитории и пакеты
sudo apt update && sudo apt upgrade -y

# 2. Устанавливаем системные утилиты, PostgreSQL, Nginx, компиляторы
sudo apt install -y curl wget git build-essential ufw software-properties-common \
                    postgresql postgresql-contrib libpq-dev nginx \
                    htop iotop net-tools ffmpeg jq fail2ban unattended-upgrades

# 3. Создаем Swap 4GB (защита от нехватки памяти при 4K стриминге)
if [ $(swapon --show | wc -l) -le 1 ]; then
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  echo ">>> Swap 4GB успешно создан!"
fi
```

---

### Шаг 3. Установка Node.js 20 LTS, PM2 и Docker

```bash
# 1. Устанавливаем Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Устанавливаем PM2 глобально
sudo npm install -g pm2

# 3. Устанавливаем Docker (для Prowlarr и FlareSolverr)
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker
```

---

### Шаг 4. Настройка PostgreSQL 15+ и инициализация базы

```bash
# 1. Создаем пользователя базы данных и базу alexhd_db
sudo -u postgres psql << 'EOF'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'alexhd_user') THEN
    CREATE USER alexhd_user WITH ENCRYPTED PASSWORD 'StrongAlexHdPass2026!';
  END IF;
END
$$;

CREATE DATABASE alexhd_db WITH OWNER alexhd_user;
GRANT ALL PRIVILEGES ON DATABASE alexhd_db TO alexhd_user;
\c alexhd_db
GRANT ALL ON SCHEMA public TO alexhd_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO alexhd_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO alexhd_user;
EOF
```

```bash
# 2. Применяем схему структуры и создаем дефолтного администратора
cat << 'EOF' > /tmp/init_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(64) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) DEFAULT 'user' NOT NULL,
  plan VARCHAR(32) DEFAULT 'standard' NOT NULL,
  subscription_expires_at TIMESTAMPTZ,
  is_blocked BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(128) NOT NULL,
  device_name VARCHAR(128) NOT NULL,
  platform VARCHAR(32) NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT uq_user_device UNIQUE (user_id, device_id)
);

CREATE TABLE IF NOT EXISTS content (
  id VARCHAR(64) PRIMARY KEY,
  tmdb_id INTEGER UNIQUE,
  type VARCHAR(32) NOT NULL,
  title VARCHAR(512) NOT NULL,
  original_title VARCHAR(512),
  release_year SMALLINT NOT NULL,
  age_rating VARCHAR(16),
  rating_imdb NUMERIC(3, 1),
  rating_tmdb NUMERIC(3, 1),
  runtime_minutes SMALLINT,
  overview TEXT,
  poster_url VARCHAR(1024),
  backdrop_url VARCHAR(1024),
  is_4k BOOLEAN DEFAULT FALSE NOT NULL,
  is_published BOOLEAN DEFAULT TRUE NOT NULL,
  play_count BIGINT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS history (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id VARCHAR(64) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  season_id VARCHAR(64),
  episode_id VARCHAR(64),
  position_seconds INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  is_finished BOOLEAN DEFAULT FALSE NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT uq_user_history_entry UNIQUE (user_id, content_id, episode_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id VARCHAR(64) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (user_id, content_id)
);

CREATE TABLE IF NOT EXISTS watchlist (
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id VARCHAR(64) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (user_id, content_id)
);

CREATE TABLE IF NOT EXISTS streaming_nodes (
  id VARCHAR(64) PRIMARY KEY,
  hostname VARCHAR(255) NOT NULL,
  region VARCHAR(64) NOT NULL,
  type VARCHAR(32) DEFAULT 'torrserver' NOT NULL,
  max_capacity INTEGER DEFAULT 50 NOT NULL,
  active_streams INTEGER DEFAULT 0 NOT NULL,
  bandwidth_mbps INTEGER DEFAULT 0 NOT NULL,
  cpu_usage_percent INTEGER DEFAULT 0 NOT NULL,
  ram_usage_percent INTEGER DEFAULT 0 NOT NULL,
  disk_usage_percent INTEGER DEFAULT 0 NOT NULL,
  is_online BOOLEAN DEFAULT TRUE NOT NULL,
  last_heartbeat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Дефолтный Администратор: alex_admin / admin123
INSERT INTO users (id, email, username, password_hash, role, plan, subscription_expires_at)
VALUES (
  'usr-admin-01',
  'admin@smarttv.com',
  'alex_admin',
  '$2a$10$wN30XNq1r3mB.YxY9QJpUO7z9Q7G0Dk4B3W3T9N2B4L5K6J7H8G9A',
  'admin',
  '4k',
  NOW() + INTERVAL '365 days'
)
ON CONFLICT (id) DO NOTHING;

-- Локальный узел TorrServer
INSERT INTO streaming_nodes (id, hostname, region, type, max_capacity, is_online)
VALUES (
  'node-local-01',
  '127.0.0.1:8090',
  'Локальный стриминговый узел (RAM Cache)',
  'torrserver',
  100,
  TRUE
)
ON CONFLICT (id) DO NOTHING;
EOF

PGPASSWORD='StrongAlexHdPass2026!' psql -h 127.0.0.1 -U alexhd_user -d alexhd_db -f /tmp/init_schema.sql
rm /tmp/init_schema.sql
```

---

### Шаг 5. Установка и автозапуск TorrServer MatriX (RAM Режим)

```bash
# 1. Создаем каталоги
sudo mkdir -p /opt/torrserver /var/lib/torrserver/db

# 2. Скачиваем бинарник TorrServer MatriX
cd /opt/torrserver
sudo wget https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-amd64 -O torrserver || sudo curl -L https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-amd64 -o torrserver
sudo chmod +x torrserver

# 3. Создаем системного пользователя
sudo useradd -r -s /bin/false torruser || true
sudo chown -R torruser:torruser /opt/torrserver /var/lib/torrserver

# 4. Создаем службу systemd
sudo tee /etc/systemd/system/torrserver.service > /dev/null << 'EOF'
[Unit]
Description=TorrServer MatriX Streaming Engine (Zero-Disk RAM)
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=torruser
Group=torruser
WorkingDirectory=/opt/torrserver
ExecStart=/opt/torrserver/torrserver -p 8090 -d /var/lib/torrserver/db
Restart=always
RestartSec=3
LimitNOFILE=65536
LimitNPROC=65536
MemoryMax=3G
MemoryHigh=2.5G

[Install]
WantedBy=multi-user.target
EOF

# 5. Тюнинг сетевых буферов ядра Linux для 4K HDR (BBR)
sudo tee /etc/sysctl.d/99-torrserver.conf > /dev/null << 'EOF'
net.core.rmem_max = 67108864
net.core.wmem_max = 67108864
net.core.rmem_default = 33554432
net.core.wmem_default = 33554432
net.core.netdev_max_backlog = 10000
net.core.somaxconn = 4096
net.ipv4.tcp_rmem = 4096 87380 33554432
net.ipv4.tcp_wmem = 4096 65536 33554432
net.ipv4.tcp_congestion_control = bbr
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_tw_reuse = 1
EOF

sudo sysctl --system
sudo systemctl daemon-reload
sudo systemctl enable --now torrserver

# 6. Применяем RAM настройки к TorrServer
sleep 2
curl -X POST http://127.0.0.1:8090/settings/set \
  -H "Content-Type: application/json" \
  -d '{"CacheSize":209715200,"PreloadCache":50,"UseDisk":false,"ReaderReadAHead":95,"RetrackersMode":1,"TorrentDisconnectTimeout":30}'
```

---

### Шаг 6. Развертывание Prowlarr и FlareSolverr (Docker)

```bash
# 1. Запуск FlareSolverr (для решения Cloudflare капч)
sudo docker run -d \
  --name=flaresolverr \
  -p 8191:8191 \
  -e LOG_LEVEL=info \
  -e TZ=Europe/Moscow \
  --restart always \
  ghcr.io/flaresolverr/flaresolverr:latest

# 2. Запуск Prowlarr
sudo mkdir -p /opt/prowlarr/config
sudo docker run -d \
  --name=prowlarr \
  -p 9696:9696 \
  -dns 77.88.8.8 \
  -dns 1.1.1.1 \
  -e PUID=1000 \
  -e PGID=1000 \
  -e TZ=Europe/Moscow \
  -v /opt/prowlarr/config:/config \
  --restart always \
  lscr.io/linuxserver/prowlarr:latest
```

* Откройте веб-панель Prowlarr в браузере: `http://IP_ВАШЕГО_VPS:9696`.
* Перейдите в **Settings &rarr; General** и скопируйте **API Key**.
* Перейдите в **Settings &rarr; Indexers &rarr; Proxies &rarr; + (Add)** &rarr; выберите **FlareSolverr** &rarr; укажите Host `http://127.0.0.1:8191` &rarr; нажмите **Test & Save**.
* В разделе **Indexers** добавьте: **Rutor**, **RuTracker**, **Kinozal**, **NNM-Club**.

---

### Шаг 7. Сборка и запуск Alex HD на VPS

Фронтенд собирается прямо на сервере и автоматически раздаётся бэкендом из папки `dist`:

```bash
sudo mkdir -p /var/www/alexhd
sudo chown -R $USER:$USER /var/www/alexhd
cd /var/www/alexhd

# Клонируем репозиторий
git clone ВАШ_URL_РЕПОЗИТОРИЯ .

# Устанавливаем зависимости и собираем проект
npm install
npm run build

# Создаем боевой файл .env
cat << 'EOF' > /var/www/alexhd/.env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgres://alexhd_user:StrongAlexHdPass2026!@127.0.0.1:5432/alexhd_db
JWT_SECRET=super_secret_jwt_alexhd_production_token_8899221100ffaa
MAX_DEVICES_PER_USER=3
TORRSERVER_URL=http://127.0.0.1:8090
PROWLARR_URL=http://127.0.0.1:9696
PROWLARR_API_KEY=ВАШ_API_КЛЮЧ_ИЗ_PROWLARR
TMDB_API_KEY=
EOF

# Конфигурация запуска PM2
cat << 'EOF' > /var/www/alexhd/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'alexhd-core',
      script: 'dist/server.cjs',
      cwd: '/var/www/alexhd',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/www/alexhd/logs/pm2-error.log',
      out_file: '/var/www/alexhd/logs/pm2-out.log',
      merge_logs: true
    }
  ]
};
EOF

mkdir -p /var/www/alexhd/logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

### Шаг 8. Настройка Nginx на 80 порт (Чтобы заходить без указания :3000)

Создайте простой конфиг в `/etc/nginx/sites-available/default`:

```bash
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 100M;

    # Стриминг TorrServer (без буферизации для 4K)
    location /torrserver/ {
        proxy_pass http://127.0.0.1:8090/;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 86400s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Основное веб-приложение Alex HD и API
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo nginx -t && sudo systemctl restart nginx
```

---

### Шаг 9. Настройка Брандмауэра UFW (Открытие портов)

```bash
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP (Nginx)'
sudo ufw allow 3000/tcp comment 'Alex HD Core Direct'
sudo ufw allow 8090/tcp comment 'TorrServer Direct'
sudo ufw allow 9696/tcp comment 'Prowlarr Web/API'
sudo ufw allow 35432/tcp comment 'TorrServer DHT TCP'
sudo ufw allow 35432/udp comment 'TorrServer DHT UDP'
sudo ufw allow 51413/tcp comment 'TorrServer Peer Wire TCP'
sudo ufw allow 51413/udp comment 'TorrServer Peer Wire UDP'
sudo ufw --force enable
sudo ufw status
```

---

### Шаг 10. Как открывать приложение:

* **Сайт и Плеер**: `http://IP_ВАШЕГО_VPS` (или `http://IP_ВАШЕГО_VPS:3000`)
* **Вход в панель управления**: перейдите в `/admin` &rarr; логин `alex_admin`, пароль `admin123`.
* **TorrServer веб-интерфейс**: `http://IP_ВАШЕГО_VPS:8090`
* **Prowlarr веб-интерфейс**: `http://IP_ВАШЕГО_VPS:9696`
* **Подключение Smart TV (Media Station X / MSX)**:
  1. В приложении Media Station X на телевизоре откройте **Settings &rarr; Start Parameter &rarr; Setup**.
  2. Введите адрес: `http://IP_ВАШЕГО_VPS/msx.json` (или `http://IP_ВАШЕГО_VPS:3000/msx.json`) и нажмите **Confirm**.

---

# РАЗДЕЛ 2. Вариант 2 (Vercel CDN + Выделенный VPS)

Если вы хотите, чтобы пользовательский интерфейс загружался моментально с глобальных серверов Vercel:

1. Разверните бэкенд, PostgreSQL, TorrServer и Prowlarr на VPS по инструкции из **Раздела 1** (Шаги 1–6, 9).
2. Зайдите на **[vercel.com](https://vercel.com/)** &rarr; **Add New Project** &rarr; импортируйте репозиторий.
3. В **Environment Variables** укажите:
   * `VITE_API_URL` = `http://IP_ВАШЕГО_VPS:3000`
   * `VITE_TORRSERVER_URL` = `http://IP_ВАШЕГО_VPS:8090`
4. Нажмите **Deploy**.
5. Адрес для Smart TV в Media Station X: `https://ваш-проект.vercel.app/msx.json`.

> ⚠️ **Примечание для браузера ПК при просмотре через Vercel (HTTPS):**
> Браузеры могут заблокировать HTTP-видеопоток с TorrServer из-за политики Mixed Content. В Chrome нажмите на значок замка / настроек сайта слева от адресной строки и выберите **"Небезопасное содержимое" &rarr; "Разрешить"**. На Smart TV (Media Station X) такой проблемы нет.

---

# РАЗДЕЛ 3. Защита VPS: Fail2ban, SSH-ключи и Hardening

### 1. Установка и настройка Fail2ban

Создайте конфигурационный файл `/etc/fail2ban/jail.local`:

```bash
sudo bash -c 'cat > /etc/fail2ban/jail.local << "EOF"
[DEFAULT]
bantime = 24h
findtime = 10m
maxretry = 3
banaction = ufw
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
port = http,https

[nginx-botsearch]
enabled = true
port = http,https
maxretry = 2
EOF'

sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

**Команды управления Fail2ban:**
* Проверить заблокированные IP: `sudo fail2ban-client status sshd`
* Разблокировать IP: `sudo fail2ban-client set sshd unbanip 1.2.3.4`

### 2. SSH Hardening (Вход строго по ключам, отключение паролей)

1. **Скопируйте ваш публичный ключ на VPS с домашнего компьютера:**
   ```bash
   ssh-copy-id root@IP_ВАШЕГО_VPS
   ```
2. **Проверьте, что вход по ключу работает без пароля.**
3. **Отключите аутентификацию по паролю на VPS:**
   ```bash
   sudo bash -c 'echo "PasswordAuthentication no" >> /etc/ssh/sshd_config.d/99-disable-passwords.conf'
   sudo bash -c 'echo "PermitRootLogin prohibit-password" >> /etc/ssh/sshd_config.d/99-disable-passwords.conf'
   sudo systemctl restart ssh || sudo systemctl restart sshd
   ```

### 3. Защита от брутфорса на уровне ядра (UFW Rate Limit)

```bash
sudo ufw limit 22/tcp comment 'Anti-brute force rate limit'
```

---

# РАЗДЕЛ 4. Prowlarr: Трекеры, Индексаторы и FlareSolverr

### Почему TMDB + Prowlarr вместо IMDb:
* **TMDB API** — обеспечивает быструю и красивую витрину (постеры 4K, актеры, русские/английские названия, трейлеры, описания).
* **Prowlarr** — поисковый шлюз, опрашивающий реальные торрент-трекеры в реальном времени.

### Рекомендуемый список трекеров для добавления в Prowlarr:
1. **RuTracker.org** *(требуется аккаунт)* — самый полный каталог дубляжей, редких фильмов и коллекций.
2. **Rutor (rutor.info)** *(без регистрации)* — открытый трекер со всеми свежими новинками кинопроката.
3. **Kinozal.tv** *(требуется аккаунт)* — премиальные студийные озвучки (Red Head Sound, Flarrow Films, HDRezka).
4. **NNM-Club** *(без регистрации)* — лучшие 4K HDR / Dolby Vision Remux релизы с многоканальным звуком.
5. **LostFilm.tv** *(требуется аккаунт)* — зарубежные сериалы в топовом дубляже.
6. **1337x / TorrentGalaxy** *(без регистрации)* — оригиналы на английском языке с Dolby Atmos.

### Подключение FlareSolverr в Prowlarr (Обход Cloudflare):
1. В веб-панели Prowlarr (`http://IP_VPS:9696`) перейдите в **Settings &rarr; Indexers**.
2. В секции **Proxies** нажмите **+ (Add Proxy)** и выберите **FlareSolverr**.
3. В поле **Host** укажите: `http://127.0.0.1:8191`.
4. Нажмите **Test** &rarr; **Save**. Теперь проверки Cloudflare и капчи трекеров решаются автоматически в фоне.

---

# РАЗДЕЛ 5. Вариант со своим доменом и Nginx + SSL (Если домен есть)

Конфигурация `/etc/nginx/sites-available/alexhd.conf`:

```nginx
proxy_cache_path /var/cache/nginx/alexhd_posters
    levels=1:2
    keys_zone=posters_cache:30m
    max_size=5g
    inactive=14d
    use_temp_path=off;

server {
    listen 80;
    server_name tv.yourdomain.com;
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name tv.yourdomain.com;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Device-Id' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range,Accept-Ranges' always;

    location /msx.json {
        alias /var/www/alexhd/public/msx.json;
        add_header Content-Type application/json;
        add_header Access-Control-Allow-Origin *;
    }

    location /t/p/ {
        proxy_pass https://image.tmdb.org/t/p/;
        proxy_cache posters_cache;
        proxy_cache_valid 200 30d;
        expires 30d;
    }

    # Стриминг TorrServer (Обязательно без буферизации Nginx!)
    location /torrserver/ {
        proxy_pass http://127.0.0.1:8090/;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 86400s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Активация и получение SSL через Certbot:
```bash
sudo ln -sf /etc/nginx/sites-available/alexhd.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo certbot --nginx -d tv.yourdomain.com --non-interactive --agree-tos -m admin@yourdomain.com
sudo nginx -t && sudo systemctl restart nginx
```

---

# РАЗДЕЛ 6. Вариант Docker Compose (Полный изолированный стек)

Создайте файл `docker-compose.yml`:

```yaml
version: '3.8'

services:
  torrserver:
    image: yourok/torrserver:latest
    container_name: alexhd-torrserver
    restart: always
    network_mode: host
    environment:
      - TS_PORT=8090
      - TS_DONTKILL=1
    volumes:
      - /var/lib/torrserver/db:/opt/torrserver/db

  prowlarr:
    image: lscr.io/linuxserver/prowlarr:latest
    container_name: alexhd-prowlarr
    restart: always
    network_mode: host
    dns:
      - 77.88.8.8
      - 1.1.1.1
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Moscow
    volumes:
      - /opt/prowlarr/config:/config

  flaresolverr:
    image: ghcr.io/flaresolverr/flaresolverr:latest
    container_name: alexhd-flaresolverr
    restart: always
    ports:
      - "8191:8191"
    environment:
      - LOG_LEVEL=info
      - TZ=Europe/Moscow

  postgres:
    image: postgres:15-alpine
    container_name: alexhd-postgres
    restart: always
    environment:
      POSTGRES_DB: alexhd_db
      POSTGRES_USER: alexhd_user
      POSTGRES_PASSWORD: StrongAlexHdPass2026!
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - /var/lib/postgresql/data:/var/lib/postgresql/data
```

Запуск:
```bash
docker compose up -d
```

---

# РАЗДЕЛ 7. Вариант: Легковесный режим (Только TorrServer)

```bash
sudo mkdir -p /opt/torrserver /var/lib/torrserver/db
cd /opt/torrserver
sudo wget https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-amd64 -O torrserver
sudo chmod +x torrserver
sudo nohup /opt/torrserver/torrserver -p 8090 -d /var/lib/torrserver/db > /var/log/torrserver.log 2>&1 &
sudo ufw allow 8090/tcp
```

---

# РАЗДЕЛ 8. Чек-лист проверки и Решение типовых проблем (Troubleshooting)

### Чек-лист проверки готовности системы:

| Компонент | Команда проверки | Ожидаемый результат |
|---|---|---|
| **TorrServer** | `curl -s http://127.0.0.1:8090/echo` | `MatriX.134` (или выше) |
| **Prowlarr** | `curl -s http://127.0.0.1:9696/ping` | `{"status":"OK"}` |
| **FlareSolverr** | `curl -s http://127.0.0.1:8191/` | `{"msg":"FlareSolverr is ready!"}` |
| **PostgreSQL** | `pg_isready -h 127.0.0.1 -p 5432` | `accepting connections` |
| **Core API** | `curl -s http://127.0.0.1:3000/api/v1/health` | `{"status":"ok","database":"connected"}` |
| **PM2 статус** | `pm2 status` | Сервис `alexhd-core` в статусе `online` |
| **Fail2ban** | `sudo fail2ban-client status sshd` | Статус службы и список заблокированных IP |

---

### Решение типовых проблем:

1. **Ошибка Mixed Content в браузере на ПК при работе через Vercel**:
   * *Причина*: Фронтенд на Vercel открыт по `https://`, а TorrServer отдает видео по `http://IP:8090`. Браузеры блокируют HTTP-видео внутри HTTPS.
   * *Решение*:
     1. Используйте **Вариант 1 (БЕЗ домена)** — открывайте сайт по `http://IP_ВАШЕГО_VPS` (или `http://IP_ВАШЕГО_VPS:3000`). Тогда ошибки Mixed Content не будет вообще!
     2. На Smart TV (через Media Station X / MSX) этой проблемы нет, видео играет напрямую.
     3. На ПК в Chrome/Edge нажмите на иконку «Настройки сайта» слева от адресной строки и установите пункт **«Небезопасный контент» (Insecure content)** в значение **«Разрешить» (Allow)**.
2. **0 пиров / Скорость 0 KB/s**:
   * *Причина*: Закрыты P2P-порты в фаерволе.
   * *Решение*: Выполните `sudo ufw allow 35432/tcp && sudo ufw allow 35432/udp && sudo ufw allow 51413/tcp && sudo ufw allow 51413/udp`.
3. **Видео зависает каждые 5–10 секунд**:
   * *Причина*: В Nginx включена буферизация 4K потока.
   * *Решение*: В блоке `location /torrserver/` конфигурации Nginx обязательно укажите `proxy_buffering off;`.
4. **Prowlarr не находит торренты на RuTracker/Rutor**:
   * *Причина*: Локальный DNS хостинга блокирует домены трекеров или срабатывает Cloudflare защита.
   * *Решение*: Запускайте Prowlarr с DNS `77.88.8.8` и подключите FlareSolverr прокси в настройках Prowlarr.


### 💡 Философия Zero-Disk (Почему мы не скачиваем файлы на сервер):
В отличие от классических серверов-хранилищ (qBittorrent / Radarr / Sonarr / Plex), которым требуются накопители на **4–16 ТБ** стоимостью от 15 000 ₽/мес, **Alex HD** работает по принципу **потокового VOD-стриминга в реальном времени**:

1. **🎬 Каталог и Витрина (Seerr / Jellyseerr / Встроенный каталог Alex HD на TMDB API)**:
   Пользователь выбирает фильм или серию в каталоге с постерами в 4K, трейлерами, описанием, рейтингами, актёрами и сезонами.
2. **📡 Поисковый шлюз (Prowlarr)**:
   При выборе фильма Prowlarr мгновенно опрашивает десятки торрент-трекеров (RuTracker, Rutor, Kinozal, NNM-Club) и передает magnet-ссылку с максимальным числом сидов и нужным дубляжом.
3. **⚡️ Стриминг-движок (TorrServer MatriX в оперативной памяти)**:
   Берёт magnet-ссылку, подключается к пирам и последовательно загружает только нужные фрагменты в **RAM-буфер (200 МБ)**. **На диск VPS не пишется ни единого байта (`UseDisk: false`)!**
4. **▶️ Плеер (HTML5 / HLS / Smart TV)**:
   Видео запускается уже через **3–5 секунд** после клика на Play. После окончания просмотра буфер оперативной памяти автоматически освобождается.

### Сравнение: Торрент-качалка vs. Zero-Disk Стриминг:

| Параметр | Классическая торрент-качалка (qBittorrent / Radarr) | Наш Zero-Disk Стриминг (Alex HD + TorrServer) |
| :--- | :--- | :--- |
| **Хранилище на сервере** | Требуются диски на **4–16 ТБ** (очень дорого) | **0 байт на диске** (хватает 10–20 ГБ SSD за 200–300 ₽/мес) |
| **Время ожидания** | Ждать **15–40 минут**, пока файл скачается | Старт видео **через 3–5 секунд** |
| **Нагрузка на SSD** | Быстрый износ диска терабайтами записей | **0 износа** — всё работает в оперативной памяти (RAM) |
| **Обслуживание** | Нужно постоянно удалять старые фильмы | Диск никогда не забивается, можно смотреть бесконечно |

### Идеальная конфигурация TorrServer для стриминга в RAM:

Выполните на VPS следующую команду через API TorrServer:

```bash
curl -X POST http://127.0.0.1:8090/settings/set \
  -H "Content-Type: application/json" \
  -d '{
    "CacheSize": 209715200,
    "PreloadCache": 50,
    "UseDisk": false,
    "ReaderReadAHead": 95,
    "RetrackersMode": 1,
    "TorrentDisconnectTimeout": 30
  }'
```

* **`CacheSize: 209715200`** — 200 МБ RAM под кольцевой буфер (достаточно даже для 4K HDR Remux битрейтом 80-100 Мбит/с).
* **`UseDisk: false`** — полный запрет на сохранение торрентов на диск VPS.
* **`PreloadCache: 50`** — старт плеера сразу после предзагрузки половины буфера (3–5 сек).
* **`RetrackersMode: 1`** — включение локальных пиров и ретрекеров для максимальной скорости в РФ/СНГ.

---

# РАЗДЕЛ 1. Вариант 1 (Vercel + Выделенный VPS) — Пошаговое развертывание

### Шаг 1. Подключение к чистому VPS (Ubuntu 22.04 / 24.04 LTS)

```bash
ssh root@IP_ВАШЕГО_VPS
```

---

### Шаг 2. Обновление системы, утилиты и файл подкачки (Swap 4GB)

Swap 4GB гарантирует, что сервер не упадёт при пиковых нагрузках при одновременном просмотре нескольких 4K-потоков:

```bash
# 1. Обновляем репозитории и пакеты
sudo apt update && sudo apt upgrade -y

# 2. Устанавливаем системные утилиты, компиляторы и PostgreSQL
sudo apt install -y curl wget git build-essential ufw software-properties-common \
                    postgresql postgresql-contrib libpq-dev \
                    htop iotop net-tools ffmpeg jq fail2ban unattended-upgrades

# 3. Создаем Swap 4GB
if [ $(swapon --show | wc -l) -le 1 ]; then
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  echo ">>> Swap 4GB успешно создан!"
fi
```

---

### Шаг 3. Установка Node.js 20 LTS, Docker и PM2

```bash
# 1. Устанавливаем Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Устанавливаем PM2 глобально
sudo npm install -g pm2

# 3. Устанавливаем Docker & Docker Compose (для Prowlarr и FlareSolverr)
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker
```

---

### Шаг 4. Настройка PostgreSQL 15+ и инициализация базы данных

```bash
# 1. Создаем пользователя базы данных и базу
sudo -u postgres psql << 'EOF'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'alexhd_user') THEN
    CREATE USER alexhd_user WITH ENCRYPTED PASSWORD 'StrongAlexHdPass2026!';
  END IF;
END
$$;

CREATE DATABASE alexhd_db WITH OWNER alexhd_user;
GRANT ALL PRIVILEGES ON DATABASE alexhd_db TO alexhd_user;
\c alexhd_db
GRANT ALL ON SCHEMA public TO alexhd_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO alexhd_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO alexhd_user;
EOF
```

```bash
# 2. Применяем схему структуры и создаем дефолтного администратора
cat << 'EOF' > /tmp/init_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(64) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) DEFAULT 'user' NOT NULL,
  plan VARCHAR(32) DEFAULT 'standard' NOT NULL,
  subscription_expires_at TIMESTAMPTZ,
  is_blocked BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(128) NOT NULL,
  device_name VARCHAR(128) NOT NULL,
  platform VARCHAR(32) NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT uq_user_device UNIQUE (user_id, device_id)
);

CREATE TABLE IF NOT EXISTS content (
  id VARCHAR(64) PRIMARY KEY,
  tmdb_id INTEGER UNIQUE,
  type VARCHAR(32) NOT NULL,
  title VARCHAR(512) NOT NULL,
  original_title VARCHAR(512),
  release_year SMALLINT NOT NULL,
  age_rating VARCHAR(16),
  rating_imdb NUMERIC(3, 1),
  rating_tmdb NUMERIC(3, 1),
  runtime_minutes SMALLINT,
  overview TEXT,
  poster_url VARCHAR(1024),
  backdrop_url VARCHAR(1024),
  is_4k BOOLEAN DEFAULT FALSE NOT NULL,
  is_published BOOLEAN DEFAULT TRUE NOT NULL,
  play_count BIGINT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS history (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id VARCHAR(64) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  season_id VARCHAR(64),
  episode_id VARCHAR(64),
  position_seconds INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  is_finished BOOLEAN DEFAULT FALSE NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT uq_user_history_entry UNIQUE (user_id, content_id, episode_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id VARCHAR(64) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (user_id, content_id)
);

CREATE TABLE IF NOT EXISTS watchlist (
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id VARCHAR(64) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (user_id, content_id)
);

CREATE TABLE IF NOT EXISTS streaming_nodes (
  id VARCHAR(64) PRIMARY KEY,
  hostname VARCHAR(255) NOT NULL,
  region VARCHAR(64) NOT NULL,
  type VARCHAR(32) DEFAULT 'torrserver' NOT NULL,
  max_capacity INTEGER DEFAULT 50 NOT NULL,
  active_streams INTEGER DEFAULT 0 NOT NULL,
  bandwidth_mbps INTEGER DEFAULT 0 NOT NULL,
  cpu_usage_percent INTEGER DEFAULT 0 NOT NULL,
  ram_usage_percent INTEGER DEFAULT 0 NOT NULL,
  disk_usage_percent INTEGER DEFAULT 0 NOT NULL,
  is_online BOOLEAN DEFAULT TRUE NOT NULL,
  last_heartbeat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Дефолтный Администратор: alex_admin / admin123
INSERT INTO users (id, email, username, password_hash, role, plan, subscription_expires_at)
VALUES (
  'usr-admin-01',
  'admin@smarttv.com',
  'alex_admin',
  '$2a$10$wN30XNq1r3mB.YxY9QJpUO7z9Q7G0Dk4B3W3T9N2B4L5K6J7H8G9A',
  'admin',
  '4k',
  NOW() + INTERVAL '365 days'
)
ON CONFLICT (id) DO NOTHING;

-- Локальный узел TorrServer
INSERT INTO streaming_nodes (id, hostname, region, type, max_capacity, is_online)
VALUES (
  'node-local-01',
  '127.0.0.1:8090',
  'Локальный стриминговый узел (RAM Cache)',
  'torrserver',
  100,
  TRUE
)
ON CONFLICT (id) DO NOTHING;
EOF

PGPASSWORD='StrongAlexHdPass2026!' psql -h 127.0.0.1 -U alexhd_user -d alexhd_db -f /tmp/init_schema.sql
rm /tmp/init_schema.sql
```

---

### Шаг 5. Установка и автозапуск TorrServer MatriX (RAM Режим)

```bash
# 1. Создаем каталоги
sudo mkdir -p /opt/torrserver /var/lib/torrserver/db

# 2. Скачиваем бинарник TorrServer MatriX
cd /opt/torrserver
sudo wget https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-amd64 -O torrserver || sudo curl -L https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-amd64 -o torrserver
sudo chmod +x torrserver

# 3. Создаем системного пользователя
sudo useradd -r -s /bin/false torruser || true
sudo chown -R torruser:torruser /opt/torrserver /var/lib/torrserver

# 4. Создаем службу systemd
sudo tee /etc/systemd/system/torrserver.service > /dev/null << 'EOF'
[Unit]
Description=TorrServer MatriX Streaming Engine (Zero-Disk RAM)
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=torruser
Group=torruser
WorkingDirectory=/opt/torrserver
ExecStart=/opt/torrserver/torrserver -p 8090 -d /var/lib/torrserver/db
Restart=always
RestartSec=3
LimitNOFILE=65536
LimitNPROC=65536
MemoryMax=3G
MemoryHigh=2.5G

[Install]
WantedBy=multi-user.target
EOF

# 5. Тюнинг сетевых буферов ядра Linux для 4K HDR (BBR)
sudo tee /etc/sysctl.d/99-torrserver.conf > /dev/null << 'EOF'
net.core.rmem_max = 67108864
net.core.wmem_max = 67108864
net.core.rmem_default = 33554432
net.core.wmem_default = 33554432
net.core.netdev_max_backlog = 10000
net.core.somaxconn = 4096
net.ipv4.tcp_rmem = 4096 87380 33554432
net.ipv4.tcp_wmem = 4096 65536 33554432
net.ipv4.tcp_congestion_control = bbr
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_tw_reuse = 1
EOF

sudo sysctl --system
sudo systemctl daemon-reload
sudo systemctl enable --now torrserver

# Проверка:
curl -s http://127.0.0.1:8090/echo
# Ответ: MatriX.134 или выше
```

---

### Шаг 6. Развертывание Prowlarr и FlareSolverr (Поисковый шлюз)

Запускаем Prowlarr с независимыми DNS-серверами Яндекса и Cloudflare (чтобы трекеры не блокировались локальным DNS провайдера VPS):

```bash
# 1. Запуск FlareSolverr (решение Cloudflare капч)
sudo docker run -d \
  --name=flaresolverr \
  -p 8191:8191 \
  -e LOG_LEVEL=info \
  -e TZ=Europe/Moscow \
  --restart always \
  ghcr.io/flaresolverr/flaresolverr:latest

# 2. Запуск Prowlarr
sudo mkdir -p /opt/prowlarr/config
sudo docker run -d \
  --name=prowlarr \
  -p 9696:9696 \
  --dns 77.88.8.8 \
  --dns 1.1.1.1 \
  -e PUID=1000 \
  -e PGID=1000 \
  -e TZ=Europe/Moscow \
  -v /opt/prowlarr/config:/config \
  --restart always \
  lscr.io/linuxserver/prowlarr:latest
```

* Откройте веб-панель Prowlarr: `http://IP_ВАШЕГО_VPS:9696`.
* Перейдите в **Settings &rarr; General** и скопируйте **API Key** (он понадобится для интеграции).

---

### Шаг 7. Сборка и запуск Alex HD Core Backend (PM2)

```bash
sudo mkdir -p /var/www/alexhd
sudo chown -R $USER:$USER /var/www/alexhd
cd /var/www/alexhd

# Клонируем проект или переносим файлы
git clone ВАШ_URL_РЕПОЗИТОРИЯ .

npm install
npm run build

# Создаем файл .env
cat << 'EOF' > /var/www/alexhd/.env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgres://alexhd_user:StrongAlexHdPass2026!@127.0.0.1:5432/alexhd_db
JWT_SECRET=super_secret_jwt_alexhd_production_token_8899221100ffaa
MAX_DEVICES_PER_USER=3
TORRSERVER_URL=http://127.0.0.1:8090
PROWLARR_URL=http://127.0.0.1:9696
PROWLARR_API_KEY=ВАШ_API_КЛЮЧ_ИЗ_PROWLARR
TMDB_API_KEY=
EOF

# Конфигурация PM2
cat << 'EOF' > /var/www/alexhd/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'alexhd-core',
      script: 'dist/server.cjs',
      cwd: '/var/www/alexhd',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/www/alexhd/logs/pm2-error.log',
      out_file: '/var/www/alexhd/logs/pm2-out.log',
      merge_logs: true
    }
  ]
};
EOF

mkdir -p /var/www/alexhd/logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

### Шаг 8. Настройка Брандмауэра UFW (Открытие портов)

```bash
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 3000/tcp comment 'Alex HD Core API'
sudo ufw allow 8090/tcp comment 'TorrServer MatriX'
sudo ufw allow 9696/tcp comment 'Prowlarr Web/API'
sudo ufw allow 35432/tcp comment 'TorrServer DHT TCP'
sudo ufw allow 35432/udp comment 'TorrServer DHT UDP'
sudo ufw allow 51413/tcp comment 'TorrServer Peer Wire TCP'
sudo ufw allow 51413/udp comment 'TorrServer Peer Wire UDP'
sudo ufw --force enable
sudo ufw status
```

---

### Шаг 9. Развертывание фронтенда на Vercel (`alex-hd.vercel.app`)

1. Авторизуйтесь на **[vercel.com](https://vercel.com/)** через GitHub.
2. Нажмите **"Add New..."** &rarr; **"Project"** &rarr; импортируйте репозиторий **Alex HD**.
3. Укажите параметры сборки:
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. В разделе **Environment Variables** добавьте переменные:
   - `VITE_API_URL` = `http://IP_ВАШЕГО_VPS:3000`
   - `VITE_TORRSERVER_URL` = `http://IP_ВАШЕГО_VPS:8090`
5. Нажмите **Deploy**.

---

### Шаг 10. Подключение Smart TV (Media Station X / MSX)

1. Установите **Media Station X** из каталога приложений телевизора (Samsung Tizen, LG webOS, Android TV, Apple TV).
2. Зайдите в **Settings &rarr; Start Parameter &rarr; Setup**.
3. Введите адрес: `https://alex-hd.vercel.app/msx.json` и нажмите **Confirm**.
4. Интерфейс запустится на весь экран и полностью управляется стандартным пультом ТВ.

---

# РАЗДЕЛ 2. Защита VPS: Fail2ban, SSH-ключи и Hardening

Для защиты вашего сервера от сканеров, ботнетов и попыток взлома настройте комплексную защиту:

### 1. Установка и настройка Fail2ban

Создайте конфигурационный файл `/etc/fail2ban/jail.local`:

```bash
sudo bash -c 'cat > /etc/fail2ban/jail.local << "EOF"
[DEFAULT]
bantime = 24h
findtime = 10m
maxretry = 3
banaction = ufw
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
port = http,https

[nginx-botsearch]
enabled = true
port = http,https
maxretry = 2
EOF'

sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

**Команды управления Fail2ban:**
* Проверить заблокированные IP: `sudo fail2ban-client status sshd`
* Разблокировать IP: `sudo fail2ban-client set sshd unbanip 1.2.3.4`

### 2. SSH Hardening (Вход строго по ключам, отключение паролей)

1. **Сначала скопируйте ваш публичный ключ на VPS с домашнего компьютера:**
   ```bash
   ssh-copy-id root@IP_ВАШЕГО_VPS
   ```
2. **Проверьте, что вход по ключу работает без пароля.**
3. **Отключите аутентификацию по паролю на VPS:**
   ```bash
   sudo bash -c 'echo "PasswordAuthentication no" >> /etc/ssh/sshd_config.d/99-disable-passwords.conf'
   sudo bash -c 'echo "PermitRootLogin prohibit-password" >> /etc/ssh/sshd_config.d/99-disable-passwords.conf'
   sudo systemctl restart ssh || sudo systemctl restart sshd
   ```

### 3. Защита от брутфорса на уровне ядра (UFW Rate Limit)

```bash
sudo ufw limit 22/tcp comment 'Anti-brute force rate limit'
```

---

# РАЗДЕЛ 3. Prowlarr: Трекеры, Индексаторы и FlareSolverr

### Почему TMDB + Prowlarr вместо IMDb:
* **TMDB API** — обеспечивает быструю и красивую витрину (постеры, актеры, русские/английские названия, трейлеры, описания).
* **Prowlarr** — поисковый шлюз, опрашивающий реальные торрент-трекеры в реальном времени.

### Рекомендуемый список трекеров для добавления в Prowlarr:
1. **RuTracker.org** *(требуется аккаунт)* — самый полный каталог дубляжей, редких фильмов и коллекций.
2. **Rutor (rutor.info)** *(без регистрации)* — открытый трекер со всеми свежими новинками кинопроката.
3. **Kinozal.tv** *(требуется аккаунт)* — премиальные студийные озвучки (Red Head Sound, Flarrow Films, HDRezka).
4. **NNM-Club** *(без регистрации)* — лучшие 4K HDR / Dolby Vision Remux релизы с многоканальным звуком.
5. **LostFilm.tv** *(требуется аккаунт)* — зарубежные сериалы в топовом дубляже.
6. **1337x / TorrentGalaxy** *(без регистрации)* — оригиналы на английском языке с Dolby Atmos.

### Подключение FlareSolverr в Prowlarr (Обход Cloudflare):
1. В веб-панели Prowlarr (`http://IP_VPS:9696`) перейдите в **Settings &rarr; Indexers**.
2. В секции **Proxies** нажмите **+ (Add Proxy)** и выберите **FlareSolverr**.
3. В поле **Host** укажите: `http://127.0.0.1:8191`.
4. Нажмите **Test** &rarr; **Save**. Теперь проверки Cloudflare и капчи трекеров решаются автоматически в фоне.

---

# РАЗДЕЛ 4. Домен, DDNS и Прямой доступ по IP

### Вариант А. Доступ напрямую по IP БЕЗ домена:
Вам не требуется покупать домен. Вы можете открывать сервисы напрямую:
* Сайт и Плеер: `http://IP_VPS:3000`
* Стриминг TorrServer: `http://IP_VPS:8090`
* Поиск Prowlarr: `http://IP_VPS:9696`

Чтобы убрать порт `:3000` и открывать сайт просто как `http://IP_VPS/`, проксируйте трафик через стандартный 80-й порт в `/etc/nginx/sites-available/default`:
```nginx
server {
    listen 80 default_server;
    server_name _;

    location /torrserver/ {
        proxy_pass http://127.0.0.1:8090/;
        proxy_buffering off;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

### Вариант Б. Бесплатный динамический домен через DuckDNS + Бесплатный SSL:
1. Зарегистрируйтесь на **[duckdns.org](https://www.duckdns.org)** и создайте субдомен (например, `alex-cinema.duckdns.org`).
2. Настройте автообновление IP в Cron:
   ```bash
   mkdir -p ~/duckdns
   cat > ~/duckdns/duck.sh << 'EOF'
   echo url="https://www.duckdns.org/update?domains=ВАШ_ДОМЕН&token=ВАШ_ТОКЕН&ip=" | curl -k -o ~/duckdns/duck.log -K -
   EOF
   chmod 700 ~/duckdns/duck.sh
   (crontab -l 2>/dev/null; echo "*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1") | crontab -
   ```
3. Выпустите бесплатный сертификат Let's Encrypt:
   ```bash
   sudo certbot --nginx -d ВАШ_ДОМЕН.duckdns.org
   ```

### Вариант В. Собственный домен + Cloudflare:
1. Добавьте в DNS Cloudflare две A-записи, указывающие на IP вашего VPS:
   * `@` &rarr; `IP_ВАШЕГО_VPS` (Proxy Status: **Proxied / Оранжевое облако**)
   * `tv` &rarr; `IP_ВАШЕГО_VPS` (Proxy Status: **Proxied / Оранжевое облако**)
2. В панели Cloudflare включите режим SSL: **Full / Strict**.
3. Ваш реальный IP сервера будет скрыт от DDoS-атак, а трафик и постеры будут кэшироваться через глобальный CDN.

---

# РАЗДЕЛ 5. Вариант 2: All-in-One VPS с собственным доменом и Nginx + SSL

Конфигурация `/etc/nginx/sites-available/alexhd.conf`:

```nginx
proxy_cache_path /var/cache/nginx/alexhd_posters
    levels=1:2
    keys_zone=posters_cache:30m
    max_size=5g
    inactive=14d
    use_temp_path=off;

server {
    listen 80;
    server_name tv.yourdomain.com;
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name tv.yourdomain.com;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Device-Id' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range,Accept-Ranges' always;

    location /msx.json {
        alias /var/www/alexhd/public/msx.json;
        add_header Content-Type application/json;
        add_header Access-Control-Allow-Origin *;
    }

    location /t/p/ {
        proxy_pass https://image.tmdb.org/t/p/;
        proxy_cache posters_cache;
        proxy_cache_valid 200 30d;
        expires 30d;
    }

    # Стриминг TorrServer (Обязательно без буферизации Nginx!)
    location /torrserver/ {
        proxy_pass http://127.0.0.1:8090/;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 86400s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Активация и получение SSL:
```bash
sudo ln -sf /etc/nginx/sites-available/alexhd.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo certbot --nginx -d tv.yourdomain.com --non-interactive --agree-tos -m admin@yourdomain.com
sudo nginx -t && sudo systemctl restart nginx
```

---

# РАЗДЕЛ 6. Вариант 3: Запуск полного стека в Docker Compose

Создайте файл `docker-compose.yml`:

```yaml
version: '3.8'

services:
  torrserver:
    image: yourok/torrserver:latest
    container_name: alexhd-torrserver
    restart: always
    network_mode: host
    environment:
      - TS_PORT=8090
      - TS_DONTKILL=1
    volumes:
      - /var/lib/torrserver/db:/opt/torrserver/db

  prowlarr:
    image: lscr.io/linuxserver/prowlarr:latest
    container_name: alexhd-prowlarr
    restart: always
    network_mode: host
    dns:
      - 77.88.8.8
      - 1.1.1.1
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Moscow
    volumes:
      - /opt/prowlarr/config:/config

  flaresolverr:
    image: ghcr.io/flaresolverr/flaresolverr:latest
    container_name: alexhd-flaresolverr
    restart: always
    ports:
      - "8191:8191"
    environment:
      - LOG_LEVEL=info
      - TZ=Europe/Moscow

  postgres:
    image: postgres:15-alpine
    container_name: alexhd-postgres
    restart: always
    environment:
      POSTGRES_DB: alexhd_db
      POSTGRES_USER: alexhd_user
      POSTGRES_PASSWORD: StrongAlexHdPass2026!
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - /var/lib/postgresql/data:/var/lib/postgresql/data
```

Запуск:
```bash
docker compose up -d
```

---

# РАЗДЕЛ 7. Вариант 4: Легковесный режим (Только TorrServer)

```bash
sudo mkdir -p /opt/torrserver /var/lib/torrserver/db
cd /opt/torrserver
sudo wget https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-amd64 -O torrserver
sudo chmod +x torrserver
sudo nohup /opt/torrserver/torrserver -p 8090 -d /var/lib/torrserver/db > /var/log/torrserver.log 2>&1 &
sudo ufw allow 8090/tcp
```

---

# РАЗДЕЛ 8. Чек-лист проверки и Решение типовых проблем (Troubleshooting)

### Чек-лист проверки готовности системы:

| Компонент | Команда проверки | Ожидаемый результат |
|---|---|---|
| **TorrServer** | `curl -s http://127.0.0.1:8090/echo` | `MatriX.134` (или выше) |
| **Prowlarr** | `curl -s http://127.0.0.1:9696/ping` | `{"status":"OK"}` |
| **FlareSolverr** | `curl -s http://127.0.0.1:8191/` | `{"msg":"FlareSolverr is ready!"}` |
| **PostgreSQL** | `pg_isready -h 127.0.0.1 -p 5432` | `accepting connections` |
| **Core API** | `curl -s http://127.0.0.1:3000/api/v1/health` | `{"status":"ok","database":"connected"}` |
| **PM2 статус** | `pm2 status` | Сервис `alexhd-core` в статусе `online` |
| **Fail2ban** | `sudo fail2ban-client status sshd` | Статус службы и список заблокированных IP |

---

### Решение типовых проблем:

1. **Ошибка Mixed Content в браузере на ПК**:
   * *Причина*: Фронтенд на Vercel открыт по `https://`, а TorrServer отдает видео по `http://IP:8090`. Браузеры блокируют HTTP-видео внутри HTTPS.
   * *Решение*:
     1. На Smart TV (через Media Station X / MSX) этой проблемы **нет**, видео играет напрямую.
     2. На ПК в Chrome/Edge нажмите на иконку «Настройки сайта» слева от адресной строки и установите пункт **«Небезопасный контент» (Insecure content)** в значение **«Разрешить» (Allow)**.
     3. Или используйте проксирование через Nginx с SSL (Вариант 2 / Раздел 5).
2. **0 пиров / Скорость 0 KB/s**:
   * *Причина*: Закрыты P2P-порты в фаерволе.
   * *Решение*: Выполните `sudo ufw allow 35432/tcp && sudo ufw allow 35432/udp && sudo ufw allow 51413/tcp && sudo ufw allow 51413/udp`.
3. **Видео зависает каждые 5–10 секунд**:
   * *Причина*: В Nginx включена буферизация 4K потока.
   * *Решение*: В блоке `location /torrserver/` конфигурации Nginx обязательно укажите `proxy_buffering off;`.
4. **Prowlarr не находит торренты на RuTracker/Rutor**:
   * *Причина*: Локальный DNS хостинга блокирует домены трекеров или срабатывает Cloudflare защита.
   * *Решение*: Запускайте Prowlarr с DNS `77.88.8.8` и подключите FlareSolverr прокси в настройках Prowlarr.
