# Единое руководство по развертыванию платформы Alex HD (Production Deployment Guide)

Комплексное пошаговое руководство по развертыванию медиа-сервера **Alex HD** с поддержкой Smart TV (Samsung Tizen, LG webOS, Android TV, Apple TV, Media Station X), стриминга через **TorrServer MatriX** с локальным дисковым и оперативным кэшированием, защищенного обратного прокси **Nginx** с SSL-сертификатом Let's Encrypt и базой данных **PostgreSQL 15+**.

> 💡 **Руководство составлено максимально подробно и доступно**: даже если вы никогда раньше не администрировали Linux-серверы, следуйте инструкции шаг за шагом. Каждый этап объясняет, *зачем* выполняется действие, *нужно ли* его выполнять, и *как проверить*, что все заработало.

---

## Содержание

0. [Этап 0: Подключение к чистому серверу через VS Code (Remote - SSH)](#этап-0-подключение-к-чистому-серверу-через-vs-code-remote---ssh)
1. [Архитектура системы и требования к серверу](#1-архитектура-системы-и-требования-к-серверу)
2. [Этап 1: Первичная настройка сервера, утилиты и файл подкачки (Swap)](#этап-1-первичная-настройка-сервера-утилиты-и-файл-подкачки-swap)
3. [Этап 2: Установка Node.js 20 LTS и менеджера процессов PM2](#этап-2-установка-nodejs-20-lts-и-менеджера-процессов-pm2)
4. [Этап 3: Установка, настройка и инициализация базы данных PostgreSQL](#этап-3-установка-настройка-и-инициализация-базы-данных-postgresql)
5. [Этап 4: Установка и настройка стримингового движка TorrServer MatriX с кэшем на NVMe/SSD](#этап-4-установка-и-настройка-стримингового-движка-torrserver-matrix-с-кэшем-на-nvmessd)
6. [Этап 5: Размещение проекта, сборка и запуск Core Backend (Node.js + PM2)](#этап-5-размещение-проекта-сборка-и-запуск-core-backend-nodejs--pm2)
7. [Этап 6: Настройка веб-сервера Nginx, CORS для Smart TV, кэша TMDB и SSL-сертификата Let's Encrypt](#этап-6-настройка-веб-сервера-nginx-cors-для-smart-tv-кэша-tmdb-и-ssl-сертификата-lets-encrypt)
8. [Этап 7: Настройка брандмауэра (UFW) и безопасность портов](#этап-7-настройка-брандмауэра-ufw-и-безопасность-портов)
9. [Этап 8: Подключение телевизоров Smart TV и приложения Media Station X (MSX)](#этап-8-подключение-телевизоров-smart-tv-и-приложения-media-station-x-msx)
10. [Этап 9: Альтернативный способ: запуск через Docker Compose](#этап-9-альтернативный-способ-запуск-через-docker-compose)
11. [Этап 10: Итоговая таблица проверки и решение типовых проблем (Troubleshooting)](#этап-10-итоговая-таблица-проверки-и-решение-типовых-проблем-troubleshooting)

---

## Этап 0: Подключение к чистому серверу через VS Code (Remote - SSH)

Visual Studio Code позволяет подключиться к удаленному серверу так, будто все файлы лежат прямо на вашем компьютере: вы получаете удобный проводник файлов, встроенный терминал с правами сервера и текстовый редактор с подсветкой синтаксиса.

### Что вам понадобится перед началом:
1. **IP-адрес вашего сервера** (например, `194.87.123.45` — выдается хостинг-провайдером).
2. **Имя пользователя** (обычно `root` или `ubuntu`).
3. **Пароль** или **SSH-ключ** (приходит на почту от хостинга или задается в панели управления сервером).
4. Установленная программа **Visual Studio Code** на вашем компьютере ([скачать с официального сайта](https://code.visualstudio.com/)).

---

### Шаг 0.1: Установка расширения Remote - SSH в VS Code

1. Откройте **Visual Studio Code** на вашем компьютере.
2. В левой боковой панели нажмите на иконку **Extensions (Расширения)** — значок из 4 квадратиков (или нажмите комбинацию клавиш `Ctrl+Shift+X` на Windows/Linux или `Cmd+Shift+X` на macOS).
3. В строке поиска введите: `Remote - SSH`.
4. Найдите расширение от компании **Microsoft** и нажмите кнопку **Install (Установить)**.
5. После установки в самом нижнем левом углу окна VS Code появится синяя кнопка со значком `><` (Open a Remote Window).

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ VS Code Extensions                                      [ Remote - SSH ]  │
│ ┌───────────────────────────────────────────────────────────────────────┐ │
│ │ 🔷 Remote - SSH (by Microsoft)                         [  Installed  ]│ │
│ │ Open any folder on a remote machine using SSH...                      │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

---

### Шаг 0.2: Первое подключение к серверу

1. В левом нижнем углу VS Code нажмите на синий значок `><` (или нажмите `F1` и введите `Remote-SSH: Connect to Host...`).
2. В появившемся сверху поле выберите пункт **Connect to Host... (Подключиться к хосту...)**.
3. Выберите **+ Add New SSH Host... (Добавить новый SSH хост)**.
4. Введите команду подключения в формате:
   ```text
   ssh root@ВАШ_IP_СЕРВЕРА
   ```
   *Пример:* `ssh root@194.87.123.45` (замените `194.87.123.45` на реальный IP вашего купленного сервера).
5. Нажмите `Enter`. VS Code спросит, в какой конфигурационный файл сохранить запись — выберите первый предложенный (обычно `C:\Users\ВашеИмя\.ssh\config` на Windows или `~/.ssh/config` на Mac/Linux).
6. В правом нижнем углу появится всплывающее уведомление "Host added". Нажмите кнопку **Connect (Подключиться)**.
7. Откроется новое окно VS Code:
   - Если спросит тип платформы сервера: выберите **Linux**.
   - Если появится предупреждение безопасности "The authenticity of host can't be established. Are you sure you want to continue?": нажмите **Continue (Продолжить)**.
   - Введите **пароль от сервера** и нажмите `Enter` *(обратите внимание: при вводе пароля в терминале символы могут не отображаться — это нормальная защита Linux, просто введите пароль и нажмите Enter)*.

---

### Шаг 0.3: Открытие терминала и папки сервера в VS Code

1. Когда подключение установится, в нижнем левом углу экрана будет гореть зеленая/синяя плашка: `SSH: 194.87.123.45`.
2. Чтобы открыть терминал сервера:
   - В верхнем меню нажмите **Terminal (Терминал)** -> **New Terminal (Новый терминал)** (или нажмите сочетание клавиш ``Ctrl+` ``).
   - В нижней части экрана откроется окно терминала с командной строкой вида `root@vds-server:~# `.
   - **Все команды из следующих глав вводятся прямо в этот терминал!** Вы можете просто копировать их из этого руководства и вставлять в терминал правой кнопкой мыши.
3. Чтобы просматривать и редактировать файлы на сервере как в обычном проводнике:
   - В верхнем меню нажмите **File (Файл)** -> **Open Folder (Открыть папку...)**.
   - Введите `/var/www/alexhd` (когда мы создадим эту папку на Этапе 5) или `/root` и нажмите **OK**.

---

## 1. Архитектура системы и требования к серверу

### Как всё устроено внутри:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 КЛИЕНТСКИЕ УСТРОЙСТВА                                  │
│  [Samsung Smart TV (Tizen)]    [LG Smart TV (webOS)]    [Android TV / Apple TV / MSX]  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTPS / WSS (Порт :443)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                NGINX REVERSE PROXY & SSL                               │
│  - Защищенный протокол HTTPS с автообновляемым сертификатом Let's Encrypt              │
│  - Специальные CORS-заголовки для Smart TV (разрешают воспроизведение на ТВ)           │
│  - Входная точка приложения для Media Station X (/msx/start.json)                      │
│  - Дисковый кэш постеров TMDB на сервере (ускоряет прогрузку каталога в 10 раз)       │
└───────────────────────┬────────────────────────────────────────┬───────────────────────┘
                        │                                        │
             /api/* & Веб-интерфейс                 /torrserver/* Видеопоток
                        │ (HTTP :3000)                           │ (HTTP :8090, Прямой стрим)
                        ▼                                        ▼
┌────────────────────────────────────────┐    ┌──────────────────────────────────────────┐
│         CORE BACKEND SERVICE           │    │           TORRSERVER MATRIX              │
│       (Node.js / Express / Vite)       │    │     (Стриминговый P2P видео-движок)      │
│  - Аутентификация JWT (Логин/Пароль)   │    │  - Последовательное скачивание кусков    │
│  - Лимит: до 3 ТВ-устройств на аккаунт │    │  - Быстрый кэш в RAM и на SSD/NVMe       │
│  - Управление каталогом и избранным    │    │  - Отдача стандартного потока HLS/MP4    │
│  - Балансировщик нагрузки нод (узлов)  │    └────────────────────┬─────────────────────┘
└───────────────────┬────────────────────┘                         │
                    │ Сохранение данных                            │ Чтение / Запись кэша
                    ▼                                              ▼
┌────────────────────────────────────────┐    ┌──────────────────────────────────────────┐
│          POSTGRESQL 15+ DB             │    │         NVMe/SSD КЭШ НА ДИСКЕ            │
│  - Таблицы пользователей и устройств   │    │  - Папка /var/lib/torrserver/cache       │
│  - Каталог фильмов, сезонов и серий    │    │  - Позволяет мгновенно перематывать 4K   │
│  - Секунды истории просмотра           │    └──────────────────────────────────────────┘
└────────────────────────────────────────┘
```

### Системные требования к серверу (VPS / VDS / Выделенный сервер)

| Параметр | Минимальные (1–3 зрителя одновременно, 1080p) | Рекомендуемые (10–30 зрителей 4K HDR Remux) |
|---|---|---|
| **Операционная система** | Ubuntu 22.04 LTS или 24.04 LTS (x86_64) | Ubuntu 24.04 LTS (x86_64) |
| **Процессор (CPU)** | 2 ядра (2.4+ GHz) | 4–8 ядер (3.2+ GHz) |
| **Оперативная память (RAM)** | 4 GB | 8–16 GB RAM |
| **Тип диска и объем** | 40–50 GB SSD | 100–500 GB NVMe SSD (быстрый кэш) |
| **Сетевой канал** | 100 Mbps (безлимитный трафик) | 1 Gbps (Full Duplex) |
| **IP-адрес** | Выделенный статический IPv4 + свой домен | Статический IPv4 + домен с DNS A-записью |

---

## Этап 1: Первичная настройка сервера, утилиты и файл подкачки (Swap)

### Зачем это нужно:
1. Серверу требуются базовые системные программы (`curl`, `git`, `nginx`, `postgresql`).
2. **Swap (файл подкачки)** — это резервная память на диске. Если при просмотре тяжелого 4K фильма оперативная память сервера заполнится, система не зависнет и не "убьет" процессы, а временно задействует Swap.

---

### Шаг 1.1: Проверка (нужно ли выполнять?)
Вставьте в терминал VS Code команду:
```bash
free -h
```
Посмотрите на строчку `Swap:`:
- Если там написано `0B` или `0Mi` — создание Swap **обязательно**.
- Если там уже есть 2G или 4G — шаг создания Swap можно пропустить.

---

### Шаг 1.2: Выполнение команд

Скопируйте весь блок команд ниже и вставьте в терминал:

```bash
# 1. Обновляем списки пакетов и установленные программы до свежих версий
sudo apt update && sudo apt upgrade -y

# 2. Устанавливаем необходимые системные утилиты, компиляторы, Nginx, Certbot и PostgreSQL
sudo apt install -y curl wget git build-essential ufw software-properties-common \
                    nginx certbot python3-certbot-nginx \
                    postgresql postgresql-contrib libpq-dev \
                    htop iotop net-tools ffmpeg jq

# 3. Создаем Swap-файл размером 4 Гигабайта (если он еще не создан)
if [ $(swapon --show | wc -l) -le 1 ]; then
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  echo "Файл подкачки 4GB успешно активирован!"
else
  echo "Swap уже был настроен ранее."
fi
```

---

### Шаг 1.3: Проверка результата
```bash
swapon --show
```
*Ожидаемый ответ:* Вы должны увидеть строку `/swapfile file 4G ...`.

---

## Этап 2: Установка Node.js 20 LTS и менеджера процессов PM2

### Зачем это нужно:
- **Node.js** — среда исполнения, на которой работает серверная часть Alex HD (Express API, балансировщик, обработка пользователей).
- **PM2** — специальный менеджер процессов: он запускает приложение в фоновом режиме, следит за его работой, ведет логи и автоматически перезапускает сервер в случае сбоя или перезагрузки всей машины.

---

### Шаг 2.1: Проверка (нужно ли выполнять?)
```bash
node -v
npm -v
pm2 -v
```
- Если команды возвращают ошибку `command not found` или версия Node.js ниже `v20.0.0` — выполните установку.
- Если выводится `v20.x.x` и версия PM2 — переходите к Этапу 3.

---

### Шаг 2.2: Выполнение команд

```bash
# 1. Подключаем официальный репозиторий Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 2. Устанавливаем Node.js и npm
sudo apt install -y nodejs

# 3. Устанавливаем PM2 глобально
sudo npm install -g pm2
```

---

### Шаг 2.3: Проверка результата
```bash
node -v
pm2 -v
```
*Ожидаемый ответ:* Node.js выведет что-то вроде `v20.18.0`, а PM2 выведет версию `5.4.x`.

---

## Этап 3: Установка, настройка и инициализация базы данных PostgreSQL

### Зачем это нужно:
База данных хранит зарегистрированных пользователей, привязанные телевизоры (до 3 шт. на аккаунт), историю недосмотренных фильмов с точностью до секунды, каталог и настройки нод стриминга.

---

### Шаг 3.1: Проверка (нужно ли выполнять?)
```bash
sudo systemctl is-active postgresql
```
- Если возвращает `active` — служба PostgreSQL работает.
- Если возвращает `inactive` или `unknown` — PostgreSQL нужно запустить и создать структуру таблиц.

---

### Шаг 3.2: Создание пользователя и базы данных

Выполните команду для создания базы `alexhd_db` и пользователя `alexhd_user` с надежным паролем:

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

---

### Шаг 3.3: Создание всех таблиц и администратора по умолчанию

Создаем SQL-скрипт схемы данных и сразу применяем его к базе:

```bash
cat << 'EOF' > /tmp/init_schema.sql
-- Инициализация расширений UUID и шифрования
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Таблица пользователей
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

-- 2. Таблица авторизованных устройств (Smart TV, MSX, Web)
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

-- 6. Подборки и коллекции
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

-- 7. Списки пользователей (Избранное и Буду смотреть)
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

-- 8. История просмотров и таймкоды
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

-- 9. Серверные стриминговые узлы (TorrServer ноды)
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

-- 10. Транзакции и подписки
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id VARCHAR(32) NOT NULL,
  amount_rub INTEGER NOT NULL,
  provider VARCHAR(32) DEFAULT 'sbp' NOT NULL,
  status VARCHAR(32) DEFAULT 'completed' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 11. Создание стандартного администратора
-- Логин: alex_admin  |  Пароль: admin123  |  Email: admin@smarttv.com
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

-- 12. Регистрация локального узла стриминга
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

# Применяем схему к базе данных
PGPASSWORD='StrongAlexHdPass2026!' psql -h 127.0.0.1 -U alexhd_user -d alexhd_db -f /tmp/init_schema.sql
rm /tmp/init_schema.sql
```

---

### Шаг 3.4: Проверка результата
```bash
PGPASSWORD='StrongAlexHdPass2026!' psql -h 127.0.0.1 -U alexhd_user -d alexhd_db -c "\dt"
```
*Ожидаемый ответ:* Вы должны увидеть список из 10 созданных таблиц (`users`, `devices`, `content`, `history`, `streaming_nodes` и др.).

---

## Этап 4: Установка и настройка стримингового движка TorrServer MatriX с кэшем на NVMe/SSD

### Зачем это нужно:
**TorrServer MatriX** — это сердце видеостриминга:
1. Он берет magnet-ссылку торрента, находит пиров и начинает скачивать куски видеофайла строго последовательно (от начала к концу).
2. Он сохраняет предварительно скачанный кусок (буфер) на быстрый NVMe/SSD диск сервера в папку `/var/lib/torrserver/cache`.
3. Отдает видео на телевизор или в браузер в виде обычного HTTP-потока. Smart TV "думает", что проигрывает обычный MP4/HLS файл с онлайн-кинотеатра, без необходимости ставить торрент-клиент на сам телевизор.

---

### Шаг 4.1: Проверка (нужно ли выполнять?)
```bash
curl -s http://127.0.0.1:8090/echo
```
- Если возвращается `MatriX.134` (или похожая версия) — TorrServer уже установлен и запущен.
- Если возвращается `Failed to connect` или тишина — выполните установку ниже.

---

### Шаг 4.2: Установка бинарного файла и создание службы systemd

Выполните следующие команды:

```bash
# 1. Создаем папки для программы, базы и дискового кэша
sudo mkdir -p /opt/torrserver
sudo mkdir -p /var/lib/torrserver/cache
sudo mkdir -p /var/lib/torrserver/db

# 2. Скачиваем официальный свежий релиз TorrServer MatriX для Linux x86_64 (репозиторий YouROK/TorrServer)
cd /opt/torrserver
sudo wget https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-amd64 -O torrserver || sudo curl -L https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-amd64 -o torrserver
sudo chmod +x torrserver

# 3. Создаем изолированного системного пользователя torruser для безопасности
sudo useradd -r -s /bin/false torruser || true
sudo chown -R torruser:torruser /opt/torrserver /var/lib/torrserver

# 4. Создаем службу автозапуска systemd
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
# Флаги запуска:
# -p 8090 : локальный порт для стрима
# -d /var/lib/torrserver/db : база данных активных раздач
# -t /var/lib/torrserver/cache : папка дискового кэша на SSD/NVMe
ExecStart=/opt/torrserver/torrserver -p 8090 -d /var/lib/torrserver/db -t /var/lib/torrserver/cache
Restart=always
RestartSec=3

# Лимит открытых сетевых файлов для 500+ пиров
LimitNOFILE=65536
LimitNPROC=65536

# Защита от переполнения памяти
MemoryMax=6G
MemoryHigh=5G

[Install]
WantedBy=multi-user.target
EOF

# 5. Оптимизируем настройки сети ядра Linux для мгновенной передачи 4K HDR
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

# 6. Применяем параметры сети и запускаем службу
sudo sysctl --system
sudo systemctl daemon-reload
sudo systemctl enable --now torrserver
```

---

### Шаг 4.3: Проверка результата
```bash
sudo systemctl status torrserver --no-pager
curl -s http://127.0.0.1:8090/echo
```
*Ожидаемый ответ:* Служба имеет статус `active (running)`, а команда curl возвращает `MatriX.134` (или выше).

---

## Этап 5: Размещение проекта, сборка и запуск Core Backend (Node.js + PM2)

### Зачем это нужно:
Мы собираем интерфейс приложения (React SPA) и бэкенд (Express сервер) в единый оптимизированный билд `dist/server.cjs` и ставим его на автозапуск через PM2.

---

### Шаг 5.1: Размещение исходных файлов на сервере

1. В терминале VS Code создаем рабочую папку и выдаем права вашему пользователю:
   ```bash
   sudo mkdir -p /var/www/alexhd
   sudo chown -R $USER:$USER /var/www/alexhd
   cd /var/www/alexhd
   ```

2. **Как перенести файлы проекта из VS Code на сервер**:
   - **Вариант А (через Git — самый простой)**:
     ```bash
     git clone ВАШ_URL_РЕПОЗИТОРИЯ .
     ```
   - **Вариант Б (перетаскивание мышкой в VS Code)**:
     Откройте в левой панели VS Code проводник папки `/var/www/alexhd` и просто перетащите файлы проекта туда с локального компьютера.

---

### Шаг 5.2: Установка зависимостей и компиляция

Находясь в папке `/var/www/alexhd`, выполните:

```bash
# 1. Устанавливаем библиотеки проекта
npm install

# 2. Компилируем фронтенд и собираем backend в единый файл dist/server.cjs
npm run build
```
*(После сборки появится папка `dist/` с клиентскими файлами и `dist/server.cjs`)*.

---

### Шаг 5.3: Создание конфигурационного файла переменных `.env`

Создайте файл окружения на сервере:

```bash
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
```

---

### Шаг 5.4: Настройка и запуск через PM2

Создаем файл конфигурации PM2 и запускаем фоновый процесс:

```bash
# 1. Создаем конфигурацию PM2
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

# 2. Создаем папку под логи, запускаем и сохраняем в автозагрузку
mkdir -p /var/www/alexhd/logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```
*(Если `pm2 startup` выведет строку команды `sudo env PATH=...` — скопируйте ее и выполните в терминале один раз)*.

---

### Шаг 5.5: Проверка результата
```bash
pm2 status
curl -s http://127.0.0.1:3000/api/v1/health
```
*Ожидаемый ответ:* В таблице PM2 сервис `alexhd-core` имеет статус `online`, а команда curl возвращает JSON вида `{"status":"ok","database":"connected",...}`.

---

## Этап 6: Настройка веб-сервера Nginx, CORS для Smart TV, кэша TMDB и SSL-сертификата Let's Encrypt

### Зачем это нужно:
1. **Nginx** принимает все входящие подключения на стандартные порты `80` (HTTP) и `443` (HTTPS).
2. Он защищает соединение бесплатным SSL-сертификатом от **Let's Encrypt** (без HTTPS современные телевизоры и браузеры блокируют воспроизведение и выдают ошибку безопасности).
3. Nginx отключает буферизацию для маршрута `/torrserver/` (`proxy_buffering off;`) — это критически важно, чтобы видео шло плавно и без микрофризов каждые 5 секунд.
4. Кэширует постеры с серверов TMDB на диск в `/var/cache/nginx/alexhd_posters`, чтобы каталог на телевизоре открывался мгновенно даже при медленном интернете.

---

### Шаг 6.1: Создание конфигурации Nginx

> ⚠️ **Важно**: Перед выполнением замените во всех местах `tv.yourdomain.com` на **ваш реальный домен** или поддомен (например, `media.alexhd.ru`), для которого вы заранее прописали **DNS A-запись** с IP-адресом вашего сервера!

Выполните команду для записи конфигурации:

```bash
# 1. Создаем папку для дискового кэша постеров
sudo mkdir -p /var/cache/nginx/alexhd_posters
sudo chown -R www-data:www-data /var/cache/nginx/alexhd_posters

# 2. Создаем конфиг сайта (замените tv.yourdomain.com на ваш домен!)
sudo tee /etc/nginx/sites-available/alexhd.conf > /dev/null << 'EOF'
# Зона дискового кэширования для постеров фильмов
proxy_cache_path /var/cache/nginx/alexhd_posters
    levels=1:2
    keys_zone=posters_cache:30m
    max_size=5g
    inactive=14d
    use_temp_path=off;

# Ограничение частоты запросов для авторизации (защита от брутфорса)
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;

server {
    listen 80;
    listen [::]:80;
    server_name tv.yourdomain.com;

    # Для проверки домена Certbot
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Редирект с обычного HTTP на защищенный HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tv.yourdomain.com;

    # Пути к сертификатам SSL (Certbot настроит их автоматически)
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

    # Сжатие статических файлов интерфейса
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Специальные CORS-заголовки для Smart TV (Samsung Tizen, LG webOS, MSX)
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Device-Id,X-App-Version' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range,Accept-Ranges' always;

    # 1. Стартовый манифест для приложения Media Station X (MSX)
    location /msx/start.json {
        alias /var/www/alexhd/public/msx.json;
        add_header Content-Type application/json;
        add_header Access-Control-Allow-Origin *;
    }

    # 2. Кэширующий прокси для постеров TMDB
    location /t/p/ {
        proxy_pass https://image.tmdb.org/t/p/;
        proxy_cache posters_cache;
        proxy_cache_valid 200 30d;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_lock on;
        add_header X-Cache-Status $upstream_cache_status;
        expires 30d;
    }

    # 3. Маршрут к видеодвижку TorrServer (БЕЗ БУФЕРИЗАЦИИ NGINX!)
    location /torrserver/ {
        proxy_pass http://127.0.0.1:8090/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # КРИТИЧЕСКИ ВАЖНО: отключаем буфер Nginx для прямого видеопотока
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 4. Аутентификация с защитой от перебора паролей
    location /api/v1/auth/ {
        limit_req zone=auth_limit burst=15 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 5. Главный интерфейс и все API-запросы
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
EOF
```

---

### Шаг 6.2: Активация сайта и выпуск бесплатного SSL Let's Encrypt

Выполните:

```bash
# 1. Активируем конфигурацию
sudo ln -sf /etc/nginx/sites-available/alexhd.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 2. Выпускаем бесплатный SSL-сертификат (замените tv.yourdomain.com на ваш домен и укажите ваш реальный email)
sudo certbot --nginx -d tv.yourdomain.com --non-interactive --agree-tos -m admin@yourdomain.com

# 3. Проверяем синтаксис Nginx и перезапускаем службу
sudo nginx -t && sudo systemctl restart nginx
```

---

### Шаг 6.3: Проверка результата
Откройте в браузере на компьютере или телефоне адрес:
`https://tv.yourdomain.com`

*Ожидаемый ответ:* В адресной строке горит **замочек HTTPS**, открывается главная страница Alex HD с темным кинематографичным дизайном и постерами фильмов.

---

## Этап 7: Настройка брандмауэра (UFW) и безопасность портов

### Зачем это нужно:
Брандмауэр UFW блокирует все лишние порты снаружи, оставляя открытыми только те, что нужны для работы веб-сайта, SSH и скачивания торрентов пир-в-пир.

---

### Шаг 7.1: Настройка правил UFW

Выполните блок команд:

```bash
# Запрещаем все входящие по умолчанию, разрешаем исходящие
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Открываем порт для SSH (чтобы не потерять доступ к серверу!)
sudo ufw allow 22/tcp comment 'SSH'

# Открываем стандартные веб-порты
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Открываем P2P порты для быстрого поиска раздающих пиров TorrServer
sudo ufw allow 35432/tcp comment 'TorrServer DHT TCP'
sudo ufw allow 35432/udp comment 'TorrServer DHT UDP'
sudo ufw allow 51413/tcp comment 'TorrServer Peer Wire TCP'
sudo ufw allow 51413/udp comment 'TorrServer Peer Wire UDP'

# Активируем брандмауэр
sudo ufw --force enable
```

---

### Шаг 7.2: Проверка результата
```bash
sudo ufw status verbose
```
*Ожидаемый ответ:* `Status: active`, в списке отображаются разрешенные порты `22`, `80`, `443`, `35432`, `51413`.

---

## Этап 8: Подключение телевизоров Smart TV и приложения Media Station X (MSX)

Платформа Alex HD полностью оптимизирована для управления обычным пультом дистанционного управления телевизора (D-Pad стрелки Вверх/Вниз/Влево/Вправо, OK, Return/Назад, Play/Pause).

### Развертывание веб-интерфейса на Vercel (alexhd.vercel.app) и защита прав администратора

Если ваш веб-интерфейс развернут на **Vercel** (`https://alex-hd.vercel.app`):

1. **Режимы авторизации и входа пользователей**:
   - **Форма входа и регистрации**: В разделе «Аккаунт» доступна полноценная форма авторизации с переключением между *«Авторизация»* и *«Регистрация»*.
   - **Быстрый демо-вход в 1 клик**: Позволяет мгновенно начать просмотр без ввода пароля для демонстрационных целей.
   - **Защита доступа администратора**:
     - Все новые посетители и зарегистрированные пользователи по умолчанию заходят в стандартной роли зрителя (`Пользователь Alex HD` / `user`).
     - Панель управления узлами, серверами и нодами (`/admin`) защищена и доступна только владельцу/администратору.
     - Для активирования прав администратора выберите в разделе **Аккаунт** пункт **«Вход для Администратора»** и введите мастер-пароль (`admin123` или `StrongAlexHdPass2026!`).
     - Сессия администратора сохраняется в локальном хранилище. Для выхода из режима администратора достаточно нажать **«Выйти из админки»**.

2. **Настройка переменных окружения в Vercel**:
   В панели Vercel (**Project Settings -> Environment Variables**) добавьте:
   - `VITE_TORRSERVER_URL` = `https://IP_ВАШЕГО_VPS/torrserver`
   - `VITE_API_URL` = `https://IP_ВАШЕГО_VPS`

3. **CORS в Nginx на VPS**:
   В конфигурации Nginx на VPS для пути `/torrserver/` добавьте заголовок CORS для работы с Vercel:
   ```nginx
   add_header 'Access-Control-Allow-Origin' 'https://alex-hd.vercel.app' always;
   ```

### Способ 1: Через бесплатное приложение Media Station X (Рекомендуется для любого ТВ)
Приложение **Media Station X (MSX)** доступно официально в магазинах приложений на:
- **Samsung Smart TV** (Tizen OS 2016–2026 годов выпуска);
- **LG Smart TV** (webOS 3.0+);
- **Android TV / Google TV / ТВ-приставки Xiaomi, Realme, Nvidia Shield**;
- **Apple TV** (tvOS);
- **Яндекс ТВ / Салют ТВ / VIDAA (Hisense)**.

**Инструкция по настройке за 1 минуту:**
1. Откройте магазин приложений на телевизоре (например, Samsung Apps или LG Content Store) и найдите приложение **Media Station X**. Установите и запустите его.
2. В главном меню MSX зайдите в раздел **Settings (Настройки)** -> **Start Parameter (Параметр запуска)** -> **Setup (Установка)**.
3. Введите адрес вашего Vercel-приложения или VPS сервера:
   ```text
   https://alex-hd.vercel.app/msx.json
   ```
   *(или `tv.yourdomain.com/msx/start.json`)*.
4. Нажмите кнопку **Confirm (Подтвердить)**.
5. Приложение перезапустится и откроет полноценный интерфейс Alex HD!

---

### Способ 2: Через встроенный веб-браузер телевизора или ПК
1. Откройте встроенный браузер на Smart TV или компьютере.
2. Перейдите по адресу: `https://alex-hd.vercel.app` (или `https://tv.yourdomain.com`).
3. Для доступа к функциям администратора зайдите в раздел **Аккаунт** и введите пароль администратора.
4. Выберите фильм или сериал, нажмите «Смотреть» — видеопоток начнет воспроизводиться мгновенно.

---

## Этап 9: Альтернативный способ: запуск через Docker Compose

Если вы предпочитаете контейнеры Docker вместо ручной установки пакетов, в проекте уже подготовлены готовые конфигурации в папке `/deploy`:

### 9.1. Запуск центрального стека (PostgreSQL + Backend + Nginx):
```bash
cd /var/www/alexhd/deploy/control
mkdir -p secrets
echo "StrongAlexHdPass2026!" > secrets/postgres_password.txt
docker compose up -d
```

### 9.2. Запуск дополнительного узла стриминга (Edge TorrServer Node):
```bash
cd /var/www/alexhd/deploy/edge
sudo mkdir -p /mnt/nvme/torrents_cache
sudo chmod 777 /mnt/nvme/torrents_cache
docker compose up -d
```

---

## Этап 10: Итоговая таблица проверки и решение типовых проблем (Troubleshooting)

### Чек-лист проверки работоспособности всех узлов:

| Сервис / Компонент | Команда для проверки в терминале | Что должно отобразиться |
|---|---|---|
| **PostgreSQL** | `pg_isready -h 127.0.0.1 -p 5432` | `127.0.0.1:5432 - accepting connections` |
| **TorrServer** | `curl -s http://127.0.0.1:8090/echo` | `MatriX.134` (или выше) |
| **Backend API** | `curl -s http://127.0.0.1:3000/api/v1/health` | `{"status":"ok","database":"connected"}` |
| **Nginx HTTPS** | `curl -I https://tv.yourdomain.com` | `HTTP/2 200` или `HTTP/1.1 200 OK` |
| **Манифест MSX** | `curl -s https://tv.yourdomain.com/msx/start.json` | JSON с параметром `"name":"Alex HD"` |
| **Процесс PM2** | `pm2 status` | Строка `alexhd-core` со статусом `online` |

---

### Таблица решения возможных проблем:

| Симптом / Ошибка | Почему это произошло | Как исправить |
|---|---|---|
| **Ошибка Mixed Content в плеере** | Страница открыта по `https://`, а плеер пытается подключиться к `http://IP:8090` | В настройках плеера используйте относительный путь `https://tv.yourdomain.com/torrserver` (Nginx сам проксирует поток). |
| **Видео останавливается каждые 5-10 секунд** | Nginx пытается буферизировать тяжелый 4K поток целиком | Убедитесь, что в файле `/etc/nginx/sites-available/alexhd.conf` в блоке `location /torrserver/` прописана директива `proxy_buffering off;`. |
| **Скорость 0 KB/s, нет пиров (0 Peers)** | Брандмауэр сервера закрывает P2P порты | Выполните `sudo ufw allow 35432/tcp && sudo ufw allow 35432/udp && sudo ufw allow 51413/tcp && sudo ufw allow 51413/udp`. |
| **TorrServer аварийно завершается (OOM Killed)** | При воспроизведении BD-Remux 80GB закончилась оперативная память | Обязательно подключите 4GB Swap-файл (Этап 1) и ограничьте размер RAM кэша в TorrServer до 200MB. |
| **Заполнилось место на диске** | Накопился кэш старых просмотренных торрентов | Добавьте автоматическую очистку старого кэша раз в сутки по cron: `(crontab -l; echo "0 4 * * * find /var/lib/torrserver/cache -type f -atime +7 -delete") \| crontab -`. |
| **Нет звука при проигрывании 4K фильма** | Браузер не поддерживает кодеки дорожки DTS или AC3/E-AC3 | При просмотре на Smart TV телевизор декодирует DTS/AC3 аппаратно. Для ПК используйте плееры с поддержкой этих кодеков. |

---

**Поздравляем! Ваш персональный медиа-сервер Alex HD полностью настроен, защищен и готов к просмотру фильмов на любых Smart TV!**
