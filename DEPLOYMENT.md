# Полное пошаговое руководство по установке Alex HD с нуля (От VS Code до первого просмотра на Smart TV)

Данный гайд содержит **исчерпывающую пошаговую инструкцию** по развертыванию собственного медиа-кинотеатра **Alex HD** с потоковым стримингом **TorrServer MatriX** (Zero-Disk Streaming в RAM без скачивания на диск), поиском по торрент-трекерам через **Prowlarr & FlareSolverr**, базой данных **PostgreSQL 15+**, веб-сервером **Nginx** и поддержкой воспроизведения на любых ТВ (**Samsung Tizen**, **LG webOS**, **Android TV / Google TV**, **Apple TV**, **Media Station X**), ПК и смартфонах.

---

## 📋 Оглавление
1. [ШАГ 0. Подготовка VS Code и подключение к VPS через Remote - SSH](#шаг-0-подготовка-vs-code-и-подключение-к-vps-через-remote---ssh)
2. [ШАГ 1. Первичная настройка VPS (Ubuntu 22.04 / 24.04 LTS), Swap 4GB и зависимости](#шаг-1-первичная-настройка-vps-ubuntu-2204--2404-lts-swap-4gb-и-зависимости)
3. [ШАГ 2. Установка и настройка базы данных PostgreSQL](#шаг-2-установка-и-настройка-базы-данных-postgresql)
4. [ШАГ 3. Установка и настройка стриминг-движка TorrServer MatriX](#шаг-3-установка-и-настройка-стриминг-движка-torrserver-matrix)
5. [ШАГ 4. Развертывание Prowlarr и FlareSolverr в Docker](#шаг-4-развертывание-prowlarr-и-flaresolverr-в-docker)
6. [ШАГ 5. Настройка Prowlarr в браузере (Трекеры, Прокси, API-ключ)](#шаг-5-настройка-prowlarr-в-браузере-трекеры-прокси-api-ключ)
7. [ШАГ 6. Клонирование, сборка и запуск Alex HD через PM2](#шаг-6-клонирование-сборка-и-запуск-alex-hd-через-pm2)
8. [ШАГ 7. Настройка Nginx (Веб-сервер и стриминг без буферизации)](#шаг-7-настройка-nginx-веб-сервер-и-стриминг-без-буферизации)
9. [ШАГ 8. Настройка сетевого экрана (UFW Firewall)](#шаг-8-настройка-сетевого-экрана-ufw-firewall)
10. [ШАГ 9. Первый вход, регистрация SuperAdmin и подключение устройств к просмотру](#шаг-9-первый-вход-регистрация-superadmin-и-подключение-устройств-к-просмотру)
11. [ШАГ 10. Диагностика, полезные команды и решение частых проблем (FAQ)](#шаг-10-диагностика-полезные-команды-и-решение-частых-проблем-faq)

---

## ШАГ 0. Подготовка VS Code и подключение к VPS через Remote - SSH

Для максимально удобной работы с сервером мы используем редактор **Visual Studio Code**. Он позволяет редактировать файлы сервера прямо в визуальном проводнике и запускать команды во встроенном терминале.

### 1. Установка расширения:
1. Откройте **Visual Studio Code** на вашем компьютере.
2. Перейдите во вкладку **Расширения** (Extensions) слева (`Ctrl + Shift + X` в Windows/Linux или `Cmd + Shift + X` в macOS).
3. Введите в поиске: **`Remote - SSH`** (от Microsoft).
4. Нажмите **Install** (Установить).

### 2. Подключение к серверу:
1. Нажмите в левом нижнем углу VS Code синюю/зеленую кнопку **`><`** (Open a Remote Window) или нажмите `F1` / `Ctrl + Shift + P` и выберите:
   ```text
   Remote-SSH: Connect to Host...
   ```
2. Выберите **Add New SSH Host...** и введите команду подключения:
   ```text
   ssh root@IP_ВАШЕГО_VPS
   ```
   *(или `ssh maxalex@IP_ВАШЕГО_VPS`, заменив `IP_ВАШЕГО_VPS` на ваш реальный IP, например `178.236.240.100`)*
3. Выберите файл конфигурации (обычно первый: `C:\Users\username\.ssh\config` или `~/.ssh/config`).
4. В правом нижнем углу появится уведомление `Host added!` — нажмите **Connect**.
5. Если спросит тип операционной системы — выберите **Linux**. При запросе доверия хосту выберите **Continue**, затем введите пароль от вашего VPS.
6. Откройте встроенный терминал VS Code через меню: **Terminal &rarr; New Terminal** (или нажмите сочетание клавиш ``Ctrl + ` ``).

Теперь вы находитесь в консоли вашего VPS!

---

## ШАГ 1. Первичная настройка VPS (Ubuntu 22.04 / 24.04 LTS), Swap 4GB и зависимости

Выполните команды обновления системы, создания файла подкачки (чтобы сервер не зависал при буферизации 4K-фильмов) и установки базовых утилит:

```bash
# 1. Обновляем репозитории и пакеты ОС
sudo apt update && sudo apt upgrade -y

# 2. Устанавливаем системные утилиты, компиляторы, Nginx и PostgreSQL
sudo apt install -y curl wget git build-essential ufw software-properties-common \
                    postgresql postgresql-contrib libpq-dev nginx \
                    htop iotop net-tools ffmpeg jq fail2ban unattended-upgrades

# 3. Настраиваем Swap 4GB (защита от нехватки оперативной памяти)
if [ $(swapon --show | wc -l) -le 1 ]; then
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 4. Устанавливаем Node.js 20 LTS и PM2 глобально
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g npm@latest pm2@latest

# 5. Устанавливаем и запускаем Docker + Docker Compose
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

---

## ШАГ 2. Установка и настройка базы данных PostgreSQL

Создадим изолированную базу данных и пользователя для Alex HD:

```bash
# Запускаем PostgreSQL и включаем автозагрузку
sudo systemctl enable --now postgresql

# Создаем пользователя, базу данных и выдаем полные права
sudo -u postgres psql << 'EOF'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'alexhd_user') THEN
    CREATE ROLE alexhd_user WITH LOGIN PASSWORD 'StrongAlexHdPass2026!';
  END IF;
END
$$;

CREATE DATABASE alexhd_db OWNER alexhd_user;
GRANT ALL PRIVILEGES ON DATABASE alexhd_db TO alexhd_user;
ALTER DATABASE alexhd_db OWNER TO alexhd_user;
EOF
```

---

## ШАГ 3. Установка и настройка стриминг-движка TorrServer MatriX

TorrServer MatriX стримит видео в оперативную память (RAM) на лету. **На диск сервера не пишется ни единого байта!**

```bash
# 1. Останавливаем службу (чтобы не было ошибки Text file busy при перезаписи)
sudo systemctl stop torrserver 2>/dev/null || true
sudo mkdir -p /opt/torrserver
cd /opt/torrserver

# 2. Скачиваем актуальный релиз TorrServer MatriX (Linux amd64)
sudo wget -O /opt/torrserver/TorrServer https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-amd64
sudo chmod +x /opt/torrserver/TorrServer

# 3. Создаем системную службу systemd для фоновой работы и автозапуска
sudo tee /etc/systemd/system/torrserver.service > /dev/null << 'EOF'
[Unit]
Description=TorrServer MatriX Zero-Disk Streaming Engine
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/torrserver
ExecStart=/opt/torrserver/TorrServer -d /opt/torrserver -p 8090
Restart=always
RestartSec=5
KillMode=process
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

# 4. Перезагружаем демоны и запускаем TorrServer
sudo systemctl daemon-reload
sudo systemctl enable --now torrserver

# 5. Применяем конфигурацию RAM-буфера 200MB через API
sleep 3
curl -s -X POST http://127.0.0.1:8090/settings -H "Content-Type: application/json" -d '{"action":"set","sets":{"CacheSize":209715200,"PreloadCache":50,"UseDisk":false,"ReaderReadAHead":95,"RetrackersMode":1,"TorrentDisconnectTimeout":30}}'
```

---

## ШАГ 4. Развертывание Prowlarr и FlareSolverr в Docker

Prowlarr отвечает за поиск фильмов по трекерам (RuTracker, Rutor, NNM-Club), а FlareSolverr решает проверки Cloudflare в фоне.

```bash
# 1. Останавливаем старые контейнеры, если были
sudo docker rm -f prowlarr flaresolverr 2>/dev/null || true

# 2. Создаем изолированную сеть для общения сервисов
sudo docker network create alexhd-net 2>/dev/null || true

# 3. Создаем папку под конфиг Prowlarr
sudo mkdir -p /opt/prowlarr/config
sudo chmod -R 777 /opt/prowlarr/config

# 4. Запускаем FlareSolverr (с памятью 1GB для Chromium и правами песочницы)
sudo docker run -d \
  --name=flaresolverr \
  --network=alexhd-net \
  -p 8191:8191 \
  -e LOG_LEVEL=info \
  -e TZ=Europe/Moscow \
  --security-opt seccomp=unconfined \
  --cap-add=SYS_ADMIN \
  --shm-size=1g \
  --restart always \
  ghcr.io/flaresolverr/flaresolverr:latest

# 5. (Рекомендуется для РФ) Запускаем Tor SOCKS5 прокси для обхода блокировки RuTracker/NNM-Club
sudo docker run -d \
  --name=tor-socks-proxy \
  --network=alexhd-net \
  -p 9050:9050 \
  --restart always \
  peterdaveheller/tor-socks-proxy:latest

# 6. Запускаем Prowlarr в той же сети
sudo docker run -d \
  --name=prowlarr \
  --network=alexhd-net \
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

---

## ШАГ 5. Настройка Prowlarr в браузере (Трекеры, Прокси для РФ, API-ключ)

1. Откройте в браузере страницу: **`http://IP_ВАШЕГО_VPS:9696`** *(например `http://178.236.240.100:9696`)*.
2. **Подключение FlareSolverr (Прокси)**:
   * Перейдите в **Settings &rarr; Indexers**.
   * В блоке **Proxies** нажмите **+ (Add Proxy)** &rarr; выберите **FlareSolverr**.
   * В поле **Host** укажите:
     ```text
     http://flaresolverr:8191
     ```
   * В поле **Request Timeout** укажите: `60`.
   * Поле **Tags** оставьте пустым.
   * Нажмите **Test** (появится зеленая галочка) &rarr; **Save**.

3. **🇷🇺 Настройка SOCKS5 Прокси для обхода блокировки RuTracker**:
   * В **Settings &rarr; Indexers &rarr; Proxies** нажмите **+ (Add Proxy)** &rarr; выберите **Socks5 Proxy** (или **HTTP Proxy**, если у вас свой купленный прокси).
   * Заполните поля:
     * **Name**: `Tor Bypass RuTracker`
     * **Host**: `tor-socks-proxy` *(или `127.0.0.1`, если прокси вне Docker)*
     * **Port**: `9050`
     * **Tags**: `proxy` *(нажмите Enter после ввода слова proxy, чтобы зафиксировать тег)*
   * Нажмите **Test** (зеленая галочка) &rarr; **Save**.

4. **Добавление трекеров**:
   * Перейдите в раздел **Indexers** &rarr; нажмите **+ Add Indexer**:
     * **Rutor**: введите `Rutor` &rarr; нажмите на него &rarr; поле **Tags** оставьте пустым (работает напрямую!) &rarr; нажмите **Save**.
     * **RuTracker.org**:
       * Введите `RuTracker.org`
       * В поле **Tags** введите `proxy` (чтобы запрос шел через SOCKS5 прокси!)
       * В поле **Base Url** выберите `https://rutracker.org/` или `https://rutracker.net/`
       * Введите ваши **Username** и **Password** от RuTracker
       * Включите **Use Magnet Links**
       * Нажмите **Save**.
     * **NNM-Club**:
       * Введите `NNM-Club` &rarr; в поле **Tags** введите `proxy` &rarr; выберите зеркало `https://nnmclub.to/` &rarr; нажмите **Save**.
     * **Kinozal.tv**: введите логин и пароль от Кинозала &rarr; нажмите **Save**.

5. **Копирование API-ключа**:
   * Перейдите в **Settings &rarr; General**.
   * В блоке **Security** найдите строку **API Key** и скопируйте ваш 32-значный ключ.

6. **🎬 Подключение медиа-приложений (Jellyseerr, Overseerr, Radarr, Sonarr)**:
   Prowlarr умеет автоматически синхронизировать все настроенные трекеры с каталогами фильмов и сериалов:
   * Перейдите в **Settings &rarr; Applications &rarr; + (Add)**.
   * Выберите приложение (например **Radarr** для фильмов или **Sonarr** для сериалов).
   * Укажите:
     * **Prowlarr Server**: `http://prowlarr:9696`
     * **Radarr/Sonarr Server**: `http://radarr:7878` (или `http://sonarr:8989`)
     * **API Key**: API-ключ из настроек соответствующего приложения.
   * Нажмите **Test** &rarr; **Save**.
   * Все трекеры (Rutor, RuTracker, NNM-Club) мгновенно синхронизируются, и **Jellyseerr/Overseerr** сможет запрашивать фильмы и сериалы в 1 клик!

---

## ШАГ 6. Клонирование, сборка и запуск Alex HD через PM2

Соберем проект и запустим бэкенд с автозагрузкой:

```bash
# 1. Останавливаем старые процессы PM2 (если были)
pm2 delete all 2>/dev/null || true

# 2. Подготавливаем директорию
sudo mkdir -p /var/www/alexhd
sudo chown -R $USER:$USER /var/www/alexhd
cd /var/www/alexhd
rm -rf /var/www/alexhd/* /var/www/alexhd/.* 2>/dev/null || true

# 3. Клонируем репозиторий прямо в текущую папку (точка на конце обязательна!)
git clone https://github.com/Zakkkie/Alex-HD.git .

# 4. Создаем боевой конфигурационный файл .env
# Замените ВАШ_API_КЛЮЧ_PROWLARR на ключ, скопированный в Шаге 5
cat << 'EOF' > /var/www/alexhd/.env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgres://alexhd_user:StrongAlexHdPass2026!@127.0.0.1:5432/alexhd_db
JWT_SECRET=super_secret_jwt_alexhd_production_token_8899221100ffaa
MAX_DEVICES_PER_USER=3
TORRSERVER_URL=http://127.0.0.1:8090
PROWLARR_URL=http://127.0.0.1:9696
PROWLARR_API_KEY=7ebafdf93c6b4df2aa87d6584641c942
TMDB_API_KEY=8ad0507b40ebd45a065a73530395afd1
EOF

# 5. Устанавливаем зависимости и собираем продакшн-версию
npm install
npm run build

# 6. Создаем конфигурацию PM2
mkdir -p /var/www/alexhd/logs
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
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/www/alexhd/logs/pm2-error.log',
      out_file: '/var/www/alexhd/logs/pm2-out.log'
    }
  ]
};
EOF

# 7. Запускаем Alex HD и включаем автозагрузку при перезагрузке VPS
pm2 start /var/www/alexhd/ecosystem.config.cjs
pm2 save
pm2 startup | tail -n 1 | bash 2>/dev/null || true
```

---

## ШАГ 7. Настройка Nginx (Веб-сервер и стриминг без буферизации)

Nginx объединяет веб-приложение (порт 3000) и скоростной видеопоток TorrServer (порт 8090) на стандартном **порту 80**:

```bash
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 100M;

    # Стриминг видео через TorrServer (без буферизации для плавного 4K)
    location /torrserver/ {
        proxy_pass http://127.0.0.1:8090/;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 86400s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Основное веб-приложение Alex HD и REST API
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

# Проверяем конфиг и перезапускаем Nginx
sudo nginx -t && sudo systemctl restart nginx
```

---

## ШАГ 8. Настройка сетевого экрана (UFW Firewall)

Откроем необходимые порты для безопасной работы:

```bash
# Разрешаем SSH, Веб (HTTP/HTTPS), Alex HD, TorrServer и Prowlarr
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP (Alex HD)'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw allow 3000/tcp comment 'Alex HD Direct Port'
sudo ufw allow 8090/tcp comment 'TorrServer Direct Port'
sudo ufw allow 9696/tcp comment 'Prowlarr Web Panel'

# Включаем фаервол
sudo ufw --force enable
sudo ufw status
```

---

## ШАГ 9. Первый вход, регистрация SuperAdmin и подключение устройств к просмотру

### 1. Первый вход и права SuperAdmin:
1. Откройте в браузере на ПК или смартфоне: **`http://IP_ВАШЕГО_VPS/`** *(например `http://178.236.240.100/`)*.
2. Нажмите **Зарегистрироваться** (Sign Up) и создайте ваш аккаунт (логин и пароль).
3. **Первый созданный аккаунт в системе автоматически получает статус Главного Администратора (SuperAdmin)**.
4. Перейдите в **Админ-панель** (кнопка в меню пользователя) &rarr; вкладка **Prowlarr** &rarr; убедитесь, что указаны:
   * URL: `http://127.0.0.1:9696`
   * API Key: ваш ключ из Prowlarr
   * Нажмите **Сохранить и проверить**.

---

### 2. Как смотреть кино на любых устройствах:

#### 💻 ПК, Ноутбуки, Смартфоны (Android / iPhone / iPad):
* Просто откройте в любом браузере: **`http://IP_ВАШЕГО_VPS/`**
* Выберите фильм или сериал &rarr; выберите качество раздачи (4K / 1080p / озвучка) &rarr; нажмите **Смотреть**. Видео запустится во встроенном плеере через 3–5 секунд.

#### 📺 Smart TV (Samsung Tizen, LG webOS, Hisense VIDAA):
* **Способ 1 (Через встроенный браузер ТВ)**:
  1. Откройте браузер на вашем телевизоре.
  2. Перейдите по адресу `http://IP_ВАШЕГО_VPS/`.
  3. Войдите в свой аккаунт. Разверните плеер на весь экран.
* **Способ 2 (Через приложение Media Station X / MSX)**:
  1. Установите бесплатное приложение **Media Station X** из официального магазина приложений вашего ТВ (Samsung Apps / LG Content Store).
  2. Зайдите в **Settings &rarr; Start Parameter &rarr; Setup** и укажите адрес плеера `http://IP_ВАШЕГО_VPS/`.

#### 🍏 Apple TV / Android TV / Google TV / ТВ-приставки:
* Откройте браузер ТВ или передавайте поток через **AirPlay / Chromecast** прямо со смартфона или ПК в один клик!

---

## ШАГ 10. Диагностика, полезные команды и решение частых проблем (FAQ)

### Быстрая проверка статуса всех служб:
```bash
# 1. Проверка Alex HD (PM2)
pm2 status

# 2. Проверка TorrServer
sudo systemctl status torrserver

# 3. Проверка Nginx
sudo systemctl status nginx

# 4. Проверка Prowlarr и FlareSolverr
sudo docker ps
```

---

### ❓ Что делать, если забыли пароль от Prowlarr:
Выполните одну команду на сервере, чтобы сбросить пароль без потери трекеров:
```bash
sudo sed -i 's/<AuthenticationMethod>.*<\/AuthenticationMethod>/<AuthenticationMethod>None<\/AuthenticationMethod>/g' /opt/prowlarr/config/config.xml
sudo docker restart prowlarr
```

---

### ❓ Ошибка Torznab 503 / 404 в TorrServer:
* В настройках TorrServer указывайте адрес конкретного трекера: **`http://127.0.0.1:9696/1/api`** (где `1` — номер трекера в Prowlarr), а не адрес с внешним IP!

---

### ❓ Ошибка SSL при добавлении RuTracker:
* В выпадающем списке **Base Url** выберите рабочее зеркало **`https://rutracker.net/`** или **`https://rutracker.nl/`** и поставьте галочку **Use Magnet Links**.
* Если провайдер полностью блокирует доступ к RuTracker в РФ — используйте встроенный **Tor SOCKS5 прокси** (см. руководство ниже).

---

## 🇷🇺 ПОЛНОЕ РУКОВОДСТВО: СОЗДАНИЕ И НАСТРОЙКА ПРОКСИ ДЛЯ RUTRACKER

Если ваш сервер или домашний провайдер находится в РФ, прямые запросы к `rutracker.org` и `nnmclub.to` могут блокироваться на уровне DPI/ТСПУ. Вот 3 способа поднять и подключить прокси.

### Вариант 1 (Рекомендуемый): Автоматический Tor SOCKS5 Прокси в Docker

Запустите контейнер прямо на вашем VPS в общей сети `alexhd-net`:

```bash
sudo docker run -d \
  --name=tor-socks-proxy \
  --network=alexhd-net \
  -p 9050:9050 \
  --restart always \
  peterdaveheller/tor-socks-proxy:latest
```

**Настройка в Prowlarr (`http://IP_VPS:9696`)**:
1. Откройте **Settings &rarr; Indexers &rarr; Proxies &rarr; + (Add)**.
2. Выберите тип **Socks5 Proxy**.
3. Заполните параметры:
   * **Name**: `Tor SOCKS5`
   * **Host**: `tor-socks-proxy` (или `127.0.0.1`)
   * **Port**: `9050`
   * **Tags**: `proxy` (нажмите Enter)
4. Нажмите **Test** (зеленая галочка) &rarr; **Save**.

---

### Вариант 0: VLESS Reality / Xray Client (Самый надежный в РФ для Prowlarr и FlareSolverr)

В связи с блокировками стандартных Tor/VPN провайдерами в РФ (ТСПУ), протокол **VLESS Reality / Xray** является самым стабильным решением. Вы можете поднять локальный Xray-клиент на VPS, который поднимает локальный SOCKS5/HTTP порт (например, `10808` или `2080`), и завернуть через него запросы Prowlarr и FlareSolverr.

```bash
# 1. Быстрая установка Xray Core на VPS
bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)"

# 2. Пример конфига клиента /usr/local/etc/xray/config.json
# (Подставьте ваши server, port, id, flow, publicKey, serverName, shortId из ключа vless://)
sudo tee /usr/local/etc/xray/config.json > /dev/null << 'EOF'
{
  "log": { "loglevel": "warning" },
  "inbounds": [
    {
      "listen": "0.0.0.0",
      "port": 10808,
      "protocol": "socks",
      "settings": { "auth": "noauth", "udp": true }
    },
    {
      "listen": "0.0.0.0",
      "port": 10809,
      "protocol": "http",
      "settings": { "allowTransparent": false }
    }
  ],
  "outbounds": [
    {
      "protocol": "vless",
      "settings": {
        "vnext": [
          {
            "address": "ВАШ_ЗАРУБЕЖНЫЙ_IP_ИЛИ_ДОМЕН",
            "port": 443,
            "users": [
              {
                "id": "ВАШ_UUID",
                "flow": "xtls-rprx-vision",
                "encryption": "none"
              }
            ]
          }
        ]
      },
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "show": false,
          "fingerprint": "chrome",
          "serverName": "yahoo.com",
          "publicKey": "ВАШ_PUBLIC_KEY",
          "shortId": "ВАШ_SHORT_ID",
          "spiderX": ""
        }
      }
    }
  ]
}
EOF

# 3. Запуск службы Xray
sudo systemctl restart xray && sudo systemctl enable xray

# 4. Проверка работы локального SOCKS5 прокси
curl -s -x socks5h://127.0.0.1:10808 https://checkip.amazonaws.com
```

**Подключение VLESS SOCKS5 в Prowlarr:**
* В **Settings &rarr; Indexers &rarr; Proxies &rarr; + (Add) &rarr; Socks5 Proxy**:
  * **Name**: `VLESS Reality SOCKS5`
  * **Host**: `172.17.0.1` *(шлюз Docker для доступа к хосту)* или IP вашего VPS.
  * **Port**: `10808`
  * **Tags**: `proxy` (нажмите Enter) &rarr; **Save**.

---

### Вариант 2: Поднятие собственного SOCKS5 прокси (Dante Server)

Если у вас есть отдельный недорогой зарубежный VPS (Германия / Нидерланды / Финляндия), вы можете за 1 минуту поднять там свой собственный SOCKS5 сервер:

```bash
# Установка Dante
sudo apt update && sudo apt install -y danted

# Создание конфигурации Dante
sudo tee /etc/danted.conf > /dev/null << 'EOF'
logoutput: /var/log/danted.log
internal: 0.0.0.0 port = 1080
external: eth0

socksmethod: username
clientmethod: none

client pass {
    from: 0.0.0.0/0 to: 0.0.0.0/0
    log: error
}

socks pass {
    from: 0.0.0.0/0 to: 0.0.0.0/0
    command: bind connect udpassociate
    log: error
    socksmethod: username
}
EOF

# Создание пользователя для прокси
sudo useradd -r -s /bin/false proxyuser
echo "proxyuser:StrongProxyPass2026!" | sudo chpasswd

# Перезапуск службы Dante
sudo systemctl restart danted && sudo systemctl enable danted
```

**Подключение в Prowlarr**:
* **Host**: `IP_ВАШЕГО_ЗАРУБЕЖНОГО_VPS`
* **Port**: `1080`
* **Username**: `proxyuser`
* **Password**: `StrongProxyPass2026!`
* **Tags**: `proxy`

---

### Вариант 3: Поднятие 3proxy (Универсальный HTTP + SOCKS5)

```bash
# Установка 3proxy
sudo apt update && sudo apt install -y 3proxy

# Конфигурация 3proxy с авторизацией
sudo tee /etc/3proxy/3proxy.cfg > /dev/null << 'EOF'
daemon
maxconn 200
nserver 1.1.1.1
nserver 8.8.8.8
nscache 65536
timeouts 1 5 30 60 180 1800 15 60

users proxyuser:CL:StrongProxyPass2026!
auth strong

# HTTP прокси на порту 3128
proxy -p3128

# SOCKS5 прокси на порту 1080
socks -p1080
EOF

sudo systemctl restart 3proxy && sudo systemctl enable 3proxy
```

---

### 🎯 Как привязать прокси ТОЛЬКО к заблокированным трекерам (Tag-based Routing)

Чтобы поиск по открытым российским трекерам (например, Rutor) работал **мгновенно без задержек прокси**, а через прокси шли только заблокированные:

1. В настройках прокси в Prowlarr в поле **Tags** укажите тег: `proxy`.
2. В настройках трекера **RuTracker.org**:
   * В поле **Tags** введите `proxy` и нажмите Enter.
   * В поле **Base Url** укажите `https://rutracker.org/` или `https://rutracker.net/`.
3. В настройках трекера **NNM-Club**:
   * В поле **Tags** введите `proxy` и нажмите Enter.
4. В настройках трекера **Rutor**:
   * Поле **Tags** оставьте **пустым** (запросы пойдут напрямую на максимальной скорости).

---

## 🎬 ИНТЕГРАЦИЯ С МЕДИА-ПРИЛОЖЕНИЯМИ ДЛЯ ФИЛЬМОВ И СЕРИАЛОВ (JELLYSEERR / OVERSEERR, RADARR, SONARR)

Prowlarr спроектирован как центральный диспетчер трекеров (Indexer Manager) для всей экосистемы медиа-сервисов. Вы можете подключить популярные приложения для каталогизации и поиска фильмов и сериалов:

### 1. Jellyseerr / Overseerr (Каталог и сервис запроса контента)

**Jellyseerr / Overseerr** — это веб-витрина контента с постерами, трейлерами и описаниями из TMDB, позволяющая пользователям находить и запрашивать фильмы и сериалы.

Запуск Jellyseerr в Docker в единой сети `alexhd-net`:
```bash
sudo mkdir -p /opt/jellyseerr/config
sudo chmod -R 777 /opt/jellyseerr/config

sudo docker run -d \
  --name=jellyseerr \
  --network=alexhd-net \
  -p 5055:5055 \
  -e LOG_LEVEL=debug \
  -e TZ=Europe/Moscow \
  -v /opt/jellyseerr/config:/app/config \
  --restart always \
  fallenbagel/jellyseerr:latest
```
*Панель управления доступна по адресу:* **`http://IP_ВАШЕГО_VPS:5055`**

---

### 2. Radarr (Автоматический поиск и организация фильмов) & Sonarr (Сериалы)

Prowlarr синхронизирует все ваши трекеры (Rutor, RuTracker, NNM-Club) напрямую в Radarr и Sonarr:

```bash
# Папки для конфигураций
sudo mkdir -p /opt/radarr/config /opt/sonarr/config
sudo chmod -R 777 /opt/radarr/config /opt/sonarr/config

# Запуск Radarr (Фильмы)
sudo docker run -d \
  --name=radarr \
  --network=alexhd-net \
  -p 7878:7878 \
  -e PUID=1000 \
  -e PGID=1000 \
  -e TZ=Europe/Moscow \
  -v /opt/radarr/config:/config \
  --restart always \
  lscr.io/linuxserver/radarr:latest

# Запуск Sonarr (Сериалы)
sudo docker run -d \
  --name=sonarr \
  --network=alexhd-net \
  -p 8989:8989 \
  -e PUID=1000 \
  -e PGID=1000 \
  -e TZ=Europe/Moscow \
  -v /opt/sonarr/config:/config \
  --restart always \
  lscr.io/linuxserver/sonarr:latest
```

---

### 3. Автоматическая синхронизация трекеров из Prowlarr в Radarr и Sonarr

1. В веб-интерфейсе **Radarr** (`http://IP_VPS:7878`):
   * Перейдите в **Settings &rarr; General** &rarr; скопируйте **API Key**.
2. В веб-интерфейсе **Sonarr** (`http://IP_VPS:8989`):
   * Перейдите в **Settings &rarr; General** &rarr; скопируйте **API Key**.
3. В веб-интерфейсе **Prowlarr** (`http://IP_VPS:9696`):
   * Перейдите в **Settings &rarr; Applications &rarr; + (Add)**.
   * Выберите **Radarr**:
     * **Prowlarr Server**: `http://prowlarr:9696`
     * **Radarr Server**: `http://radarr:7878`
     * **API Key**: вставьте ключ Radarr.
     * Нажмите **Test** &rarr; **Save**.
   * Выберите **Sonarr**:
     * **Prowlarr Server**: `http://prowlarr:9696`
     * **Sonarr Server**: `http://sonarr:8989`
     * **API Key**: вставьте ключ Sonarr.
     * Нажмите **Test** &rarr; **Save**.

---

### 4. Пошаговая настройка Jellyseerr / Overseerr (Каталог новинок)

После запуска контейнера откройте **`http://IP_ВАШЕГО_VPS:5055`**:

1. **Первичный мастер настройки (Welcome Wizard)**:
   * Выберите режим авторизации (Jellyfin / Plex или локальный аккаунт администратора).
   * Задайте Email и пароль администратора.
2. **Настройка региона и языка TMDB**:
   * Перейдите в **Settings &rarr; General**.
   * **Display Language**: `Русский (ru)`.
   * **Discover Region**: `Россия (RU)`.
   * **Original Language**: оставьте пустым или выберите `Русский, Английский`.
3. **Подключение Radarr (Фильмы)**:
   * Перейдите в **Settings &rarr; Services &rarr; Radarr &rarr; Add Radarr Server**.
   * **Server Name**: `Radarr Core`
   * **Hostname or IP**: `radarr` (или `127.0.0.1`, если вне Docker).
   * **Port**: `7878`
   * **API Key**: вставьте API-ключ Radarr.
   * Нажмите **Test** &rarr; выберите **Root Folder** (папка для фильмов) и **Quality Profile** (`HD-1080p` или `Ultra-HD / 4K`) &rarr; **Save**.
4. **Подключение Sonarr (Сериалы)**:
   * Перейдите в **Settings &rarr; Services &rarr; Sonarr &rarr; Add Sonarr Server**.
   * **Server Name**: `Sonarr Core`
   * **Hostname or IP**: `sonarr`
   * **Port**: `8989`
   * **API Key**: вставьте API-ключ Sonarr.
   * Нажмите **Test** &rarr; выберите **Root Folder** и **Quality Profile** &rarr; **Save**.
5. **Настройка прав пользователей (Auto-Approve)**:
   * В **Settings &rarr; Users** настройте права: включите `Auto-Approve Movies` и `Auto-Approve Series`, чтобы запросы пользователей отправлялись в поиск моментально без ручного одобрения.

---

### 5. Пошаговая настройка Radarr и Sonarr под русскую озвучку и 4K HDR

1. **Профили качества (Quality Profiles)**:
   * В Radarr перейдите в **Settings &rarr; Profiles &rarr; Quality Profiles**.
   * Нажмите **+ (Add)** &rarr; Назовите `4K & 1080p Ultra`.
   * Отметьте качества: `Remux-2160p`, `WEBDL-2160p`, `Remux-1080p`, `WEBDL-1080p`.
2. **Языковой профиль (Custom Formats для русской дорожки)**:
   * В **Settings &rarr; Custom Formats** можно импортировать готовые правила TRaSH Guides для приоритета русской озвучки (`DUB`, `LostFilm`, `HDRezka`, `Кубик в Кубе`, `Пифагор`).
3. **Загрузка и стриминг**:
   * Для моментального просмотра вы можете стримить раздачи через встроенный плеер Alex HD и TorrServer, либо настроить qBittorrent в **Settings &rarr; Download Clients** для фонового сохранения.

---

## 🌐 РАЗВЕРТЫВАНИЕ САЙТА-КАТАЛОГА ALEX HD НА СВОЕМ VPS ОТ А ДО Я

Alex HD — это полноценный веб-сайт онлайн-кинотеатра, который включает в себя:
* 🍿 Красивый современный каталог новинок TMDB на русском языке с трейлерами, актерским составом и похожими фильмами.
* ⚡️ Встроенный поиск раздач в 1 клик по всем трекерам (RuTracker, Rutor, NNM-Club) через Prowlarr/Torznab.
* 🚀 Встроенный веб-плеер с переключением аудиодорожек, субтитров и стримингом в RAM без записи на диск через TorrServer.
* 📺 Поддержку Smart TV через приложение Media Station X (MSX).
* 👑 Панель администратора с управлением пользователями, устройствами и системными службами.

### Пошаговый запуск сайта Alex HD:

```bash
# 1. Создаем рабочую директорию
sudo mkdir -p /var/www/alexhd
sudo chown -R $USER:$USER /var/www/alexhd
cd /var/www/alexhd

# 2. Клонируем исходный код проекта
git clone https://github.com/Zakkkie/Alex-HD.git .

# 3. Создаем боевой конфигурационный файл .env
cat << 'EOF' > /var/www/alexhd/.env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgres://alexhd_user:StrongAlexHdPass2026!@127.0.0.1:5432/alexhd_db
JWT_SECRET=super_secret_jwt_alexhd_production_token_8899221100ffaa
MAX_DEVICES_PER_USER=3
TORRSERVER_URL=http://127.0.0.1:8090
PROWLARR_URL=http://127.0.0.1:9696
PROWLARR_API_KEY=ВАШ_API_КЛЮЧ_ИЗ_PROWLARR
TMDB_API_KEY=8ad0507b40ebd45a065a73530395afd1
EOF

# 4. Устанавливаем зависимости и компилируем проект
npm install
npm run build

# 5. Настраиваем процесс-менеджер PM2 для автозапуска при перезагрузке VPS
mkdir -p /var/www/alexhd/logs
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
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/www/alexhd/logs/pm2-error.log',
      out_file: '/var/www/alexhd/logs/pm2-out.log'
    }
  ]
};
EOF

pm2 start /var/www/alexhd/ecosystem.config.cjs
pm2 save
pm2 startup | tail -n 1 | bash 2>/dev/null || true
```

---

### Настройка Nginx с поддержкой собственного домена и SSL (HTTPS):

```bash
# 1. Установка Certbot для бесплатного авто-обновляемого SSL-сертификата Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# 2. Создание конфига Nginx (/etc/nginx/sites-available/alexhd)
sudo tee /etc/nginx/sites-available/alexhd > /dev/null << 'EOF'
server {
    listen 80;
    server_name _; # Замените на ваш домен, например: cinema.yourdomain.com

    client_max_body_size 100M;

    # 1. Потоковый видеострим TorrServer (без буферизации для 4K)
    location /torrserver/ {
        proxy_pass http://127.0.0.1:8090/;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 86400s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 2. Каталог Jellyseerr (по желанию)
    location /seerr/ {
        proxy_pass http://127.0.0.1:5055/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 3. Манифест Smart TV MSX
    location /msx.json {
        proxy_pass http://127.0.0.1:3000/msx.json;
        add_header Content-Type application/json;
        add_header Access-Control-Allow-Origin *;
    }

    # 4. Основной сайт и каталог Alex HD
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/alexhd /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# 3. Выпуск бесплатного SSL-сертификата (если есть привязанный домен):
# sudo certbot --nginx -d cinema.yourdomain.com
```

---

### ❓ Просмотр логов в реальном времени:
```bash
# Логи приложения Alex HD
pm2 logs alexhd-core

# Логи стриминга TorrServer
sudo journalctl -u torrserver -f

# Логи обхода капч FlareSolverr
sudo docker logs -f flaresolverr

# Логи поиска Prowlarr
sudo docker logs -f prowlarr
```

🎉 **Поздравляем! Ваш собственный онлайн-кинотеатр Alex HD готов к бесконечному просмотру фильмов и сериалов в максимальном качестве!**
