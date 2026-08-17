import React, { useState } from 'react';
import {
  Server,
  Terminal,
  Copy,
  Check,
  Zap,
  Globe,
  HardDrive,
  Database,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ExternalLink,
  Shield,
  Box
} from 'lucide-react';

export const InstallationGuideTab: React.FC = () => {
  const [selectedVariant, setSelectedVariant] = useState<'recommended' | 'allinone' | 'docker' | 'lightweight' | 'smarttv' | 'troubleshoot'>('recommended');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.2s_ease-out] font-sans">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#171615] via-[#1c1b18] to-[#121110] border border-[#d4b581]/30 shadow-[0_0_30px_rgba(212,181,129,0.1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4b581]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4b581]/15 border border-[#d4b581]/30 text-[#d4b581] font-mono text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              РУКОВОДСТВО ПО РАЗВЕРТЫВАНИЮ С 0
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-white tracking-tight">
              Варианты установки и настройка серверов
            </h2>
            <p className="text-sm text-[#e6e3df]/70 leading-relaxed font-sans">
              Выберите подходящий сценарий развертывания. Все команды оптимизированы под Ubuntu 22.04 / 24.04 LTS и готовы к копированию.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <div className="px-4 py-3 bg-[#0a0a09]/80 border border-[#e6e3df]/10 rounded-2xl font-mono text-xs">
              <span className="text-[#e6e3df]/40 block text-[10px]">ФРОНТЕНД</span>
              <span className="text-[#d4b581] font-bold">Vercel (alex-hd.vercel.app)</span>
            </div>
            <div className="px-4 py-3 bg-[#0a0a09]/80 border border-[#e6e3df]/10 rounded-2xl font-mono text-xs">
              <span className="text-[#e6e3df]/40 block text-[10px]">СТРИМИНГ</span>
              <span className="text-emerald-400 font-bold">TorrServer MatriX</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e6e3df]/10 overflow-x-auto no-scrollbar pb-2">
        <button
          onClick={() => setSelectedVariant('recommended')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            selectedVariant === 'recommended'
              ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>⭐️ Как я делаю (Vercel + VPS)</span>
        </button>

        <button
          onClick={() => setSelectedVariant('allinone')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            selectedVariant === 'allinone'
              ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>All-in-One VPS (Nginx + SSL)</span>
        </button>

        <button
          onClick={() => setSelectedVariant('docker')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            selectedVariant === 'docker'
              ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>Docker Compose</span>
        </button>

        <button
          onClick={() => setSelectedVariant('lightweight')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            selectedVariant === 'lightweight'
              ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Только TorrServer</span>
        </button>

        <button
          onClick={() => setSelectedVariant('smarttv')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            selectedVariant === 'smarttv'
              ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Smart TV (MSX)</span>
        </button>

        <button
          onClick={() => setSelectedVariant('troubleshoot')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            selectedVariant === 'troubleshoot'
              ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Чек-лист и Проблемы</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. RECOMMENDED: VERCEL + VPS */}
      {/* ========================================================================= */}
      {selectedVariant === 'recommended' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#0f0e0d] border border-[#d4b581]/30 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#d4b581]/15 text-[#d4b581] border border-[#d4b581]/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-serif">Вариант 1: «Как я делаю» — Vercel + Выделенный VPS</h3>
                <p className="text-xs text-[#e6e3df]/60 font-sans">
                  Фронтенд на Vercel CDN (<code className="text-[#d4b581]">alex-hd.vercel.app</code>) + Бэкенд, PostgreSQL и TorrServer на чистом VPS Ubuntu.
                </p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4 font-mono text-xs">
            {/* Step 1: System & Swap */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <span className="w-6 h-6 rounded-lg bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs">1</span>
                  Обновление Ubuntu, утилиты и файл подкачки (Swap 4GB)
                </span>
                <button
                  onClick={() => copyToClipboard(`sudo apt update && sudo apt upgrade -y\nsudo apt install -y curl wget git build-essential ufw postgresql postgresql-contrib libpq-dev htop iotop ffmpeg jq\nif [ $(swapon --show | wc -l) -le 1 ]; then\n  sudo fallocate -l 4G /swapfile\n  sudo chmod 600 /swapfile\n  sudo mkswap /swapfile\n  sudo swapon /swapfile\n  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab\nfi`, 'step1')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'step1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'step1' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed">
{`sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential ufw postgresql postgresql-contrib libpq-dev htop iotop ffmpeg jq

# Создаем Swap 4GB (защита от OOM при тяжелом 4K HDR)
if [ $(swapon --show | wc -l) -le 1 ]; then
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi`}
              </pre>
            </div>

            {/* Step 2: Node.js & PM2 */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <span className="w-6 h-6 rounded-lg bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs">2</span>
                  Установка Node.js 20 LTS и PM2
                </span>
                <button
                  onClick={() => copyToClipboard(`curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -\nsudo apt install -y nodejs\nsudo npm install -g pm2`, 'step2')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'step2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'step2' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed">
{`curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2`}
              </pre>
            </div>

            {/* Step 3: PostgreSQL */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <span className="w-6 h-6 rounded-lg bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs">3</span>
                  Создание базы PostgreSQL 15+ и импорт таблиц
                </span>
                <button
                  onClick={() => copyToClipboard(`sudo -u postgres psql << 'EOF'\nDO $$\nBEGIN\n  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'alexhd_user') THEN\n    CREATE USER alexhd_user WITH ENCRYPTED PASSWORD 'StrongAlexHdPass2026!';\n  END IF;\nEND\n$$;\nCREATE DATABASE alexhd_db WITH OWNER alexhd_user;\nGRANT ALL PRIVILEGES ON DATABASE alexhd_db TO alexhd_user;\nEOF`, 'step3')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'step3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'step3' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#e6e3df]/90 overflow-x-auto border border-[#e6e3df]/10 leading-relaxed">
{`sudo -u postgres psql << 'EOF'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'alexhd_user') THEN
    CREATE USER alexhd_user WITH ENCRYPTED PASSWORD 'StrongAlexHdPass2026!';
  END IF;
END
$$;
CREATE DATABASE alexhd_db WITH OWNER alexhd_user;
GRANT ALL PRIVILEGES ON DATABASE alexhd_db TO alexhd_user;
EOF`}
              </pre>
              <p className="text-[11px] text-[#e6e3df]/50 font-sans">
                После этого выполните импорт схемы с дефолтным администратором (<code className="text-[#d4b581]">alex_admin</code> / <code className="text-[#d4b581]">admin123</code>), как указано в <code className="text-white font-bold">DEPLOYMENT.md</code>.
              </p>
            </div>

            {/* Step 4: TorrServer */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <span className="w-6 h-6 rounded-lg bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs">4</span>
                  Установка TorrServer MatriX с кэшем на NVMe/SSD
                </span>
                <button
                  onClick={() => copyToClipboard(`sudo mkdir -p /opt/torrserver /var/lib/torrserver/cache /var/lib/torrserver/db\ncd /opt/torrserver\nsudo wget https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-amd64 -O torrserver\nsudo chmod +x torrserver\nsudo useradd -r -s /bin/false torruser || true\nsudo chown -R torruser:torruser /opt/torrserver /var/lib/torrserver\nsudo tee /etc/systemd/system/torrserver.service > /dev/null << 'EOF'\n[Unit]\nDescription=TorrServer MatriX\nAfter=network.target\n[Service]\nType=simple\nUser=torruser\nWorkingDirectory=/opt/torrserver\nExecStart=/opt/torrserver/torrserver -p 8090 -d /var/lib/torrserver/db -t /var/lib/torrserver/cache\nRestart=always\n[Install]\nWantedBy=multi-user.target\nEOF\nsudo systemctl daemon-reload\nsudo systemctl enable --now torrserver`, 'step4')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'step4' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'step4' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed">
{`sudo mkdir -p /opt/torrserver /var/lib/torrserver/cache /var/lib/torrserver/db
cd /opt/torrserver
sudo wget https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-amd64 -O torrserver
sudo chmod +x torrserver

# Создаем службу автозапуска systemd на порту 8090
sudo tee /etc/systemd/system/torrserver.service > /dev/null << 'EOF'
[Unit]
Description=TorrServer MatriX Streaming Engine
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/torrserver
ExecStart=/opt/torrserver/torrserver -p 8090 -d /var/lib/torrserver/db -t /var/lib/torrserver/cache
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now torrserver`}
              </pre>
            </div>

            {/* Step 5: Backend & PM2 */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <span className="w-6 h-6 rounded-lg bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs">5</span>
                  Сборка проекта и запуск бэкенда через PM2
                </span>
                <button
                  onClick={() => copyToClipboard(`cd /var/www/alexhd\nnpm install\nnpm run build\npm2 start ecosystem.config.cjs\npm2 save\npm2 startup`, 'step5')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'step5' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'step5' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#e6e3df]/90 overflow-x-auto border border-[#e6e3df]/10 leading-relaxed">
{`cd /var/www/alexhd
npm install
npm run build

# Запуск службы в фоне
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup`}
              </pre>
            </div>

            {/* Step 6: Firewall UFW */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <span className="w-6 h-6 rounded-lg bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs">6</span>
                  Открытие сетевых портов брандмауэра (UFW)
                </span>
                <button
                  onClick={() => copyToClipboard(`sudo ufw allow 22/tcp\nsudo ufw allow 3000/tcp\nsudo ufw allow 8090/tcp\nsudo ufw allow 35432/tcp\nsudo ufw allow 35432/udp\nsudo ufw allow 51413/tcp\nsudo ufw allow 51413/udp\nsudo ufw --force enable`, 'step6')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'step6' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'step6' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed">
{`sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 3000/tcp comment 'Alex HD Core API'
sudo ufw allow 8090/tcp comment 'TorrServer MatriX'
sudo ufw allow 35432/tcp comment 'TorrServer DHT TCP'
sudo ufw allow 35432/udp comment 'TorrServer DHT UDP'
sudo ufw allow 51413/tcp comment 'TorrServer Peer Wire'
sudo ufw --force enable`}
              </pre>
            </div>

            {/* Step 7: Vercel env */}
            <div className="p-5 bg-[#141312] border border-[#d4b581]/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <span className="w-6 h-6 rounded-lg bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs">7</span>
                  Настройка переменных на Vercel (Project Settings &rarr; Environment Variables)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10">
                  <span className="text-[#e6e3df]/50 text-[10px] block">ИМЯ ПЕРЕМЕННОЙ</span>
                  <span className="text-[#d4b581] font-bold text-xs">VITE_API_URL</span>
                  <span className="text-white block mt-1 text-xs">http://IP_ВАШЕГО_VPS:3000</span>
                </div>
                <div className="p-3 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10">
                  <span className="text-[#e6e3df]/50 text-[10px] block">ИМЯ ПЕРЕМЕННОЙ</span>
                  <span className="text-[#d4b581] font-bold text-xs">VITE_TORRSERVER_URL</span>
                  <span className="text-white block mt-1 text-xs">http://IP_ВАШЕГО_VPS:8090</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ALL-IN-ONE VPS NGINX */}
      {/* ========================================================================= */}
      {selectedVariant === 'allinone' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-3xl space-y-3">
            <h3 className="text-lg font-bold text-white font-serif">Вариант 2: Всё на одном VPS под собственным доменом с Nginx + SSL</h3>
            <p className="text-xs text-[#e6e3df]/70 leading-relaxed font-sans">
              Подходит, если у вас есть собственный домен (например, <code className="text-[#d4b581]">tv.yourdomain.com</code>). Nginx обеспечивает защищенный HTTPS (Certbot Let's Encrypt), отключает буферизацию для 4K видео (<code className="text-[#38bdf8]">proxy_buffering off;</code>) и кэширует постеры фильмов.
            </p>
          </div>

          <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-sans text-sm">Конфигурация Nginx (/etc/nginx/sites-available/alexhd.conf)</span>
              <button
                onClick={() => copyToClipboard(`server {\n  listen 80;\n  server_name tv.yourdomain.com;\n  return 301 https://$host$request_uri;\n}\n\nserver {\n  listen 443 ssl http2;\n  server_name tv.yourdomain.com;\n  ssl_certificate /etc/letsencrypt/live/tv.yourdomain.com/fullchain.pem;\n  ssl_certificate_key /etc/letsencrypt/live/tv.yourdomain.com/privkey.pem;\n\n  location /torrserver/ {\n    proxy_pass http://127.0.0.1:8090/;\n    proxy_buffering off;\n    proxy_read_timeout 86400s;\n  }\n\n  location / {\n    proxy_pass http://127.0.0.1:3000;\n  }\n}`, 'nginx_full')}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
              >
                {copiedId === 'nginx_full' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'nginx_full' ? 'Скопировано' : 'Копировать'}</span>
              </button>
            </div>
            <pre className="p-4 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed">
{`# 1. Получение SSL-сертификата
sudo certbot --nginx -d tv.yourdomain.com --non-interactive --agree-tos -m admin@yourdomain.com

# 2. Проверка и перезапуск Nginx
sudo nginx -t && sudo systemctl restart nginx`}
            </pre>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DOCKER COMPOSE */}
      {/* ========================================================================= */}
      {selectedVariant === 'docker' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-3xl space-y-3">
            <h3 className="text-lg font-bold text-white font-serif">Вариант 3: Запуск всего стека в Docker Compose</h3>
            <p className="text-xs text-[#e6e3df]/70 leading-relaxed font-sans">
              Запуск PostgreSQL 15, Alex HD Backend, TorrServer MatriX и Nginx в изолированных контейнерах.
            </p>
          </div>

          <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-sans text-sm">Команды запуска (deploy/control)</span>
              <button
                onClick={() => copyToClipboard(`cd /var/www/alexhd/deploy/control\nmkdir -p secrets\necho "StrongAlexHdPass2026!" > secrets/postgres_password.txt\ndocker compose up -d`, 'docker_cmd')}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
              >
                {copiedId === 'docker_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'docker_cmd' ? 'Скопировано' : 'Копировать'}</span>
              </button>
            </div>
            <pre className="p-4 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed">
{`cd /var/www/alexhd/deploy/control
mkdir -p secrets
echo "StrongAlexHdPass2026!" > secrets/postgres_password.txt
docker compose up -d

# Проверка статуса контейнеров
docker compose ps`}
            </pre>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. LIGHTWEIGHT */}
      {/* ========================================================================= */}
      {selectedVariant === 'lightweight' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-3xl space-y-3">
            <h3 className="text-lg font-bold text-white font-serif">Вариант 4: Легковесный режим (Только TorrServer на VPS)</h3>
            <p className="text-xs text-[#e6e3df]/70 leading-relaxed font-sans">
              Если вам не нужна база данных на сервере, а нужен только стриминговый узел для воспроизведения видео.
            </p>
          </div>

          <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-sans text-sm">Быстрый запуск в 3 команды</span>
              <button
                onClick={() => copyToClipboard(`sudo mkdir -p /opt/torrserver /var/lib/torrserver/cache /var/lib/torrserver/db\ncd /opt/torrserver\nsudo wget https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-amd64 -O torrserver\nsudo chmod +x torrserver\nsudo nohup /opt/torrserver/torrserver -p 8090 -d /var/lib/torrserver/db -t /var/lib/torrserver/cache > /var/log/torrserver.log 2>&1 &\nsudo ufw allow 8090/tcp`, 'light_cmd')}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
              >
                {copiedId === 'light_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'light_cmd' ? 'Скопировано' : 'Копировать'}</span>
              </button>
            </div>
            <pre className="p-4 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed">
{`sudo mkdir -p /opt/torrserver /var/lib/torrserver/cache /var/lib/torrserver/db
cd /opt/torrserver
sudo wget https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-amd64 -O torrserver
sudo chmod +x torrserver

# Запуск демона в фоне
sudo nohup /opt/torrserver/torrserver -p 8090 -d /var/lib/torrserver/db -t /var/lib/torrserver/cache > /var/log/torrserver.log 2>&1 &
sudo ufw allow 8090/tcp`}
            </pre>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SMART TV & MSX */}
      {/* ========================================================================= */}
      {selectedVariant === 'smarttv' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-3xl space-y-3">
            <h3 className="text-lg font-bold text-white font-serif">Подключение Smart TV через Media Station X (MSX)</h3>
            <p className="text-xs text-[#e6e3df]/70 leading-relaxed font-sans">
              Поддерживаются Samsung Smart TV (Tizen), LG Smart TV (webOS), Android TV / Google TV, ТВ-приставки Xiaomi / Apple TV.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-2">
              <span className="w-7 h-7 rounded-xl bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-bold">1</span>
              <h4 className="font-bold text-white text-sm font-sans">Установка приложения</h4>
              <p className="text-[#e6e3df]/60 font-sans text-xs">
                Откройте магазин приложений на телевизоре (Samsung Apps / LG Content Store / Google Play) и установите бесплатное приложение <b>Media Station X</b>.
              </p>
            </div>

            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-2">
              <span className="w-7 h-7 rounded-xl bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-bold">2</span>
              <h4 className="font-bold text-white text-sm font-sans">Настройка параметра</h4>
              <p className="text-[#e6e3df]/60 font-sans text-xs">
                Откройте <b>Settings</b> (Настройки) -&gt; <b>Start Parameter</b> -&gt; <b>Setup</b> и введите адрес манифеста:
              </p>
              <code className="block p-2 bg-black/60 rounded text-[#d4b581] text-[11px] break-all">
                https://alex-hd.vercel.app/msx.json
              </code>
            </div>

            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">3</span>
              <h4 className="font-bold text-white text-sm font-sans">Готово к просмотру</h4>
              <p className="text-[#e6e3df]/60 font-sans text-xs">
                Нажмите <b>Confirm</b>. Приложение откроет Alex HD в 4K с поддержкой пульта ДУ и запоминанием таймкода на секунде остановки.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TROUBLESHOOTING */}
      {/* ========================================================================= */}
      {selectedVariant === 'troubleshoot' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-3xl space-y-3">
            <h3 className="text-lg font-bold text-white font-serif">Чек-лист проверки и Решение проблем</h3>
            <p className="text-xs text-[#e6e3df]/70 leading-relaxed font-sans">
              Быстрая проверка доступности всех компонентов сервера в терминале.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-4 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Проверка PostgreSQL</span>
                <span className="text-emerald-400 text-[10px]">accepting connections</span>
              </div>
              <pre className="p-2 bg-black/40 rounded text-[#38bdf8] text-[11px]">pg_isready -h 127.0.0.1 -p 5432</pre>
            </div>

            <div className="p-4 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Проверка TorrServer</span>
                <span className="text-emerald-400 text-[10px]">MatriX.134</span>
              </div>
              <pre className="p-2 bg-black/40 rounded text-[#38bdf8] text-[11px]">curl -s http://127.0.0.1:8090/echo</pre>
            </div>

            <div className="p-4 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Проверка Backend API</span>
                <span className="text-emerald-400 text-[10px]">&#123;&quot;status&quot;:&quot;ok&quot;&#125;</span>
              </div>
              <pre className="p-2 bg-black/40 rounded text-[#38bdf8] text-[11px]">curl -s http://127.0.0.1:3000/api/v1/health</pre>
            </div>

            <div className="p-4 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Статус службы PM2</span>
                <span className="text-emerald-400 text-[10px]">online</span>
              </div>
              <pre className="p-2 bg-black/40 rounded text-[#38bdf8] text-[11px]">pm2 status</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
