# Единое руководство по установке и развертыванию Alex HD

Полное практическое руководство по развертыванию медиа-платформы **Alex HD** с поддержкой Smart TV (Samsung Tizen, LG webOS, Android TV, Apple TV, Media Station X), P2P-стриминга через **TorrServer MatriX** с дисковым кэшированием на NVMe/SSD, базы данных **PostgreSQL 15+** и фронтенда на **Vercel**.

---

## Быстрый выбор варианта установки

| Вариант | Фронтенд | Бэкенд и База | TorrServer | Для кого подходит |
|---|---|---|---|---|
| **Вариант 1 («Как я делаю» — Рекомендуемый)** | **Vercel** (`alex-hd.vercel.app`) | **VPS** (Node.js + PostgreSQL) | **VPS** (NVMe кэш) | **Идеальный баланс**: быстрый CDN-фронтенд без нагрузки на VPS, а тяжелый стриминг и база — на сервере. |
| **Вариант 2 (All-in-One VPS + Nginx SSL)** | **Тот же VPS** | **Тот же VPS** | **Тот же VPS** | При наличии своего домена (например `tv.mydomain.com`) и желании держать всё на одной машине. |
| **Вариант 3 (Docker Compose)** | **Контейнер** | **Контейнеры** | **Контейнер** | Быстрый старт в изолированных контейнерах одной командой `docker compose up -d`. |
| **Вариант 4 (Только TorrServer)** | **Vercel** | Встроенная память | **VPS** (только порт 8090) | Минимальная установка только стримингового движка без базы данных. |

---

# ВАРИАНТ 1: «Как я делаю» — Vercel + Выделенный VPS (Рекомендуемый)

В этом сценарии:
1. **Фронтенд** работает на Vercel по адресу `https://alex-hd.vercel.app/` (быстрая загрузка интерфейса с CDN по всему миру, автодеплой при коммитах в Git).
2. **Бэкенд, База данных и TorrServer** работают на вашем чистом сервере VPS (Ubuntu 22.04 / 24.04).
3. **Smart TV** подключается через бесплатное приложение **Media Station X (MSX)**.

---

## Шаг 1. Подключение к чистому VPS серверу

Для удобного редактирования файлов и ввода команд подключитесь к VPS через **VS Code** (расширение *Remote - SSH*) или через обычный терминал:

```bash
ssh root@IP_ВАШЕГО_СЕРВЕРА
```
*(Замените `IP_ВАШЕГО_СЕРВЕРА` на реальный IP вашего VPS, например `194.87.123.45`)*.

---

## Шаг 2. Первичная настройка Ubuntu, утилиты и Swap (файл подкачки)

Файл подкачки (Swap) на 4GB необходим, чтобы при просмотре тяжелых 4K HDR Remux (60–90 GB) сервер не зависал и не аварийно завершал процессы при пиках нагрузки.

Выполните в терминале сервера:

```bash
# 1. Обновляем пакеты системы
sudo apt update && sudo apt upgrade -y

# 2. Устанавливаем необходимые системные утилиты, компиляторы и PostgreSQL
sudo apt install -y curl wget git build-essential ufw software-properties-common \
                    postgresql postgresql-contrib libpq-dev \
                    htop iotop net-tools ffmpeg jq

# 3. Создаем Swap 4GB (если еще не создан)
if [ $(swapon --show | wc -l) -le 1 ]; then
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  echo ">>> Swap 4GB успешно создан и подключен!"
else
  echo ">>> Swap уже был настроен ранее."
fi
```

---

## Шаг 3. Установка Node.js 20 LTS и менеджера процессов PM2

```bash
# 1. Подключаем репозиторий Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 2. Устанавливаем Node.js
sudo apt install -y nodejs

# 3. Устанавливаем PM2 глобально
sudo npm install -g pm2

# Проверяем версии
node -v # Должно быть v20.x.x
pm2 -v  # Должно быть 5.x.x
```

---

## Шаг 4. Настройка базы данных PostgreSQL 15+

Создаем пользователя базы данных `alexhd_user` и базу `alexhd_db`:

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

### Инициализация структуры таблиц и дефолтного администратора:

```bash
cat << 'EOF' > /tmp/init_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Пользователи
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

-- Привязанные Smart TV устройства (до 3 на аккаунт)
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

-- Каталог фильмов и сериалов
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

-- История просмотров и таймкоды
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

-- Избранное и Список "Буду смотреть"
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

-- Узлы TorrServer
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

-- Дефолтный Администратор:
-- Логин: alex_admin | Пароль: admin123 | Email: admin@smarttv.com
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

-- Локальный стриминговый узел
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

# Применяем схему к базе
PGPASSWORD='StrongAlexHdPass2026!' psql -h 127.0.0.1 -U alexhd_user -d alexhd_db -f /tmp/init_schema.sql
rm /tmp/init_schema.sql
```

---

## Шаг 5. Установка и автозапуск TorrServer MatriX с кэшем на SSD/NVMe

TorrServer последовательно скачивает торрент и кэширует его на диск в `/var/lib/torrserver/cache`, отдавая видео на Smart TV в виде стандартного HTTP-потока.

```bash
# 1. Создаем каталоги для бинарника, базы и дискового кэша
sudo mkdir -p /opt/torrserver
sudo mkdir -p /var/lib/torrserver/cache
sudo mkdir -p /var/lib/torrserver/db

# 2. Скачиваем официальный стабильный релиз TorrServer MatriX (x86_64)
cd /opt/torrserver
sudo wget https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-amd64 -O torrserver || sudo curl -L https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-amd64 -o torrserver
sudo chmod +x torrserver

# 3. Создаем системного пользователя torruser
sudo useradd -r -s /bin/false torruser || true
sudo chown -R torruser:torruser /opt/torrserver /var/lib/torrserver

# 4. Создаем службу systemd
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
ExecStart=/opt/torrserver/torrserver -p 8090 -d /var/lib/torrserver/db -t /var/lib/torrserver/cache
Restart=always
RestartSec=3
LimitNOFILE=65536
LimitNPROC=65536
MemoryMax=6G
MemoryHigh=5G

[Install]
WantedBy=multi-user.target
EOF

# 5. Оптимизация сети Linux (BBR и сетевые буферы под 4K HDR)
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
# Должно вернуть: MatriX.134 (или выше)
```

---

## Шаг 6. Сборка и запуск Alex HD Core Backend (Node.js + PM2)

```bash
# 1. Создаем папку проекта
sudo mkdir -p /var/www/alexhd
sudo chown -R $USER:$USER /var/www/alexhd
cd /var/www/alexhd

# 2. Клонируем репозиторий проекта (или перетащите файлы через VS Code)
git clone ВАШ_URL_РЕПОЗИТОРИЯ .

# 3. Устанавливаем зависимости и собираем проект
npm install
npm run build

# 4. Создаем файл конфигурации .env
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

# 5. Настраиваем PM2 для автозапуска
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

# 6. Запускаем службу через PM2 и сохраняем в автозагрузку
mkdir -p /var/www/alexhd/logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# (Если команда выведет строку "sudo env PATH=..." — скопируйте ее и выполните)

# Проверка работоспособности API:
curl -s http://127.0.0.1:3000/api/v1/health
# Должно вернуть: {"status":"ok","database":"connected",...}
```

---

## Шаг 7. Настройка брандмауэра UFW (Открытие портов)

Чтобы сайт на Vercel и Smart TV могли обращаться к бэкенду и стриминговому движку, открываем порты:

```bash
# 1. SSH порт (чтобы не потерять доступ к серверу!)
sudo ufw allow 22/tcp comment 'SSH'

# 2. Бэкенд API и TorrServer
sudo ufw allow 3000/tcp comment 'Alex HD Core API'
sudo ufw allow 8090/tcp comment 'TorrServer MatriX'

# 3. P2P порты для скачивания торрентов
sudo ufw allow 35432/tcp comment 'TorrServer DHT TCP'
sudo ufw allow 35432/udp comment 'TorrServer DHT UDP'
sudo ufw allow 51413/tcp comment 'TorrServer Peer Wire TCP'
sudo ufw allow 51413/udp comment 'TorrServer Peer Wire UDP'

# 4. Активируем фаервол
sudo ufw --force enable
sudo ufw status
```

---

## Шаг 8. Развертывание фронтенда на Vercel (`alex-hd.vercel.app`)

1. Зайдите на сайт **[vercel.com](https://vercel.com/)** под своим аккаунтом GitHub.
2. Нажмите **"Add New..."** -> **"Project"** -> выберите репозиторий **Alex HD** и нажмите **"Import"**.
3. В параметрах сборки убедитесь, что выбрано:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. В разделе **Environment Variables** добавьте 2 переменные, указывающие на ваш VPS сервер:
   - `VITE_API_URL` = `http://IP_ВАШЕГО_VPS:3000` *(например: `http://194.87.123.45:3000`)*
   - `VITE_TORRSERVER_URL` = `http://IP_ВАШЕГО_VPS:8090` *(например: `http://194.87.123.45:8090`)*
5. Нажмите **"Deploy"**. Через ~40 секунд ваш сайт будет доступен по адресу `https://alex-hd.vercel.app/`.

---

## Шаг 9. Подключение Smart TV (Media Station X / MSX)

1. Установите бесплатное приложение **Media Station X** из официального магазина приложений телевизора (**Samsung Smart TV Tizen**, **LG webOS**, **Android TV / Google TV**, **Apple TV**).
2. Запустите MSX, перейдите в **Settings** (Настройки) -> **Start Parameter** (Параметр запуска) -> **Setup** (Установка).
3. Введите адрес:
   ```text
   https://alex-hd.vercel.app/msx.json
   ```
4. Нажмите **Confirm (Подтвердить)**.
5. Приложение запустится в полноэкранном режиме с поддержкой пульта ДУ (стрелки, OK, Назад, Плей/Пауза).

---

# ВАРИАНТ 2: All-in-One VPS с собственным доменом и Nginx + SSL

Если у вас есть собственный домен (например, `tv.yourdomain.com`) и вы хотите, чтобы и фронтенд, и бэкенд, и TorrServer работали на одном сервере через защищенный HTTPS с сертификатом Let's Encrypt:

### 1. Выполните Шаги 1–5 из Варианта 1.
### 2. Соберите проект на сервере:
```bash
cd /var/www/alexhd
npm install && npm run build
pm2 start ecosystem.config.cjs
```

### 3. Создайте конфигурацию Nginx:
```bash
sudo mkdir -p /var/cache/nginx/alexhd_posters
sudo chown -R www-data:www-data /var/cache/nginx/alexhd_posters

sudo tee /etc/nginx/sites-available/alexhd.conf > /dev/null << 'EOF'
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

    # SSL сертификаты (Certbot заполнит пути автоматически)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # CORS заголовки для Smart TV
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Device-Id' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range,Accept-Ranges' always;

    # 1. Стартовый манифест MSX
    location /msx.json {
        alias /var/www/alexhd/public/msx.json;
        add_header Content-Type application/json;
        add_header Access-Control-Allow-Origin *;
    }

    # 2. Кэш постеров TMDB
    location /t/p/ {
        proxy_pass https://image.tmdb.org/t/p/;
        proxy_cache posters_cache;
        proxy_cache_valid 200 30d;
        expires 30d;
    }

    # 3. Видеопоток TorrServer (БЕЗ БУФЕРИЗАЦИИ NGINX!)
    location /torrserver/ {
        proxy_pass http://127.0.0.1:8090/;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 86400s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 4. Бэкенд API и статика SPA
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Активация и получение бесплатного SSL
sudo ln -sf /etc/nginx/sites-available/alexhd.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo certbot --nginx -d tv.yourdomain.com --non-interactive --agree-tos -m admin@yourdomain.com
sudo nginx -t && sudo systemctl restart nginx
```

---

# ВАРИАНТ 3: Быстрый запуск в Docker Compose

Если вы предпочитаете контейнеры Docker:

```bash
# 1. Клонируем проект
git clone ВАШ_URL_РЕПОЗИТОРИЯ /var/www/alexhd
cd /var/www/alexhd/deploy/control

# 2. Задаем пароль к базе данных
mkdir -p secrets
echo "StrongAlexHdPass2026!" > secrets/postgres_password.txt

# 3. Запускаем весь стек контейнеров в фоне
docker compose up -d

# Проверяем статус
docker compose ps
```

---

# ВАРИАНТ 4: Легковесный режим (Только TorrServer на VPS)

Если вам нужен только высокоскоростной стриминговый движок на сервере:

```bash
# 1. Скачиваем бинарник TorrServer
sudo mkdir -p /opt/torrserver /var/lib/torrserver/cache /var/lib/torrserver/db
cd /opt/torrserver
sudo wget https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-amd64 -O torrserver
sudo chmod +x torrserver

# 2. Запускаем одной командой в фоне
sudo nohup /opt/torrserver/torrserver -p 8090 -d /var/lib/torrserver/db -t /var/lib/torrserver/cache > /var/log/torrserver.log 2>&1 &

# 3. Открываем порт 8090
sudo ufw allow 8090/tcp
```
В настройках сайта на Vercel или локального плеера просто укажите `http://IP_СЕРВЕРА:8090`.

---

## Чек-лист проверки работоспособности

| Компонент | Команда проверки | Ожидаемый результат |
|---|---|---|
| **PostgreSQL** | `pg_isready -h 127.0.0.1 -p 5432` | `accepting connections` |
| **TorrServer** | `curl -s http://127.0.0.1:8090/echo` | `MatriX.134` (или выше) |
| **Core API** | `curl -s http://127.0.0.1:3000/api/v1/health` | `{"status":"ok","database":"connected"}` |
| **PM2 процесс** | `pm2 status` | Сервис `alexhd-core` со статусом `online` |
| **Брандмауэр** | `sudo ufw status` | Разрешены порты `22`, `3000`, `8090`, `35432`, `51413` |

---

## Решение типовых проблем (Troubleshooting)

1. **Видео зависает каждые 5–10 секунд**:
   - *Причина*: В Nginx включена буферизация тяжелого 4K потока.
   - *Решение*: Убедитесь, что в конфигурации Nginx в блоке `location /torrserver/` прописано `proxy_buffering off;`.
2. **0 пиров / Скорость 0 KB/s**:
   - *Причина*: Брандмауэр сервера закрывает P2P порты.
   - *Решение*: Выполните `sudo ufw allow 35432/tcp && sudo ufw allow 35432/udp && sudo ufw allow 51413/tcp && sudo ufw allow 51413/udp`.
3. **TorrServer падает при воспроизведении 4K Remux (OOM Killed)**:
   - *Причина*: Закончилась оперативная память без Swap.
   - *Решение*: Создайте Swap 4GB (Шаг 2 Варианта 1).
4. **Ошибка смешанного контента (Mixed Content) в браузере**:
   - *Причина*: Сайт открыт по `https://`, а видео запрашивается по `http://IP:8090`.
   - *Решение*: При использовании Vercel на ПК разрешите воспроизведение небезопасного контента для сайта в настройках браузера, либо на Smart TV используйте Media Station X (в MSX таких ограничений нет).
