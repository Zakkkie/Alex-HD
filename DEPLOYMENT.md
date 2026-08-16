# Единое руководство по развертыванию платформы Alex HD (Production Deployment Guide)

Комплексное пошаговое руководство по развертыванию медиа-сервера **Alex HD** с поддержкой Smart TV (Samsung Tizen, LG webOS, Android TV, Apple TV, Media Station X), стриминга через **TorrServer MatriX** с локальным дисковым и оперативным кэшированием, защищенного обратного прокси **Nginx** с SSL-сертификатом Let's Encrypt и базой данных **PostgreSQL 15+**.

Каждый этап содержит **блок предварительной проверки (нужно ли выполнять)** и **команды валидации результатов**.

---

## Содержание

1. [Архитектура системы и требования к оборудованию](#1-архитектура-системы-и-требования-к-оборудованию)
2. [Этап 1: Подготовка сервера, утилит и Swap-памяти](#этап-1-подготовка-сервера-утилит-и-swap-памяти)
3. [Этап 2: Установка Node.js LTS и менеджера процессов PM2](#этап-2-установка-nodejs-lts-и-менеджера-процессов-pm2)
4. [Этап 3: Развертывание и инициализация PostgreSQL](#этап-3-развертывание-и-инициализация-postgresql)
5. [Этап 4: Установка и настройка TorrServer MatriX с кэшированием](#этап-4-установка-и-настройка-torrserver-matrix-с-кэшированием)
6. [Этап 5: Сборка и запуск Core Backend (Node.js + PM2)](#этап-5-сборка-и-запуск-core-backend-nodejs--pm2)
7. [Этап 6: Настройка Nginx, Smart TV CORS, TMDB Cache и SSL Let's Encrypt](#этап-6-настройка-nginx-smart-tv-cors-tmdb-cache-и-ssl-lets-encrypt)
8. [Этап 7: Настройка брандмауэра (UFW) и безопасность портов](#этап-7-настройка-брандмауэра-ufw-и-безопасность-портов)
9. [Этап 8: Подключение Smart TV и Media Station X (MSX)](#этап-8-подключение-smart-tv-и-media-station-x-msx)
10. [Этап 9: Альтернативное развертывание через Docker Compose](#этап-9-альтернативное-развертывание-через-docker-compose)
11. [Этап 10: Сводный чек-лист верификации и устранение неполадок](#этап-10-сводный-чек-лист-верификации-и-устранение-неполадок)

---

## 1. Архитектура системы и требования к оборудованию

### Схема взаимодействия компонентов

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 КЛИЕНТСКИЕ УСТРОЙСТВА                                  │
│  [Samsung Smart TV (Tizen)]    [LG Smart TV (webOS)]    [Android TV / Apple TV / MSX]  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTPS / WSS (:443)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                NGINX REVERSE PROXY & SSL                               │
│  - SSL / TLS 1.2/1.3 Termination (Let's Encrypt Auto-Renewal)                          │
│  - Smart TV CORS Headers (*, Range, X-Device-Id, Authorization)                        │
│  - Media Station X Entrypoint (/msx/start.json -> public/msx.json)                     │
│  - TMDB Poster Disk Cache (/t/p/ -> /var/cache/nginx/alexhd_posters)                   │
└───────────────────────┬────────────────────────────────────────┬───────────────────────┘
                        │                                        │
             /api/* & Web Interface                 /torrserver/* Stream
                        │ (HTTP :3000)                           │ (HTTP :8090, No Buffering)
                        ▼                                        ▼
┌────────────────────────────────────────┐    ┌──────────────────────────────────────────┐
│         CORE BACKEND SERVICE           │    │           TORRSERVER MATRIX              │
│       (Node.js / Express / Vite)       │    │          (Go Streaming Engine)           │
│  - Аутентификация JWT & Multi-Device   │    │  - Последовательный P2P буфер            │
│  - 10-Foot Spatial UI & Каталог        │    │  - Локальный кэш на NVMe/SSD накопитель  │
│  - Least-Loaded Node Load Balancer     │    │  - Отдача HTTP HLS/MP4 потоков           │
│  - Файловый логгер (logs/system.log)   │    └────────────────────┬─────────────────────┘
└───────────────────┬────────────────────┘                         │
                    │ SQL Queries                                  │ Read/Write P2P Chunks
                    ▼                                              ▼
┌────────────────────────────────────────┐    ┌──────────────────────────────────────────┐
│          POSTGRESQL 15+ DB             │    │         NVMe/SSD STORAGE CACHE           │
│  - Пользователи и устройства           │    │  - Директория /var/lib/torrserver/cache  │
│  - Каталог (Movies, Series, Episodes)  │    │  - Буфер для тяжелых 4K HDR Remux        │
│  - Таймкоды истории просмотра          │    └──────────────────────────────────────────┘
│  - Транзакции и телеметрия узлов       │
└────────────────────────────────────────┘
```

### Системные требования

| Параметр | Минимальные (1–3 потока 1080p) | Рекомендуемые (10–30 потоков 4K HDR) |
|---|---|---|
| **ОС** | Ubuntu 22.04 / 24.04 LTS, Debian 12 | Ubuntu 24.04 LTS (x86_64) |
| **Процессор (CPU)** | 2 ядра (2.4+ GHz) | 4–8 ядер (3.2+ GHz) |
| **Оперативная память (RAM)** | 4 GB | 8–16 GB RAM |
| **Дисковое пространство** | 40 GB SSD | 100–500 GB NVMe SSD |
| **Сетевой канал** | 100 Mbps (Unmetered) | 1 Gbps (Full Duplex) |
| **Выделенный IP** | Статический IPv4 + DNS A-запись | Статический IPv4 + домен с DNS A-записью |

---

## Этап 1: Подготовка сервера, утилит и Swap-памяти

### 1.1. Проверка необходимости
Проверьте наличие свободной памяти и установленных утилит:
```bash
free -h
df -h /
```
*Если в строке `Swap` отображается `0B` и объем RAM менее 4 GB, создание файла подкачки **обязательно** для предотвращения аварийного завершения OOM Killer.*

### 1.2. Выполнение действий

```bash
# Обновление индекса пакетов и системы
sudo apt update && sudo apt upgrade -y

# Установка системных утилит, Nginx, Certbot и PostgreSQL
sudo apt install -y curl wget git build-essential ufw software-properties-common \
                    nginx certbot python3-certbot-nginx \
                    postgresql postgresql-contrib libpq-dev \
                    htop iotop net-tools ffmpeg jq

# Создание Swap-файла 2–4 GB (если отсутствует)
if [ $(swapon --show | wc -l) -le 1 ]; then
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi
```

### 1.3. Валидация
```bash
swapon --show
# Должен отображаться /swapfile размером 4G
```

---

## Этап 2: Установка Node.js LTS и менеджера процессов PM2

### 2.1. Проверка необходимости
```bash
node -v
npm -v
pm2 -v
```
*Если Node.js отсутствует или версия ниже 20.x, выполните установку.*

### 2.2. Выполнение действий

```bash
# Установка репозитория NodeSource Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установка PM2 глобально
sudo npm install -g pm2
```

### 2.3. Валидация
```bash
node -v   # Вывод: v20.x.x
pm2 -v    # Вывод: 5.x.x
```

---

## Этап 3: Развертывание и инициализация PostgreSQL

### 3.1. Проверка необходимости
```bash
sudo systemctl is-active postgresql
```
*Если возвращает `inactive` или БД `alexhd_db` не создана, перейдите к инициализации.*

### 3.2. Создание БД и пользователя

```bash
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

### 3.3. Применение полной схемы DDL

Создайте и выполните файл миграции:

```bash
cat << 'EOF' > /tmp/init_schema.sql
-- ====================================================================
-- PostgreSQL Database Initialization Schema (DDL)
-- Alex HD Media Platform (Tizen / webOS / Android TV / MSX)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Пользователи
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

-- 2. Аппаратные устройства пользователей (Smart TV, Mobile, Web)
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

CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);

-- 3. Каталог медиа-контента
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

CREATE INDEX IF NOT EXISTS idx_content_type_published ON content(type, is_published);
CREATE INDEX IF NOT EXISTS idx_content_year ON content(release_year DESC);
CREATE INDEX IF NOT EXISTS idx_content_rating ON content(rating_imdb DESC);

-- 4. Сезоны сериалов
CREATE TABLE IF NOT EXISTS seasons (
  id VARCHAR(64) PRIMARY KEY,
  content_id VARCHAR(64) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  season_number SMALLINT NOT NULL,
  title VARCHAR(255),
  overview TEXT,
  poster_url VARCHAR(1024),
  CONSTRAINT uq_content_season UNIQUE (content_id, season_number)
);

CREATE INDEX IF NOT EXISTS idx_seasons_content ON seasons(content_id);

-- 5. Серии (Эпизоды)
CREATE TABLE IF NOT EXISTS episodes (
  id VARCHAR(64) PRIMARY KEY,
  season_id VARCHAR(64) NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  episode_number SMALLINT NOT NULL,
  title VARCHAR(255),
  overview TEXT,
  runtime_minutes SMALLINT,
  still_url VARCHAR(1024),
  CONSTRAINT uq_season_episode UNIQUE (season_id, episode_number)
);

CREATE INDEX IF NOT EXISTS idx_episodes_season ON episodes(season_id);

-- 6. Коллекции
CREATE TABLE IF NOT EXISTS collections (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  poster_url VARCHAR(1024),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS collection_items (
  collection_id VARCHAR(64) NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  content_id VARCHAR(64) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  PRIMARY KEY (collection_id, content_id)
);

-- 7. Списки пользователей (Избранное, Watchlist)
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

-- 8. История просмотров и синхронизация таймкодов
CREATE TABLE IF NOT EXISTS history (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id VARCHAR(64) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  season_id VARCHAR(64) REFERENCES seasons(id) ON DELETE SET NULL,
  episode_id VARCHAR(64) REFERENCES episodes(id) ON DELETE SET NULL,
  position_seconds INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  is_finished BOOLEAN DEFAULT FALSE NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT uq_user_history_entry UNIQUE (user_id, content_id, episode_id)
);

CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id, updated_at DESC);

-- 9. Edge-узлы стримингового кластера
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

-- 10. Финансовые транзакции
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id VARCHAR(32) NOT NULL,
  amount_rub INTEGER NOT NULL,
  provider VARCHAR(32) DEFAULT 'sbp' NOT NULL,
  status VARCHAR(32) DEFAULT 'completed' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 11. Администратор по умолчанию (логин: alex_admin / email: admin@smarttv.com)
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

-- 12. Регистрация локального узла TorrServer
INSERT INTO streaming_nodes (id, hostname, region, type, max_capacity, is_online)
VALUES (
  'node-local-01',
  '127.0.0.1:8090',
  'Локальный сервер (Local NVMe)',
  'torrserver',
  100,
  TRUE
)
ON CONFLICT (id) DO NOTHING;
EOF

PGPASSWORD='StrongAlexHdPass2026!' psql -h 127.0.0.1 -U alexhd_user -d alexhd_db -f /tmp/init_schema.sql
rm /tmp/init_schema.sql
```

### 3.4. Валидация
```bash
PGPASSWORD='StrongAlexHdPass2026!' psql -h 127.0.0.1 -U alexhd_user -d alexhd_db -c "\dt"
# В списке должны присутствовать 10 таблиц: users, devices, content, seasons, episodes, collections, collection_items, favorites, history, streaming_nodes, transactions.
```

---

## Этап 4: Установка и настройка TorrServer MatriX с кэшированием

### 4.1. Проверка необходимости
```bash
curl -s http://127.0.0.1:8090/echo
```
*Если ответ не `MatriX...`, значит TorrServer не установлен или не запущен.*

### 4.2. Выполнение действий

```bash
# Создание рабочей папки и структуры локального кэша
sudo mkdir -p /opt/torrserver
sudo mkdir -p /var/lib/torrserver/cache
sudo mkdir -p /var/lib/torrserver/db

# Загрузка актуального бинарного файла TorrServer MatriX (Linux x86_64)
cd /opt/torrserver
sudo wget https://github.com/anpaza/TorrServer/releases/latest/download/TorrServer-linux-amd64 -O torrserver
sudo chmod +x torrserver

# Создание системного пользователя для изоляции процессов
sudo useradd -r -s /bin/false torruser || true
sudo chown -R torruser:torruser /opt/torrserver /var/lib/torrserver

# Создание службы systemd
sudo tee /etc/systemd/system/torrserver.service > /dev/null << 'EOF'
[Unit]
Description=TorrServer MatriX Streaming Engine
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=torruser
Group=torruser
WorkingDirectory=/opt/torrserver
# -p 8090 : порт HTTP стриминга
# -d /var/lib/torrserver/db : база метаданных
# -t /var/lib/torrserver/cache : путь к NVMe/SSD кэшу
ExecStart=/opt/torrserver/torrserver -p 8090 -d /var/lib/torrserver/db -t /var/lib/torrserver/cache
Restart=always
RestartSec=3

# Лимиты для стабильной работы с 500+ P2P пирами
LimitNOFILE=65536
LimitNPROC=65536

# Ограничение памяти для защиты системы
MemoryMax=6G
MemoryHigh=5G

[Install]
WantedBy=multi-user.target
EOF

# Оптимизация сетевого стека ядра Linux для 4K P2P
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
```

### 4.3. Рекомендуемые параметры в веб-интерфейсе TorrServer
Откройте `http://YOUR_SERVER_IP:8090` (или после настройки Nginx `https://tv.yourdomain.com/torrserver/`):
- **Cache Size (Размер кэша в RAM):** `200 MB`
- **Preload Buffer (Буфер предзагрузки):** `50 MB`
- **Connections Limit:** `150–200`
- **Use DHT:** `Включено`
- **Disable save to disk (только при ограниченном SSD):** `Отключено` (при наличии быстрого NVMe кэш сохраняется на диск, обеспечивая мгновенный запуск).

### 4.4. Валидация
```bash
sudo systemctl status torrserver --no-pager
curl -s http://127.0.0.1:8090/echo
# Ответ: MatriX.134 (или актуальная версия)
```

---

## Этап 5: Сборка и запуск Core Backend (Node.js + PM2)

### 5.1. Проверка необходимости
```bash
pm2 describe alexhd-core
```
*Если процесс не найден или приложение обновлено, выполните сборку и перезапуск.*

### 5.2. Выполнение действий

```bash
# Подготовка директории
sudo mkdir -p /var/www/alexhd
sudo chown -R $USER:$USER /var/www/alexhd
cd /var/www/alexhd

# Склонируйте исходный код или скопируйте проект
# git clone <REPO_URL> .

# Установка зависимостей и компиляция (React SPA + Express Bundle dist/server.cjs)
npm install
npm run build

# Создание production файла переменных окружения
cat << 'EOF' > /var/www/alexhd/.env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgres://alexhd_user:StrongAlexHdPass2026!@127.0.0.1:5432/alexhd_db
JWT_SECRET=super_secret_jwt_alexhd_production_token_8899221100ffaa
MAX_DEVICES_PER_USER=3
TORRSERVER_URL=http://127.0.0.1:8090
TORRSERVER_LOCAL_CACHE_DIR=/var/lib/torrserver/cache
TMDB_API_KEY=
EOF

# Создание конфигурации PM2
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

# Создание каталога логов и старт сервиса
mkdir -p /var/www/alexhd/logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### 5.3. Валидация
```bash
pm2 status
curl -s http://127.0.0.1:3000/api/v1/health
# Ответ: {"status":"ok","database":"connected","timestamp":...}
```

---

## Этап 6: Настройка Nginx, Smart TV CORS, TMDB Cache и SSL Let's Encrypt

### 6.1. Проверка необходимости
Проверьте валидность и статус текущего Nginx:
```bash
sudo nginx -t
```

### 6.2. Создание виртуального хоста Nginx

Создайте файл `/etc/nginx/sites-available/alexhd.conf` (замените `tv.yourdomain.com` на ваш домен):

```nginx
# Зона дискового кэширования для постеров и графики TMDB
proxy_cache_path /var/cache/nginx/alexhd_posters
    levels=1:2
    keys_zone=posters_cache:30m
    max_size=5g
    inactive=14d
    use_temp_path=off;

# Ограничение частоты запросов для авторизации
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;

server {
    listen 80;
    server_name tv.yourdomain.com;

    # Для подтверждения владения доменом Certbot
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name tv.yourdomain.com;

    # Пути к сертификатам SSL (Certbot настроит автоматически)
    ssl_certificate /etc/letsencrypt/live/tv.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tv.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:20m;
    ssl_session_timeout 1d;

    client_max_body_size 100M;
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;

    # Gzip сжатие статики UI
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Глобальные CORS заголовки для Samsung Tizen, LG webOS и MSX
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Device-Id,X-App-Version' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range,Accept-Ranges' always;

    # 1. Media Station X (MSX) Entrypoint
    location /msx/start.json {
        alias /var/www/alexhd/public/msx.json;
        add_header Content-Type application/json;
        add_header Access-Control-Allow-Origin *;
    }

    # 2. Кэширующий прокси TMDB изображений
    location /t/p/ {
        proxy_pass https://image.tmdb.org/t/p/;
        proxy_cache posters_cache;
        proxy_cache_valid 200 30d;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_lock on;
        add_header X-Cache-Status $upstream_cache_status;
        expires 30d;
    }

    # 3. Маршрут к TorrServer Streaming Engine (Без буферизации Nginx)
    location /torrserver/ {
        proxy_pass http://127.0.0.1:8090/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # КРИТИЧНО для плавного 4K стриминга
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 4. Аутентификация с rate-limiting
    location /api/v1/auth/ {
        limit_req zone=auth_limit burst=15 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 5. Core API и Web Interface
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6.3. Активация и получение SSL Let's Encrypt

```bash
# Создание папки кэша
sudo mkdir -p /var/cache/nginx/alexhd_posters
sudo chown -R www-data:www-data /var/cache/nginx/alexhd_posters

# Активация сайта
sudo ln -sf /etc/nginx/sites-available/alexhd.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Выпуск SSL через Certbot
sudo certbot --nginx -d tv.yourdomain.com --non-interactive --agree-tos -m admin@yourdomain.com

# Перезапуск Nginx
sudo nginx -t && sudo systemctl restart nginx
```

### 6.4. Валидация
```bash
curl -I https://tv.yourdomain.com/api/v1/health
# Ответ: HTTP/2 200 OK
```

---

## Этап 7: Настройка брандмауэра (UFW) и безопасность портов

### 7.1. Проверка необходимости
```bash
sudo ufw status verbose
```

### 7.2. Настройка правил

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Системные порты
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# BitTorrent P2P порты TorrServer
sudo ufw allow 35432/tcp comment 'TorrServer DHT TCP'
sudo ufw allow 35432/udp comment 'TorrServer DHT UDP'
sudo ufw allow 51413/tcp comment 'TorrServer Peer Wire TCP'
sudo ufw allow 51413/udp comment 'TorrServer Peer Wire UDP'

# Активация
sudo ufw --force enable
```

### 7.3. Валидация
```bash
sudo ufw status
# Статус: active, порты 22, 80, 443, 35432, 51413 открыты.
```

---

## Этап 8: Подключение Smart TV и Media Station X (MSX)

1. **Media Station X (Samsung Tizen / LG webOS / Android TV):**
   - Установите приложение **Media Station X** из официального магазина ТВ.
   - Перейдите в **Settings -> Start Parameter -> Setup**.
   - Введите URL: `tv.yourdomain.com/msx/start.json` (или `tv.yourdomain.com`).
   - Нажмите **Confirm**. Запустится специализированный 10-Foot Spatial интерфейс Alex HD с управлением пультом ДУ (D-Pad, кнопки OK, Return, Play/Pause).

2. **Браузер Smart TV / ПК:**
   - Откройте `https://tv.yourdomain.com`.
   - В настройках видеоплеера URL TorrServer будет автоматически подставлен как `https://tv.yourdomain.com/torrserver`.

---

## Этап 9: Альтернативное развертывание через Docker Compose

Если вы предпочитаете контейнеризацию, используйте готовые манифесты из каталога `/deploy`:

### 9.1. Control Stack (PostgreSQL + Backend + Nginx Gateway)
```bash
cd /var/www/alexhd/deploy/control
mkdir -p secrets
echo "StrongAlexHdPass2026!" > secrets/postgres_password.txt
docker compose up -d
```

### 9.2. Edge Node (TorrServer с NVMe кэшем + Caddy SSL)
```bash
cd /var/www/alexhd/deploy/edge
sudo mkdir -p /mnt/nvme/torrents_cache
sudo chmod 777 /mnt/nvme/torrents_cache
docker compose up -d
```

---

## Этап 10: Сводный чек-лист верификации и устранение неполадок

### 10.1. Чек-лист проверки всех компонентов

| Компонент | Команда проверки | Ожидаемый результат |
|---|---|---|
| **PostgreSQL** | `pg_isready -h 127.0.0.1 -p 5432` | `accepting connections` |
| **TorrServer** | `curl -s http://127.0.0.1:8090/echo` | `MatriX.134` |
| **Backend API** | `curl -s http://127.0.0.1:3000/api/v1/health` | `{"status":"ok",...}` |
| **Nginx HTTPS** | `curl -I https://tv.yourdomain.com` | `HTTP/2 200` |
| **MSX Manifest** | `curl -s https://tv.yourdomain.com/msx/start.json` | `{"name":"Alex HD",...}` |
| **PM2 Process** | `pm2 status` | `alexhd-core (online)` |

### 10.2. Матрица устранения неполадок

| Проблема | Причина | Способ решения |
|---|---|---|
| **Mixed Content Error** | Плеер обращается к `http://IP:8090` с HTTPS-страницы | Укажите в настройках проксируемый путь `https://tv.yourdomain.com/torrserver` |
| **Зависания видео каждые 5 сек** | Включена буферизация Nginx | Проверьте наличие `proxy_buffering off;` в `location /torrserver/` |
| **0 Peers / 0 KB/s** | Закрыты порты BitTorrent в UFW | Проверьте правила `sudo ufw status` для портов `35432` и `51413` |
| **TorrServer OOM Killed** | Нехватка RAM при больших раздачах | Создайте Swap-файл (Этап 1) и ограничьте размер RAM кэша в TorrServer до 100–200 MB |
| **Переполнение диска кэшем** | Накопление старых видеофайлов | Настройте cron для очистки: `(crontab -l; echo "0 4 * * * find /var/lib/torrserver/cache -type f -atime +7 -delete") \| crontab -` |
| **Нет звука при 4K Remux** | Кодеки AC3/DTS не поддерживаются браузером | Используйте Smart TV с аппаратным декодированием или внешние плееры (VLC, Kodi) |

---

**Развертывание завершено! Сервер готов к потоковому воспроизведению 4K видео.**
