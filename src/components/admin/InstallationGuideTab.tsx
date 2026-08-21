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
  Film,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ExternalLink,
  Shield,
  Box,
  Lock,
  Key,
  Radio,
  Search,
  Sliders,
  ShieldAlert,
  ShieldCheck,
  Wifi,
  Play,
  Cpu,
  RefreshCw,
  FolderMinus
} from 'lucide-react';

export const InstallationGuideTab: React.FC = () => {
  const [selectedVariant, setSelectedVariant] = useState<
    'master' | 'streaming' | 'proxy' | 'apps' | 'recommended' | 'security' | 'prowlarr' | 'domain' | 'allinone' | 'docker' | 'lightweight' | 'smarttv' | 'troubleshoot'
  >('master');
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
              МАСТЕР-ГАЙД С 0 (ОТ VS CODE ДО SMART TV)
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-white tracking-tight">
              Полное руководство по установке и настройке Alex HD
            </h2>
            <p className="text-sm text-[#e6e3df]/70 leading-relaxed font-sans">
              Пошаговый план развертывания с нуля: подключение по SSH в VS Code, стриминг TorrServer в RAM, поиск Prowlarr с обходом блокировок RuTracker в РФ и запуск на ТВ.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <div className="px-4 py-3 bg-[#0a0a09]/80 border border-[#e6e3df]/10 rounded-2xl font-mono text-xs">
              <span className="text-[#e6e3df]/40 block text-[10px]">БЕЗ СКАЧИВАНИЯ</span>
              <span className="text-[#d4b581] font-bold">Zero-Disk RAM Streaming</span>
            </div>
            <div className="px-4 py-3 bg-[#0a0a09]/80 border border-[#e6e3df]/10 rounded-2xl font-mono text-xs">
              <span className="text-[#e6e3df]/40 block text-[10px]">УСТРОЙСТВА</span>
              <span className="text-emerald-400 font-bold">Smart TV, ПК, iOS/Android</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e6e3df]/10 overflow-x-auto no-scrollbar pb-2">
        <button
          onClick={() => setSelectedVariant('master')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            selectedVariant === 'master'
              ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>⚡️ Полный гайд от А до Я (С нуля)</span>
        </button>

        <button
          onClick={() => setSelectedVariant('proxy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            selectedVariant === 'proxy'
              ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>🇷🇺 Прокси & Обход RuTracker</span>
        </button>

        <button
          onClick={() => setSelectedVariant('apps')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            selectedVariant === 'apps'
              ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>🎬 Jellyseerr & Radarr/Sonarr</span>
        </button>

        <button
          onClick={() => setSelectedVariant('streaming')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            selectedVariant === 'streaming'
              ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>🚀 Архитектура Zero-Disk</span>
        </button>

        <button
          onClick={() => setSelectedVariant('recommended')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            selectedVariant === 'recommended'
              ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>⭐️ Vercel + VPS</span>
        </button>

        <button
          onClick={() => setSelectedVariant('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            selectedVariant === 'security'
              ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>🛡️ Защита VPS & Fail2ban</span>
        </button>

        <button
          onClick={() => setSelectedVariant('prowlarr')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            selectedVariant === 'prowlarr'
              ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>📡 Prowlarr & Индексаторы</span>
        </button>

        <button
          onClick={() => setSelectedVariant('domain')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            selectedVariant === 'domain'
              ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>🌐 Домен & Доступ по IP</span>
        </button>

        <button
          onClick={() => setSelectedVariant('allinone')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            selectedVariant === 'allinone'
              ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Layers className="w-4 h-4" />
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
      {/* 00. MASTER COMPLETE GUIDE (FROM VS CODE TO SMART TV)                      */}
      {/* ========================================================================= */}
      {selectedVariant === 'master' && (
        <div className="space-y-6">
          {/* Master Intro Card */}
          <div className="p-6 md:p-8 bg-[#0f0e0d] border border-[#d4b581]/40 rounded-3xl space-y-4 shadow-[0_0_30px_rgba(212,181,129,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#d4b581]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-3 rounded-2xl bg-[#d4b581]/20 text-[#d4b581] border border-[#d4b581]/40">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#d4b581]/15 border border-[#d4b581]/30 text-[#d4b581] font-mono text-[10px] font-bold uppercase mb-1">
                  ПОШАГОВЫЙ ПЛАН С 0 • ДЛЯ UBUNTU 22.04 / 24.04 LTS
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white font-serif tracking-tight">
                  Единый мастер-гайд: Полная установка Alex HD от А до Я
                </h3>
                <p className="text-xs text-[#e6e3df]/70 font-sans mt-1">
                  Пройдите 10 простых шагов: от подключения к серверу в VS Code до воспроизведения первого 4K-фильма на Smart TV.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* ШАГ 0: VS CODE */}
            <div className="p-6 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e3df]/10 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-7 h-7 rounded-xl bg-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center font-mono text-xs font-bold">0</span>
                  <span>ШАГ 0. Подготовка VS Code и подключение по Remote - SSH</span>
                </div>
                <span className="text-[11px] font-mono text-[#38bdf8] bg-[#38bdf8]/10 px-2.5 py-1 rounded-lg border border-[#38bdf8]/20">
                  Клиент на ПК
                </span>
              </div>
              <p className="text-xs text-[#e6e3df]/70 leading-relaxed">
                VS Code позволяет удобно редактировать файлы на сервере и запускать команды прямо во встроенном терминале.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#e6e3df]/80">
                <div className="p-3.5 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-1.5">
                  <span className="font-bold text-[#d4b581] block font-mono">1. Установка расширения:</span>
                  <p className="text-[11px] text-[#e6e3df]/60">
                    Откройте VS Code &rarr; <code className="text-[#38bdf8]">Ctrl+Shift+X</code> &rarr; найдите и установите <b>Remote - SSH</b> (от Microsoft).
                  </p>
                </div>
                <div className="p-3.5 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-1.5">
                  <span className="font-bold text-[#d4b581] block font-mono">2. Подключение к хосту:</span>
                  <p className="text-[11px] text-[#e6e3df]/60">
                    Нажмите <code className="text-[#38bdf8]">F1</code> &rarr; <b>Remote-SSH: Connect to Host...</b> &rarr; введите <code className="text-white">ssh root@IP_СЕРВЕРА</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* ШАГ 1: БАЗОВАЯ НАСТРОЙКА VPS */}
            <div className="p-6 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e3df]/10 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-7 h-7 rounded-xl bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs font-bold">1</span>
                  <span>ШАГ 1. Первичная настройка VPS, Swap 4GB и Node.js 20 + Docker</span>
                </div>
                <button
                  onClick={() => copyToClipboard(`sudo apt update && sudo apt upgrade -y\n\nsudo apt install -y curl wget git build-essential ufw software-properties-common \\\n                    postgresql postgresql-contrib libpq-dev nginx \\\n                    htop iotop net-tools ffmpeg jq fail2ban unattended-upgrades\n\nif [ $(swapon --show | wc -l) -le 1 ]; then\n  sudo fallocate -l 4G /swapfile\n  sudo chmod 600 /swapfile\n  sudo mkswap /swapfile\n  sudo swapon /swapfile\n  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab\nfi\n\ncurl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -\nsudo apt install -y nodejs\nsudo npm install -g npm@latest pm2@latest\n\nsudo install -m 0755 -d /etc/apt/keyrings\nsudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc\nsudo chmod a+r /etc/apt/keyrings/docker.asc\necho "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null\nsudo apt update\nsudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin\nsudo systemctl enable --now docker\nsudo usermod -aG docker $USER`, 'sec_m_step1')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_m_step1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_m_step1' ? 'Скопировано' : 'Копировать всё'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`# 1. Обновление ОС и установка базовых утилит
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential ufw software-properties-common \\
                    postgresql postgresql-contrib libpq-dev nginx \\
                    htop iotop net-tools ffmpeg jq fail2ban unattended-upgrades

# 2. Swap 4GB (защита памяти от нехватки RAM при 4K стриминге)
if [ $(swapon --show | wc -l) -le 1 ]; then
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 3. Установка Node.js 20 LTS и PM2 глобально
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g npm@latest pm2@latest

# 4. Установка Docker и Docker Compose
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER`}
              </pre>
            </div>

            {/* ШАГ 2: POSTGRESQL */}
            <div className="p-6 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e3df]/10 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-7 h-7 rounded-xl bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs font-bold">2</span>
                  <span>ШАГ 2. База данных PostgreSQL (Пользователь и База)</span>
                </div>
                <button
                  onClick={() => copyToClipboard(`sudo systemctl enable --now postgresql\n\nsudo -u postgres psql << 'EOF'\nDO $$\nBEGIN\n  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'alexhd_user') THEN\n    CREATE ROLE alexhd_user WITH LOGIN PASSWORD 'StrongAlexHdPass2026!';\n  END IF;\nEND\n$$;\n\nCREATE DATABASE alexhd_db OWNER alexhd_user;\nGRANT ALL PRIVILEGES ON DATABASE alexhd_db TO alexhd_user;\nALTER DATABASE alexhd_db OWNER TO alexhd_user;\nEOF`, 'sec_m_step2')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_m_step2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_m_step2' ? 'Скопировано' : 'Копировать всё'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`sudo systemctl enable --now postgresql

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
EOF`}
              </pre>
            </div>

            {/* ШАГ 3: TORRSERVER */}
            <div className="p-6 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e3df]/10 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-7 h-7 rounded-xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold">3</span>
                  <span>ШАГ 3. Стриминг-движок TorrServer MatriX (Стриминг в RAM 200MB)</span>
                </div>
                <button
                  onClick={() => copyToClipboard(`sudo systemctl stop torrserver 2>/dev/null || true\nsudo mkdir -p /opt/torrserver\ncd /opt/torrserver\nsudo wget -O /opt/torrserver/TorrServer https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-amd64\nsudo chmod +x /opt/torrserver/TorrServer\n\nsudo tee /etc/systemd/system/torrserver.service > /dev/null << 'EOF'\n[Unit]\nDescription=TorrServer MatriX Zero-Disk Streaming Engine\nAfter=network.target\n\n[Service]\nType=simple\nUser=root\nWorkingDirectory=/opt/torrserver\nExecStart=/opt/torrserver/TorrServer -d /opt/torrserver -p 8090\nRestart=always\nRestartSec=5\nKillMode=process\nLimitNOFILE=65535\n\n[Install]\nWantedBy=multi-user.target\nEOF\n\nsudo systemctl daemon-reload\nsudo systemctl enable --now torrserver\nsleep 3\n\ncurl -s -X POST http://127.0.0.1:8090/settings -H "Content-Type: application/json" -d '{"action":"set","sets":{"CacheSize":209715200,"PreloadCache":50,"UseDisk":false,"ReaderReadAHead":95,"RetrackersMode":1,"TorrentDisconnectTimeout":30}}'`, 'sec_m_step3')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_m_step3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_m_step3' ? 'Скопировано' : 'Копировать всё'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`# 1. Останавливаем службу перед обновлением
sudo systemctl stop torrserver 2>/dev/null || true
sudo mkdir -p /opt/torrserver
cd /opt/torrserver

# 2. Скачивание актуального релиза
sudo wget -O /opt/torrserver/TorrServer https://github.com/YouROK/TorrServer/releases/latest/download/TorrServer-linux-amd64
sudo chmod +x /opt/torrserver/TorrServer

# 3. Создание службы systemd
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

# 4. Запуск и автозагрузка
sudo systemctl daemon-reload
sudo systemctl enable --now torrserver
sleep 3

# 5. Настройка RAM-буфера (UseDisk: false, 200MB RAM, Preload 50%)
curl -s -X POST http://127.0.0.1:8090/settings -H "Content-Type: application/json" -d '{"action":"set","sets":{"CacheSize":209715200,"PreloadCache":50,"UseDisk":false,"ReaderReadAHead":95,"RetrackersMode":1,"TorrentDisconnectTimeout":30}}'`}
              </pre>
            </div>

            {/* ШАГ 4: PROWLARR, FLARESOLVERR & XRAY-CLIENT */}
            <div className="p-6 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e3df]/10 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-7 h-7 rounded-xl bg-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center font-mono text-xs font-bold">4</span>
                  <span>ШАГ 4. Поиск торрентов: Prowlarr, FlareSolverr и xray-client в сети stream-net</span>
                </div>
                <button
                  onClick={() => copyToClipboard(`sudo docker rm -f prowlarr flaresolverr xray-client 2>/dev/null || true\nsudo docker network create --subnet=172.19.0.0/16 stream-net 2>/dev/null || true\nsudo mkdir -p /opt/prowlarr/config /opt/xray\nsudo chmod -R 777 /opt/prowlarr/config\n\nsudo docker run -d \\\n  --name=flaresolverr \\\n  --network=stream-net \\\n  --ip=172.19.0.3 \\\n  -p 8191:8191 \\\n  -e LOG_LEVEL=info \\\n  -e TZ=Europe/Moscow \\\n  --security-opt seccomp=unconfined \\\n  --cap-add=SYS_ADMIN \\\n  --shm-size=1g \\\n  --restart always \\\n  ghcr.io/flaresolverr/flaresolverr:latest\n\nsudo docker run -d \\\n  --name=xray-client \\\n  --network=stream-net \\\n  --ip=172.19.0.4 \\\n  -p 10808:10808 \\\n  -p 10809:10809 \\\n  -v /opt/xray/config.json:/etc/xray/config.json \\\n  --restart always \\\n  teddysun/xray:latest\n\nsudo docker run -d \\\n  --name=prowlarr \\\n  --network=stream-net \\\n  --ip=172.19.0.5 \\\n  -p 9696:9696 \\\n  --dns 77.88.8.8 \\\n  --dns 1.1.1.1 \\\n  -e PUID=1000 \\\n  -e PGID=1000 \\\n  -e TZ=Europe/Moscow \\\n  -v /opt/prowlarr/config:/config \\\n  --restart always \\\n  lscr.io/linuxserver/prowlarr:latest`, 'sec_m_step4')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_m_step4' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_m_step4' ? 'Скопировано' : 'Копировать всё'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`# 1. Создаем изолированную сеть stream-net
sudo docker rm -f prowlarr flaresolverr xray-client 2>/dev/null || true
sudo docker network create --subnet=172.19.0.0/16 stream-net 2>/dev/null || true
sudo mkdir -p /opt/prowlarr/config /opt/xray
sudo chmod -R 777 /opt/prowlarr/config

# 2. Запуск FlareSolverr (IP 172.19.0.3)
sudo docker run -d \\
  --name=flaresolverr \\
  --network=stream-net \\
  --ip=172.19.0.3 \\
  -p 8191:8191 \\
  -e LOG_LEVEL=info \\
  -e TZ=Europe/Moscow \\
  --security-opt seccomp=unconfined \\
  --cap-add=SYS_ADMIN \\
  --shm-size=1g \\
  --restart always \\
  ghcr.io/flaresolverr/flaresolverr:latest

# 3. Запуск xray-client (IP 172.19.0.4, HTTP: 10809, SOCKS5: 10808)
sudo docker run -d \\
  --name=xray-client \\
  --network=stream-net \\
  --ip=172.19.0.4 \\
  -p 10808:10808 \\
  -p 10809:10809 \\
  -v /opt/xray/config.json:/etc/xray/config.json \\
  --restart always \\
  teddysun/xray:latest

# 4. Запуск Prowlarr (IP 172.19.0.5)
sudo docker run -d \\
  --name=prowlarr \\
  --network=stream-net \\
  --ip=172.19.0.5 \\
  -p 9696:9696 \\
  --dns 77.88.8.8 \\
  --dns 1.1.1.1 \\
  -e PUID=1000 \\
  -e PGID=1000 \\
  -e TZ=Europe/Moscow \\
  -v /opt/prowlarr/config:/config \\
  --restart always \\
  lscr.io/linuxserver/prowlarr:latest`}
              </pre>
            </div>

            {/* ШАГ 5: НАСТРОЙКА PROWLARR */}
            <div className="p-6 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e3df]/10 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-7 h-7 rounded-xl bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs font-bold">5</span>
                  <span>ШАГ 5. Настройка трекеров, прокси для RuTracker и FlareSolverr в Prowlarr</span>
                </div>
                <span className="text-[11px] font-mono text-[#d4b581] bg-[#d4b581]/10 px-2.5 py-1 rounded-lg border border-[#d4b581]/20">
                  http://IP_СЕРВЕРА:9696
                </span>
              </div>
              <div className="space-y-2 text-xs text-[#e6e3df]/80">
                <ol className="list-decimal pl-4 space-y-2">
                  <li>
                    Откройте в браузере: <code className="text-[#38bdf8]">http://IP_СЕРВЕРА:9696</code>.
                  </li>
                  <li>
                    <b>Подключение FlareSolverr</b>: Перейдите в <b>Settings &rarr; Indexers &rarr; Proxies &rarr; + (Add) &rarr; FlareSolverr</b>:
                    <ul className="list-disc pl-5 mt-1 space-y-0.5 text-[11px] text-[#e6e3df]/60 font-mono">
                      <li>Host: <span className="text-white">http://172.19.0.3:8191</span> (или <span className="text-white">http://flaresolverr:8191</span>)</li>
                      <li>Request Timeout: <span className="text-white">60</span></li>
                      <li>Tags: <span className="text-emerald-400">пусто</span> &rarr; Нажмите <b>Test</b> &rarr; <b>Save</b>.</li>
                    </ul>
                  </li>
                  <li>
                    <b>🇷🇺 Подключение Прокси (через xray-client для заблокированных трекеров)</b>:
                    <ul className="list-disc pl-5 mt-1 space-y-0.5 text-[11px] text-[#e6e3df]/60 font-mono">
                      <li>В <b>Settings &rarr; Indexers &rarr; Proxies &rarr; + (Add)</b> выберите <b>HTTP Proxy</b> (или Socks5).</li>
                      <li>Name: <span className="text-white">xray-proxy</span></li>
                      <li>Host: <span className="text-white">172.19.0.4</span> (или <span className="text-white">xray-client</span>)</li>
                      <li>Port: <span className="text-white">10809</span> (для HTTP) или <span className="text-white">10808</span> (для SOCKS5)</li>
                      <li>Tags: <span className="text-amber-400 font-bold">proxy</span> (обязательно нажмите Enter после ввода) &rarr; Нажмите <b>Test</b> &rarr; <b>Save</b>.</li>
                    </ul>
                  </li>
                  <li>
                    <b>Добавление трекеров</b>: Перейдите в <b>Indexers &rarr; Add Indexer</b>:
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-[11px] text-[#e6e3df]/60">
                      <li><b className="text-white">Rutor</b>: Нажмите Save (работает напрямую без прокси на максимальной скорости!).</li>
                      <li>
                        <b className="text-white">RuTracker.org</b>:
                        В поле <b>Tags</b> укажите <span className="text-amber-400 font-mono font-bold">proxy</span>. В поле <b>Base Url</b> выберите <code className="text-[#d4b581]">https://rutracker.org/</code> (или <code className="text-[#d4b581]">https://rutracker.net/</code>), введите ваш логин/пароль и включите <b>Use Magnet Links</b> &rarr; Save.
                      </li>
                      <li>
                        <b className="text-white">NNM-Club</b>: В поле <b>Tags</b> укажите <span className="text-amber-400 font-mono font-bold">proxy</span>, выберите зеркало <code className="text-[#d4b581]">https://nnmclub.to/</code> &rarr; Save.
                      </li>
                      <li><b className="text-white">Kinozal.tv</b>: введите логин и пароль от Кинозала &rarr; Save.</li>
                    </ul>
                  </li>
                  <li>
                    <b>Копирование ключа</b>: Перейдите в <b>Settings &rarr; General</b> &rarr; скопируйте <b>API Key</b>.
                  </li>
                  <li>
                    <b>🎬 Синхронизация с медиа-приложениями (Jellyseerr, Radarr, Sonarr)</b>:
                    В <b>Settings &rarr; Applications &rarr; + (Add)</b> добавьте <b>Radarr</b> (<code className="text-white">http://radarr:7878</code>) и <b>Sonarr</b> (<code className="text-white">http://sonarr:8989</code>). Все трекеры автоматически синхронизируются для каталогов фильмов и сериалов!
                  </li>
                </ol>
              </div>
            </div>

            {/* ШАГ 6: СБОРКА И ЗАПУСК ALEX HD */}
            <div className="p-6 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e3df]/10 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-7 h-7 rounded-xl bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs font-bold">6</span>
                  <span>ШАГ 6. Клонирование, сборка и запуск Alex HD через PM2</span>
                </div>
                <button
                  onClick={() => copyToClipboard(`pm2 delete all 2>/dev/null || true\nsudo mkdir -p /var/www/alexhd\nsudo chown -R $USER:$USER /var/www/alexhd\ncd /var/www/alexhd\nrm -rf /var/www/alexhd/* /var/www/alexhd/.* 2>/dev/null || true\n\ngit clone https://github.com/Zakkkie/Alex-HD.git .\n\ncat << 'EOF' > /var/www/alexhd/.env\nPORT=3000\nNODE_ENV=production\nDATABASE_URL=postgres://alexhd_user:StrongAlexHdPass2026!@127.0.0.1:5432/alexhd_db\nJWT_SECRET=super_secret_jwt_alexhd_production_token_8899221100ffaa\nMAX_DEVICES_PER_USER=3\nTORRSERVER_URL=http://172.19.0.6:8090\nPROWLARR_URL=http://172.19.0.5:9696\nPROWLARR_API_KEY=ВАШ_API_КЛЮЧ_ИЗ_PROWLARR\nJELLYSEERR_URL=http://172.19.0.2:5055\nJELLYFIN_URL=http://172.19.0.7:8096\nRADARR_URL=http://172.19.0.8:7878\nSONARR_URL=http://172.19.0.9:8989\nTMDB_API_KEY=8ad0507b40ebd45a065a73530395afd1\nEOF\n\nnpm install\nnpm run build\n\nmkdir -p /var/www/alexhd/logs\ncat << 'EOF' > /var/www/alexhd/ecosystem.config.cjs\nmodule.exports = {\n  apps: [\n    {\n      name: 'alexhd-core',\n      script: 'dist/server.cjs',\n      cwd: '/var/www/alexhd',\n      instances: 1,\n      exec_mode: 'fork',\n      autorestart: true,\n      watch: false,\n      max_memory_restart: '1G',\n      env: {\n        NODE_ENV: 'production',\n        PORT: 3000\n      },\n      log_date_format: 'YYYY-MM-DD HH:mm:ss',\n      error_file: '/var/www/alexhd/logs/pm2-error.log',\n      out_file: '/var/www/alexhd/logs/pm2-out.log'\n    }\n  ]\n};\nEOF\n\npm2 start /var/www/alexhd/ecosystem.config.cjs\npm2 save\npm2 startup | tail -n 1 | bash 2>/dev/null || true`, 'sec_m_step6')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_m_step6' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_m_step6' ? 'Скопировано' : 'Копировать всё'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`pm2 delete all 2>/dev/null || true
sudo mkdir -p /var/www/alexhd
sudo chown -R $USER:$USER /var/www/alexhd
cd /var/www/alexhd
rm -rf /var/www/alexhd/* /var/www/alexhd/.* 2>/dev/null || true

# 1. Клонируем репозиторий прямо в текущую папку (точка в конце обязательна!)
git clone https://github.com/Zakkkie/Alex-HD.git .

# 2. Создаем боевой файл .env с адресами контейнеров сети stream-net
cat << 'EOF' > /var/www/alexhd/.env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgres://alexhd_user:StrongAlexHdPass2026!@127.0.0.1:5432/alexhd_db
JWT_SECRET=super_secret_jwt_alexhd_production_token_8899221100ffaa
MAX_DEVICES_PER_USER=3
TORRSERVER_URL=http://172.19.0.6:8090
PROWLARR_URL=http://172.19.0.5:9696
PROWLARR_API_KEY=ВАШ_API_КЛЮЧ_ИЗ_PROWLARR
JELLYSEERR_URL=http://172.19.0.2:5055
JELLYFIN_URL=http://172.19.0.7:8096
RADARR_URL=http://172.19.0.8:7878
SONARR_URL=http://172.19.0.9:8989
TMDB_API_KEY=8ad0507b40ebd45a065a73530395afd1
EOF

# 3. Сборка продакшн сборки
npm install
npm run build

# 4. Конфиг PM2 и автозапуск
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
pm2 startup | tail -n 1 | bash 2>/dev/null || true`}
              </pre>
            </div>

            {/* ШАГ 7: НАСТРОЙКА NGINX */}
            <div className="p-6 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e3df]/10 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-7 h-7 rounded-xl bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs font-bold">7</span>
                  <span>ШАГ 7. Настройка Nginx (Веб-сервер и стриминг /torrserver/)</span>
                </div>
                <button
                  onClick={() => copyToClipboard(`sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'\nserver {\n    listen 80 default_server;\n    listen [::]:80 default_server;\n    server_name _;\n\n    client_max_body_size 100M;\n\n    # Стриминг видео через TorrServer (без буферизации для 4K)\n    location /torrserver/ {\n        proxy_pass http://127.0.0.1:8090/;\n        proxy_buffering off;\n        proxy_request_buffering off;\n        proxy_read_timeout 86400s;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n    }\n\n    # Основное приложение Alex HD\n    location / {\n        proxy_pass http://127.0.0.1:3000;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection 'upgrade';\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_cache_bypass $http_upgrade;\n    }\n}\nEOF\n\nsudo nginx -t && sudo systemctl restart nginx`, 'sec_m_step7')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_m_step7' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_m_step7' ? 'Скопировано' : 'Копировать всё'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
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

sudo nginx -t && sudo systemctl restart nginx`}
              </pre>
            </div>

            {/* ШАГ 8: UFW ФАЕРВОЛ */}
            <div className="p-6 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e3df]/10 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-7 h-7 rounded-xl bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs font-bold">8</span>
                  <span>ШАГ 8. Настройка фаервола UFW</span>
                </div>
                <button
                  onClick={() => copyToClipboard(`sudo ufw allow 22/tcp comment 'SSH'\nsudo ufw allow 80/tcp comment 'HTTP (Alex HD)'\nsudo ufw allow 443/tcp comment 'HTTPS'\nsudo ufw allow 3000/tcp comment 'Alex HD Direct'\nsudo ufw allow 8090/tcp comment 'TorrServer Direct'\nsudo ufw allow 9696/tcp comment 'Prowlarr Web Panel'\nsudo ufw --force enable\nsudo ufw status`, 'sec_m_step8')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_m_step8' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_m_step8' ? 'Скопировано' : 'Копировать всё'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP (Alex HD)'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw allow 3000/tcp comment 'Alex HD Direct'
sudo ufw allow 8090/tcp comment 'TorrServer Direct'
sudo ufw allow 9696/tcp comment 'Prowlarr Web Panel'

sudo ufw --force enable
sudo ufw status`}
              </pre>
            </div>

            {/* ШАГ 9: ПЕРВЫЙ ВХОД И ПРОСМОТР НА УСТРОЙСТВАХ */}
            <div className="p-6 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e3df]/10 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-7 h-7 rounded-xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold">9</span>
                  <span>ШАГ 9. Первый вход (SuperAdmin) и просмотр на Smart TV, ПК и смартфонах</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-lg border border-emerald-400/20">
                  http://IP_СЕРВЕРА/
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#e6e3df]/80">
                <div className="p-4 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-2">
                  <span className="font-bold text-white block text-sm flex items-center gap-1.5">
                    👑 Регистрация SuperAdmin
                  </span>
                  <p className="text-[11px] text-[#e6e3df]/60 leading-relaxed">
                    Откройте <code className="text-white">http://IP_СЕРВЕРА/</code> и зарегистрируйте первый аккаунт. Он автоматически получит права <b>SuperAdmin</b> для управления сервером и пользователями.
                  </p>
                </div>
                <div className="p-4 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-2">
                  <span className="font-bold text-white block text-sm flex items-center gap-1.5">
                    📺 Smart TV (Samsung / LG / Sony)
                  </span>
                  <p className="text-[11px] text-[#e6e3df]/60 leading-relaxed">
                    Откройте браузер на ТВ и перейдите на адрес сервера, либо установите бесплатный <b>Media Station X (MSX)</b> и укажите адрес сервера в качестве стартового параметра.
                  </p>
                </div>
                <div className="p-4 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-2">
                  <span className="font-bold text-white block text-sm flex items-center gap-1.5">
                    📱 ПК, iOS & Android
                  </span>
                  <p className="text-[11px] text-[#e6e3df]/60 leading-relaxed">
                    Работает в любом современном браузере. Выбирайте фильм, раздачу в 4K или 1080p, переключайте звуковые дорожки и наслаждайтесь просмотром без задержек!
                  </p>
                </div>
              </div>
            </div>

            {/* ШАГ 10: FAQ И ДИАГНОСТИКА */}
            <div className="p-6 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-4 font-sans">
              <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-[#e6e3df]/10 pb-3">
                <span className="w-7 h-7 rounded-xl bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs font-bold">10</span>
                <span>ШАГ 10. Диагностика и решение частых вопросов (FAQ)</span>
              </div>
              <div className="space-y-3 text-xs text-[#e6e3df]/80">
                <div className="p-3.5 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-1">
                  <span className="font-bold text-[#d4b581] block font-mono">1. Как сбросить пароль от Prowlarr:</span>
                  <p className="text-[11px] text-[#e6e3df]/60">
                    Выполните: <code className="text-white">sudo sed -i 's/&lt;AuthenticationMethod&gt;.*&lt;\\/AuthenticationMethod&gt;/&lt;AuthenticationMethod&gt;None&lt;\\/AuthenticationMethod&gt;/g' /opt/prowlarr/config/config.xml && sudo docker restart prowlarr</code>
                  </p>
                </div>
                <div className="p-3.5 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-1">
                  <span className="font-bold text-[#d4b581] block font-mono">2. Ошибка SSL в RuTracker:</span>
                  <p className="text-[11px] text-[#e6e3df]/60">
                    В выпадающем списке Base Url трекера выберите зеркало <code className="text-[#38bdf8]">https://rutracker.net/</code> или <code className="text-[#38bdf8]">https://rutracker.nl/</code>.
                  </p>
                </div>
                <div className="p-3.5 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-1">
                  <span className="font-bold text-[#d4b581] block font-mono">3. Проверка статуса всех служб:</span>
                  <p className="text-[11px] text-[#e6e3df]/60">
                    Выполните: <code className="text-white">pm2 status && sudo systemctl status torrserver nginx && sudo docker ps</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 00-B. PROXY & BYPASS RUTRACKER IN RUSSIA (DANTE, 3PROXY, TOR SOCKS5)       */}
      {/* ========================================================================= */}
      {selectedVariant === 'proxy' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="p-6 md:p-8 bg-[#0f0e0d] border border-amber-500/40 rounded-3xl space-y-4 shadow-[0_0_30px_rgba(245,158,11,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold uppercase mb-1">
                  🇷🇺 НАСТРОЙКА ДЛЯ РОССИИ • ОБХОД БЛОКИРОВОК RUTRACKER И NNM-CLUB
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white font-serif tracking-tight">
                  Создание своего прокси и маршрутизация трекеров в Prowlarr
                </h3>
                <p className="text-xs text-[#e6e3df]/70 font-sans mt-1">
                  Благодаря системе тегов (Tags) через прокси пойдут <b>только заблокированные трекеры</b> (RuTracker, NNM-Club), а открытые российские трекеры (Rutor) будут искать напрямую на максимальной скорости.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Вариант 0: VLESS Reality / Xray SOCKS5 */}
            <div className="p-6 bg-[#141312] border border-cyan-500/30 rounded-2xl space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e3df]/10 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-7 h-7 rounded-xl bg-cyan-400/20 text-cyan-400 flex items-center justify-center font-mono text-xs font-bold">★</span>
                  <span>Вариант 0: VLESS Reality / Xray SOCKS5 (100% стабильно в РФ)</span>
                </div>
                <button
                  onClick={() => copyToClipboard(`bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)"\n\nsudo tee /usr/local/etc/xray/config.json > /dev/null << 'EOF'\n{\n  "log": { "loglevel": "warning" },\n  "inbounds": [\n    {\n      "listen": "0.0.0.0",\n      "port": 10808,\n      "protocol": "socks",\n      "settings": { "auth": "noauth", "udp": true }\n    }\n  ],\n  "outbounds": [\n    {\n      "protocol": "vless",\n      "settings": {\n        "vnext": [\n          {\n            "address": "ВАШ_ЗАРУБЕЖНЫЙ_IP_ИЛИ_ДОМЕН",\n            "port": 443,\n            "users": [\n              {\n                "id": "ВАШ_UUID",\n                "flow": "xtls-rprx-vision",\n                "encryption": "none"\n              }\n            ]\n          }\n        ]\n      },\n      "streamSettings": {\n        "network": "tcp",\n        "security": "reality",\n        "realitySettings": {\n          "show": false,\n          "fingerprint": "chrome",\n          "serverName": "yahoo.com",\n          "publicKey": "ВАШ_PUBLIC_KEY",\n          "shortId": "ВАШ_SHORT_ID",\n          "spiderX": ""\n        }\n      }\n    }\n  ]\n}\nEOF\n\nsudo systemctl restart xray && sudo systemctl enable xray\ncurl -s -x socks5h://127.0.0.1:10808 https://checkip.amazonaws.com`, 'sec_proxy_vless')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_proxy_vless' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_proxy_vless' ? 'Скопировано' : 'Копировать всё'}</span>
                </button>
              </div>
              <p className="text-xs text-[#e6e3df]/70 leading-relaxed font-sans">
                В экосистеме <b>stream-net</b> запущен локальный контейнер <b>xray-client</b> (<code className="text-emerald-400">172.19.0.4:10809</code> HTTP / <code className="text-emerald-400">172.19.0.4:10808</code> SOCKS5). В Prowlarr укажите Host: <code className="text-white">172.19.0.4</code> (или <code className="text-white">xray-client</code>), Port: <code className="text-white">10809</code> (HTTP) или <code className="text-white">10808</code> (SOCKS5), Tags: <code className="text-amber-400 font-bold">proxy</code>.
              </p>
            </div>

            {/* Вариант 1: xray-client в Docker stream-net */}
            <div className="p-6 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e3df]/10 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-7 h-7 rounded-xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold">1</span>
                  <span>Вариант 1 (Архитектура stream-net): xray-client (VLESS / Shadowsocks / Trojan)</span>
                </div>
                <button
                  onClick={() => copyToClipboard(`sudo mkdir -p /opt/xray\n\nsudo docker run -d \\\n  --name=xray-client \\\n  --network=stream-net \\\n  -p 10808:10808 \\\n  -p 10809:10809 \\\n  -v /opt/xray/config.json:/etc/xray/config.json \\\n  --restart always \\\n  teddysun/xray:latest`, 'sec_proxy_xray')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_proxy_xray' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_proxy_xray' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <p className="text-xs text-[#e6e3df]/70 leading-relaxed font-sans">
                Запущен в сети <code className="text-emerald-400">stream-net</code> на IP <code className="text-emerald-400">172.19.0.4</code>. Предоставляет SOCKS5 (10808) и HTTP (10809) порты для прозрачной маршрутизации заблокированных трекеров.
              </p>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px] font-mono">
{`sudo mkdir -p /opt/xray

sudo docker run -d \\
  --name=xray-client \\
  --network=stream-net \\
  -p 10808:10808 \\
  -p 10809:10809 \\
  -v /opt/xray/config.json:/etc/xray/config.json \\
  --restart always \\
  teddysun/xray:latest`}
              </pre>
              <div className="p-3.5 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl text-[11px] text-[#e6e3df]/70 space-y-1">
                <span className="font-bold text-[#d4b581] block">Параметры для Prowlarr:</span>
                <p>• <b>Host:</b> <code className="text-white">172.19.0.4</code> (или <code className="text-white">xray-client</code>)</p>
                <p>• <b>Port:</b> <code className="text-white">10809</code> (HTTP) или <code className="text-white">10808</code> (SOCKS5)</p>
                <p>• <b>Tags:</b> <code className="text-amber-400 font-bold">proxy</code></p>
              </div>
            </div>

            {/* Вариант 2: Dante SOCKS5 на зарубежном VPS */}
            <div className="p-6 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e3df]/10 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-7 h-7 rounded-xl bg-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center font-mono text-xs font-bold">2</span>
                  <span>Вариант 2: Свой SOCKS5 сервер на Dante (для зарубежного VPS)</span>
                </div>
                <button
                  onClick={() => copyToClipboard(`sudo apt update && sudo apt install -y danted\n\nsudo tee /etc/danted.conf > /dev/null << 'EOF'\nlogoutput: /var/log/danted.log\ninternal: 0.0.0.0 port = 1080\nexternal: eth0\n\nsocksmethod: username\nclientmethod: none\n\nclient pass {\n    from: 0.0.0.0/0 to: 0.0.0.0/0\n    log: error\n}\n\nsocks pass {\n    from: 0.0.0.0/0 to: 0.0.0.0/0\n    command: bind connect udpassociate\n    log: error\n    socksmethod: username\n}\nEOF\n\nsudo useradd -r -s /bin/false proxyuser\necho "proxyuser:StrongProxyPass2026!" | sudo chpasswd\n\nsudo systemctl restart danted && sudo systemctl enable danted`, 'sec_proxy_dante')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_proxy_dante' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_proxy_dante' ? 'Скопировано' : 'Копировать всё'}</span>
                </button>
              </div>
              <p className="text-xs text-[#e6e3df]/70 leading-relaxed font-sans">
                Если у вас есть отдельный сервер в Нидерландах, Германии или Финляндии — выполните этот скрипт там:
              </p>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px] font-mono">
{`# 1. Установка Dante SOCKS5
sudo apt update && sudo apt install -y danted

# 2. Конфигурация сервера
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

# 3. Пользователь с паролем
sudo useradd -r -s /bin/false proxyuser
echo "proxyuser:StrongProxyPass2026!" | sudo chpasswd

# 4. Запуск службы
sudo systemctl restart danted && sudo systemctl enable danted`}
              </pre>
            </div>

            {/* Вариант 3: 3proxy */}
            <div className="p-6 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e3df]/10 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-7 h-7 rounded-xl bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs font-bold">3</span>
                  <span>Вариант 3: Универсальный 3proxy (HTTP + SOCKS5)</span>
                </div>
                <button
                  onClick={() => copyToClipboard(`sudo apt update && sudo apt install -y 3proxy\n\nsudo tee /etc/3proxy/3proxy.cfg > /dev/null << 'EOF'\ndaemon\nmaxconn 200\nnserver 1.1.1.1\nnserver 8.8.8.8\nnscache 65536\ntimeouts 1 5 30 60 180 1800 15 60\n\nusers proxyuser:CL:StrongProxyPass2026!\nauth strong\n\nproxy -p3128\nsocks -p1080\nEOF\n\nsudo systemctl restart 3proxy && sudo systemctl enable 3proxy`, 'sec_proxy_3proxy')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_proxy_3proxy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_proxy_3proxy' ? 'Скопировано' : 'Копировать всё'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px] font-mono">
{`sudo apt update && sudo apt install -y 3proxy

sudo tee /etc/3proxy/3proxy.cfg > /dev/null << 'EOF'
daemon
maxconn 200
nserver 1.1.1.1
nserver 8.8.8.8
nscache 65536
timeouts 1 5 30 60 180 1800 15 60

users proxyuser:CL:StrongProxyPass2026!
auth strong

proxy -p3128
socks -p1080
EOF

sudo systemctl restart 3proxy && sudo systemctl enable 3proxy`}
              </pre>
            </div>

            {/* Настройка в Prowlarr по тегам */}
            <div className="p-6 bg-[#141312] border border-[#d4b581]/30 rounded-2xl space-y-4 font-sans">
              <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-[#e6e3df]/10 pb-3">
                <span className="w-7 h-7 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-mono text-xs font-bold">★</span>
                <span>Пошаговая настройка маршрутизации по тегам в Prowlarr</span>
              </div>
              <div className="space-y-3 text-xs text-[#e6e3df]/80">
                <div className="p-3.5 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-1.5">
                  <span className="font-bold text-amber-400 block font-mono">1. Добавление прокси с тегом:</span>
                  <p className="text-[11px] text-[#e6e3df]/60 leading-relaxed">
                    Откройте <b>Settings &rarr; Indexers &rarr; Proxies &rarr; + (Add) &rarr; HTTP Proxy</b> (или Socks5). Укажите Host: <code className="text-emerald-400">172.19.0.4</code> (или <code className="text-white">xray-client</code>), Port: <code className="text-emerald-400">10809</code> (или <code className="text-white">10808</code>), в поле <b>Tags</b> введите слово <code className="text-amber-400 font-bold">proxy</code> и нажмите <b>Enter</b> &rarr; <b>Save</b>.
                  </p>
                </div>

                <div className="p-3.5 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-1.5">
                  <span className="font-bold text-amber-400 block font-mono">2. Привязка тега к заблокированным трекерам:</span>
                  <p className="text-[11px] text-[#e6e3df]/60 leading-relaxed">
                    В <b>Indexers &rarr; RuTracker.org</b> в поле <b>Tags</b> введите <code className="text-amber-400 font-bold">proxy</code>. Повторите для <b>NNM-Club</b>.
                  </p>
                </div>

                <div className="p-3.5 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-1.5">
                  <span className="font-bold text-emerald-400 block font-mono">3. Открытые трекеры работают без прокси:</span>
                  <p className="text-[11px] text-[#e6e3df]/60 leading-relaxed">
                    В трекере <b>Rutor</b> оставьте поле <b>Tags пустым</b>. Prowlarr будет отправлять запросы напрямую, что обеспечит моментальный ответ без задержек прокси-серверов.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 00-C. MEDIA APPLICATIONS (JELLYSEERR / OVERSEERR, RADARR, SONARR)         */}
      {/* ========================================================================= */}
      {selectedVariant === 'apps' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="p-6 md:p-8 bg-[#0f0e0d] border border-cyan-500/40 rounded-3xl space-y-4 shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] font-bold uppercase mb-1">
                  🎬 МЕДИА-ПРИЛОЖЕНИЯ • JELLYSEERR / OVERSEERR, RADARR, SONARR
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white font-serif tracking-tight">
                  Синхронизация трекеров Prowlarr с каталогами фильмов и сериалов
                </h3>
                <p className="text-xs text-[#e6e3df]/70 font-sans mt-1">
                  Prowlarr выступает как единый центр трекеров: настраивая Rutor, RuTracker и NNM-Club один раз, вы автоматически пробрасываете их в Radarr (фильмы), Sonarr (сериалы) и Jellyseerr/Overseerr (витрина запросов).
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* 1. Jellyseerr в Docker */}
            <div className="p-6 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e3df]/10 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-7 h-7 rounded-xl bg-cyan-400/20 text-cyan-400 flex items-center justify-center font-mono text-xs font-bold">1</span>
                  <span>Jellyseerr / Overseerr: Каталог и витрина запросов фильмов и сериалов</span>
                </div>
                <button
                  onClick={() => copyToClipboard(`sudo mkdir -p /opt/jellyseerr/config\nsudo chmod -R 777 /opt/jellyseerr/config\n\nsudo docker run -d \\\n  --name=jellyseerr \\\n  --network=stream-net \\\n  -p 5055:5055 \\\n  -e LOG_LEVEL=debug \\\n  -e TZ=Europe/Moscow \\\n  -v /opt/jellyseerr/config:/app/config \\\n  --restart always \\\n  fallenbagel/jellyseerr:latest`, 'sec_apps_jellyseerr')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_apps_jellyseerr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_apps_jellyseerr' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <p className="text-xs text-[#e6e3df]/70 leading-relaxed font-sans">
                Красивый веб-интерфейс для поиска новинок TMDB, просмотра трейлеров и отправки запросов на просмотр:
              </p>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px] font-mono">
{`sudo mkdir -p /opt/jellyseerr/config
sudo chmod -R 777 /opt/jellyseerr/config

sudo docker run -d \\
  --name=jellyseerr \\
  --network=stream-net \\
  -p 5055:5055 \\
  -e LOG_LEVEL=debug \\
  -e TZ=Europe/Moscow \\
  -v /opt/jellyseerr/config:/app/config \\
  --restart always \\
  fallenbagel/jellyseerr:latest`}
              </pre>
              <div className="p-3.5 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl text-[11px] text-[#e6e3df]/70 space-y-1">
                <span className="font-bold text-cyan-400 block">Адрес веб-интерфейса:</span>
                <p>• <code className="text-white">http://IP_ВАШЕГО_VPS:5055</code> (или внутри Docker-сети: <code className="text-emerald-400">http://172.19.0.2:5055</code> / <code className="text-emerald-400">http://jellyseerr:5055</code>)</p>
              </div>
            </div>

            {/* 2. Radarr и Sonarr в Docker */}
            <div className="p-6 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e3df]/10 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-7 h-7 rounded-xl bg-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center font-mono text-xs font-bold">2</span>
                  <span>Radarr (Фильмы, 172.19.0.8:7878) & Sonarr (Сериалы, 172.19.0.9:8989) в Docker</span>
                </div>
                <button
                  onClick={() => copyToClipboard(`sudo mkdir -p /opt/radarr/config /opt/sonarr/config\nsudo chmod -R 777 /opt/radarr/config /opt/sonarr/config\n\nsudo docker run -d \\\n  --name=radarr \\\n  --network=stream-net \\\n  -p 7878:7878 \\\n  -e PUID=1000 \\\n  -e PGID=1000 \\\n  -e TZ=Europe/Moscow \\\n  -v /opt/radarr/config:/config \\\n  --restart always \\\n  lscr.io/linuxserver/radarr:latest\n\nsudo docker run -d \\\n  --name=sonarr \\\n  --network=stream-net \\\n  -p 8989:8989 \\\n  -e PUID=1000 \\\n  -e PGID=1000 \\\n  -e TZ=Europe/Moscow \\\n  -v /opt/sonarr/config:/config \\\n  --restart always \\\n  lscr.io/linuxserver/sonarr:latest`, 'sec_apps_servarr')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_apps_servarr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_apps_servarr' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px] font-mono">
{`# Папки конфигурации
sudo mkdir -p /opt/radarr/config /opt/sonarr/config
sudo chmod -R 777 /opt/radarr/config /opt/sonarr/config

# Запуск Radarr (Фильмы, 172.19.0.8)
sudo docker run -d \\
  --name=radarr \\
  --network=stream-net \\
  -p 7878:7878 \\
  -e PUID=1000 \\
  -e PGID=1000 \\
  -e TZ=Europe/Moscow \\
  -v /opt/radarr/config:/config \\
  --restart always \\
  lscr.io/linuxserver/radarr:latest

# Запуск Sonarr (Сериалы, 172.19.0.9)
sudo docker run -d \\
  --name=sonarr \\
  --network=stream-net \\
  -p 8989:8989 \\
  -e PUID=1000 \\
  -e PGID=1000 \\
  -e TZ=Europe/Moscow \\
  -v /opt/sonarr/config:/config \\
  --restart always \\
  lscr.io/linuxserver/sonarr:latest`}
              </pre>
            </div>

            {/* 3. Инструкция по привязке в Prowlarr */}
            <div className="p-6 bg-[#141312] border border-[#d4b581]/30 rounded-2xl space-y-4 font-sans">
              <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-[#e6e3df]/10 pb-3">
                <span className="w-7 h-7 rounded-xl bg-cyan-400/20 text-cyan-400 flex items-center justify-center font-mono text-xs font-bold">★</span>
                <span>Настройка автоматической синхронизации в Prowlarr</span>
              </div>
              <div className="space-y-3 text-xs text-[#e6e3df]/80">
                <div className="p-3.5 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-1.5">
                  <span className="font-bold text-cyan-400 block font-mono">1. Скопируйте API-ключи:</span>
                  <p className="text-[11px] text-[#e6e3df]/60 leading-relaxed">
                    В веб-интерфейсе <b>Radarr</b> (<code className="text-white">http://IP:7878</code>) и <b>Sonarr</b> (<code className="text-white">http://IP:8989</code>) перейдите в <b>Settings &rarr; General &rarr; Security</b> и скопируйте <b>API Key</b>.
                  </p>
                </div>

                <div className="p-3.5 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-1.5">
                  <span className="font-bold text-cyan-400 block font-mono">2. Добавьте приложения в Prowlarr:</span>
                  <p className="text-[11px] text-[#e6e3df]/60 leading-relaxed">
                    В <b>Prowlarr</b> (<code className="text-white">http://IP:9696</code>) откройте <b>Settings &rarr; Applications &rarr; + (Add)</b>:
                  </p>
                  <ul className="list-disc pl-5 mt-1 space-y-0.5 text-[11px] text-[#e6e3df]/60 font-mono">
                    <li>Для Radarr: Prowlarr Server = <code className="text-white">http://prowlarr:9696</code>, Radarr Server = <code className="text-white">http://radarr:7878</code>, вставьте API Key &rarr; <b>Test & Save</b>.</li>
                    <li>Для Sonarr: Prowlarr Server = <code className="text-white">http://prowlarr:9696</code>, Sonarr Server = <code className="text-white">http://sonarr:8989</code>, вставьте API Key &rarr; <b>Test & Save</b>.</li>
                  </ul>
                </div>

                <div className="p-3.5 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-1.5">
                  <span className="font-bold text-emerald-400 block font-mono">3. Итог работы связки:</span>
                  <p className="text-[11px] text-[#e6e3df]/60 leading-relaxed">
                    Любой добавленный в Prowlarr трекер (Rutor, RuTracker, NNM-Club) моментально становится доступен во всех подключенных сервисах без ручной настройки.
                  </p>
                </div>

                <div className="p-3.5 bg-[#0a0a09] border border-cyan-500/30 rounded-xl space-y-2">
                  <span className="font-bold text-cyan-400 block font-mono">4. Настройка Jellyseerr (Каталог и поиск):</span>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#e6e3df]/70 font-sans">
                    <li>Откройте <code className="text-white">http://IP_VPS:5055</code> &rarr; войдите под админом.</li>
                    <li>В <b>Settings &rarr; General</b> установите язык <b>Русский (ru)</b> и регион <b>Россия (RU)</b>.</li>
                    <li>В <b>Settings &rarr; Services &rarr; Radarr</b>: Host = <code className="text-white">radarr</code>, Port = <code className="text-white">7878</code>, вставьте API-ключ Radarr, выберите Quality Profile &rarr; <b>Save</b>.</li>
                    <li>В <b>Settings &rarr; Services &rarr; Sonarr</b>: Host = <code className="text-white">sonarr</code>, Port = <code className="text-white">8989</code>, вставьте API-ключ Sonarr &rarr; <b>Save</b>.</li>
                    <li>В <b>Settings &rarr; Users</b> включите <b>Auto-Approve Movies / Series</b> для мгновенной отправки запросов в поиск.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 4. Развертывание сайта-каталога Alex HD */}
            <div className="p-6 bg-[#141312] border border-[#d4b581]/40 rounded-2xl space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e3df]/10 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-7 h-7 rounded-xl bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs font-bold">🌐</span>
                  <span>Развертывание веб-сайта и каталога Alex HD на своем VPS</span>
                </div>
                <button
                  onClick={() => copyToClipboard(`sudo mkdir -p /var/www/alexhd\nsudo chown -R $USER:$USER /var/www/alexhd\ncd /var/www/alexhd\n\ngit clone https://github.com/Zakkkie/Alex-HD.git .\n\ncat << 'EOF' > /var/www/alexhd/.env\nPORT=3000\nNODE_ENV=production\nDATABASE_URL=postgres://alexhd_user:StrongAlexHdPass2026!@127.0.0.1:5432/alexhd_db\nJWT_SECRET=super_secret_jwt_alexhd_production_token_8899221100ffaa\nMAX_DEVICES_PER_USER=3\nTORRSERVER_URL=http://172.19.0.6:8090\nPROWLARR_URL=http://172.19.0.5:9696\nPROWLARR_API_KEY=ВАШ_API_КЛЮЧ_ИЗ_PROWLARR\nJELLYSEERR_URL=http://172.19.0.2:5055\nJELLYFIN_URL=http://172.19.0.7:8096\nRADARR_URL=http://172.19.0.8:7878\nSONARR_URL=http://172.19.0.9:8989\nTMDB_API_KEY=8ad0507b40ebd45a065a73530395afd1\nEOF\n\nnpm install\nnpm run build\n\npm2 start ecosystem.config.cjs 2>/dev/null || pm2 start dist/server.cjs --name "alexhd-core"\npm2 save\npm2 startup | tail -n 1 | bash 2>/dev/null || true`, 'sec_apps_alexhd_site')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_apps_alexhd_site' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_apps_alexhd_site' ? 'Скопировано' : 'Копировать всё'}</span>
                </button>
              </div>
              <p className="text-xs text-[#e6e3df]/70 leading-relaxed font-sans">
                Сайт Alex HD объединяет в себе онлайн-каталог TMDB, поиск раздач через Prowlarr/Torznab, воспроизведение через TorrServer RAM-буфер и Smart TV MSX:
              </p>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px] font-mono">
{`# 1. Клонирование и установка
sudo mkdir -p /var/www/alexhd
sudo chown -R $USER:$USER /var/www/alexhd
cd /var/www/alexhd
git clone https://github.com/Zakkkie/Alex-HD.git .

# 2. Установка зависимостей и сборка
npm install
npm run build

# 3. Запуск через PM2
pm2 start dist/server.cjs --name "alexhd-core"
pm2 save`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 0. STREAMING ARCHITECTURE: ZERO-DISK ON-DEMAND (SEERR + PROWLARR + TORRSERVER) */}
      {/* ========================================================================= */}
      {selectedVariant === 'streaming' && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 bg-[#0f0e0d] border border-[#d4b581]/40 rounded-3xl space-y-4 shadow-[0_0_30px_rgba(212,181,129,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#d4b581]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-3 rounded-2xl bg-[#d4b581]/20 text-[#d4b581] border border-[#d4b581]/40">
                <Play className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold uppercase mb-1">
                  100% В ОПЕРАТИВНОЙ ПАМЯТИ (RAM) • 0 МБ НА ДИСКЕ
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white font-serif tracking-tight">
                  Архитектура Zero-Disk Стриминга: Seerr &rarr; Prowlarr &rarr; TorrServer &rarr; Плеер
                </h3>
                <p className="text-xs text-[#e6e3df]/70 font-sans mt-1">
                  Платформа создана для <b>мгновенного онлайн-просмотра</b> прямо из торрент-сетей без предварительного скачивания и сохранения файлов на диск VPS.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Architectural Pipeline Diagram */}
            <div className="p-6 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-4 font-sans">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#d4b581]" />
                Как устроен непрерывный поток данных (On-Demand Pipeline)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                {/* 1. Discovery */}
                <div className="p-4 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-lg bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs font-bold">1</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#d4b581]/10 text-[#d4b581] font-mono">Витрина</span>
                  </div>
                  <div className="font-bold text-white text-xs">Seerr / Alex HD</div>
                  <p className="text-[11px] text-[#e6e3df]/60 leading-normal">
                    Пользователь выбирает фильм или серию в красивом каталоге (постеры 4K, трейлеры, актеры, озвучки).
                  </p>
                </div>

                {/* 2. Indexer */}
                <div className="p-4 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-lg bg-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center font-mono text-xs font-bold">2</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] font-mono">Поиск</span>
                  </div>
                  <div className="font-bold text-white text-xs">Prowlarr</div>
                  <p className="text-[11px] text-[#e6e3df]/60 leading-normal">
                    Мгновенно опрашивает трекеры (RuTracker, Rutor, Kinozal) и находит активные magnet-ссылки с максимальным числом сидов.
                  </p>
                </div>

                {/* 3. Engine */}
                <div className="p-4 bg-[#0a0a09] rounded-xl border border-emerald-500/20 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold">3</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">Движок</span>
                  </div>
                  <div className="font-bold text-emerald-400 text-xs">TorrServer MatriX</div>
                  <p className="text-[11px] text-[#e6e3df]/60 leading-normal">
                    Загружает только нужные куски видео в <b>RAM-буфер (200 МБ)</b> и отдает видеопоток в HTTP/HLS.
                  </p>
                </div>

                {/* 4. Player */}
                <div className="p-4 bg-[#0a0a09] rounded-xl border border-purple-500/20 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-mono text-xs font-bold">4</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono">Плеер</span>
                  </div>
                  <div className="font-bold text-purple-400 text-xs">HTML5 / Smart TV</div>
                  <p className="text-[11px] text-[#e6e3df]/60 leading-normal">
                    Воспроизведение стартует через 3-5 секунд. При закрытии вкладки память RAM мгновенно освобождается!
                  </p>
                </div>
              </div>
            </div>

            {/* Comparison: Traditional Torrent Server vs Zero-Disk Streaming */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3 font-sans">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <FolderMinus className="w-4 h-4 text-emerald-400" />
                Почему эта схема в 10 раз лучше классических «торрент-качалок»?
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
                <div className="p-4 bg-red-950/10 border border-red-500/20 rounded-xl space-y-2">
                  <span className="text-red-400 font-bold block">❌ Классические торрент-качалки (qBittorrent / Radarr / Plex):</span>
                  <ul className="list-disc pl-4 text-[#e6e3df]/70 space-y-1 text-[11px]">
                    <li>Требуют огромные HDD/SSD диски на <b>4-16 ТБ</b> стоимостью от 15 000 ₽ / месяц.</li>
                    <li>Нужно ждать 15-40 минут, пока фильм скачается целиком.</li>
                    <li>Диск постоянно забивается, нужно вручную удалять просмотренные файлы.</li>
                    <li>Быстрый износ SSD-накопителей терабайтами циклов записи.</li>
                  </ul>
                </div>

                <div className="p-4 bg-emerald-950/10 border border-emerald-500/20 rounded-xl space-y-2">
                  <span className="text-emerald-400 font-bold block">✅ Наш Zero-Disk Стриминг (Alex HD + TorrServer):</span>
                  <ul className="list-disc pl-4 text-[#e6e3df]/70 space-y-1 text-[11px]">
                    <li>Хватает самого дешевого VPS за <b>200-300 ₽/мес</b> с 10 ГБ диска и 1-2 ГБ RAM.</li>
                    <li>Фильм начинает играть <b>через 3-5 секунд</b> после нажатия кнопки Play.</li>
                    <li><b>0 байт на диске</b> — файлы крутятся только в оперативной памяти (RAM).</li>
                    <li>Никогда не закончится место на сервере — можно смотреть тысячи 4K-релизов подряд.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Perfect TorrServer Zero-Disk Config */}
            <div className="p-5 bg-[#141312] border border-emerald-500/20 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  Конфигурация TorrServer для работы строго в RAM (Zero-Disk)
                </span>
                <button
                  onClick={() => copyToClipboard(`curl -X POST http://127.0.0.1:8090/settings/set -H "Content-Type: application/json" -d '{"CacheSize": 209715200, "PreloadCache": 50, "UseDisk": false, "ReaderReadAHead": 95, "RetrackersMode": 1, "TorrentDisconnectTimeout": 30}'`, 'sec_torr_ram_cfg')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_torr_ram_cfg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_torr_ram_cfg' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <p className="text-[11px] text-[#e6e3df]/70 font-sans leading-relaxed">
                Выполните эту команду на вашем VPS. Она настроит TorrServer на хранение буфера исключительно в оперативной памяти (200 МБ) с мгновенной предзагрузкой 50% буфера перед стартом и полным отключением записи на диск (<code className="text-white">UseDisk: false</code>):
              </p>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`# Применяем идеальные настройки стриминга в RAM через API TorrServer
curl -X POST http://127.0.0.1:8090/settings/set \\
  -H "Content-Type: application/json" \\
  -d '{
    "CacheSize": 209715200,
    "PreloadCache": 50,
    "UseDisk": false,
    "ReaderReadAHead": 95,
    "RetrackersMode": 1,
    "TorrentDisconnectTimeout": 30
  }'`}
              </pre>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 font-sans text-[11px]">
                <div className="p-2.5 bg-[#0a0a09] rounded-lg border border-[#e6e3df]/10">
                  <span className="text-[#d4b581] font-bold block">CacheSize: 200MB</span>
                  <span className="text-[#e6e3df]/60 text-[10px]">Оптимальный размер буфера в RAM для плавного воспроизведения 4K</span>
                </div>
                <div className="p-2.5 bg-[#0a0a09] rounded-lg border border-[#e6e3df]/10">
                  <span className="text-emerald-400 font-bold block">UseDisk: false</span>
                  <span className="text-[#e6e3df]/60 text-[10px]">Полный запрет записи на SSD, износ диска равен нулю</span>
                </div>
                <div className="p-2.5 bg-[#0a0a09] rounded-lg border border-[#e6e3df]/10">
                  <span className="text-[#38bdf8] font-bold block">PreloadCache: 50%</span>
                  <span className="text-[#e6e3df]/60 text-[10px]">Старт воспроизведения сразу после заполнения половины буфера (3-5 сек)</span>
                </div>
              </div>
            </div>

            {/* Seerr (Overseerr / Jellyseerr) & Alex HD Integration */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3 font-sans">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-[#d4b581]" />
                Как подключить Jellyseerr / Overseerr (если вы хотите использовать внешнюю витрину)
              </h4>
              <p className="text-xs text-[#e6e3df]/70 leading-relaxed">
                Наш веб-интерфейс <b>Alex HD</b> уже содержит встроенный интерфейс каталога, поиска и плеера. Но если у вас уже развернут <b>Overseerr</b> или <b>Jellyseerr</b>:
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 text-xs text-[#e6e3df]/70">
                <li>В Jellyseerr/Overseerr пользователи ищут фильмы и отправляют заявки на просмотр.</li>
                <li>Prowlarr автоматически находит торренты по этим заявкам.</li>
                <li>TorrServer открывает прямую трансляцию по клику на magnet-ссылку без скачивания на диск.</li>
                <li>Встроенный плеер Alex HD воспроизводит поток по протоколу HTTP/HLS на любых устройствах: ПК, планшетах, смартфонах и Smart TV (через MSX/Media Station X).</li>
              </ol>
            </div>
          </div>
        </div>
      )}

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

            {/* Step 5: Prowlarr Setup */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <span className="w-6 h-6 rounded-lg bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs">5</span>
                  Установка Prowlarr (Поисковый индексер трекеров) в Docker
                </span>
                <button
                  onClick={() => copyToClipboard(`curl -fsSL https://get.docker.com -o get-docker.sh\nsudo sh get-docker.sh\nsudo systemctl enable --now docker\n\nsudo docker run -d \\\n  --name=prowlarr \\\n  -e PUID=1000 \\\n  -e PGID=1000 \\\n  -e TZ=Europe/Moscow \\\n  --dns 77.88.8.8 \\\n  --dns 8.8.8.8 \\\n  -p 9696:9696 \\\n  -v /opt/prowlarr/config:/config \\\n  --restart always \\\n  lscr.io/linuxserver/prowlarr:latest`, 'step5_prow')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'step5_prow' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'step5_prow' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <p className="text-[11px] text-[#e6e3df]/70 font-sans leading-relaxed">
                Внимание! TorrServer только воспроизводит поток. Чтобы бэкенд Alex HD мог искать и парсить торренты по каталогу трекеров (RuTracker, Rutor и др.), требуется запустить поисковый индексер <b>Prowlarr</b> в Docker с надежным публичным DNS (это обойдет встроенную фильтрацию провайдеров и решит частую ошибку DNS/SSL):
              </p>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`# 1. Быстрая официальная установка Docker (если он еще не стоит на VPS)
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo systemctl enable --now docker

# 2. Запуск контейнера Prowlarr с принудительными DNS Яндекс и Google
sudo docker run -d \\
  --name=prowlarr \\
  -e PUID=1000 \\
  -e PGID=1000 \\
  -e TZ=Europe/Moscow \\
  --dns 77.88.8.8 \\
  --dns 8.8.8.8 \\
  -p 9696:9696 \\
  -v /opt/prowlarr/config:/config \\
  --restart always \\
  lscr.io/linuxserver/prowlarr:latest`}
              </pre>
              <div className="p-3.5 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-1 font-sans text-[11px] text-[#e6e3df]/90">
                <p className="font-bold text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Настройка в веб-панели Prowlarr:
                </p>
                <ol className="list-decimal pl-4 space-y-1 mt-1 text-[#e6e3df]/70">
                  <li>Откройте <code className="text-white font-mono">http://IP_СЕРВЕРА:9696</code> в вашем браузере.</li>
                  <li>Перейдите в меню <b>Indexers</b> (Индексаторы) &rarr; <b>Add New</b> и добавьте трекеры (например, <i>RuTracker, Rutor, Kinozal, NoNameClub</i>).</li>
                  <li>Зайдите в <b>Settings &rarr; General</b> (Настройки &rarr; Общие) и скопируйте длинный <b>API Key</b>.</li>
                  <li>Вставьте адрес <code className="text-white font-mono">http://IP_СЕРВЕРА:9696</code> и полученный <b>API Key</b> в форму ниже на этой странице админ-панели.</li>
                </ol>
              </div>
            </div>

            {/* Step 6: Backend & PM2 */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <span className="w-6 h-6 rounded-lg bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs">6</span>
                  Сборка проекта и запуск бэкенда через PM2
                </span>
                <button
                  onClick={() => copyToClipboard(`cd /var/www/alexhd\nnpm install\nnpm run build\npm2 start ecosystem.config.cjs\npm2 save\npm2 startup`, 'step6')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'step6' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'step6' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#e6e3df]/90 overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`cd /var/www/alexhd
npm install
npm run build

# Запуск службы в фоне
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup`}
              </pre>
            </div>

            {/* Step 7: Firewall UFW */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <span className="w-6 h-6 rounded-lg bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs">7</span>
                  Открытие сетевых портов брандмауэра (UFW)
                </span>
                <button
                  onClick={() => copyToClipboard(`sudo ufw allow 22/tcp\nsudo ufw allow 3000/tcp\nsudo ufw allow 8090/tcp\nsudo ufw allow 9696/tcp\nsudo ufw allow 35432/tcp\nsudo ufw allow 35432/udp\nsudo ufw allow 51413/tcp\nsudo ufw allow 51413/udp\nsudo ufw --force enable`, 'step7')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'step7' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'step7' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 3000/tcp comment 'Alex HD Core API'
sudo ufw allow 8090/tcp comment 'TorrServer MatriX'
sudo ufw allow 9696/tcp comment 'Prowlarr Search Indexer'
sudo ufw allow 35432/tcp comment 'TorrServer DHT TCP'
sudo ufw allow 35432/udp comment 'TorrServer DHT UDP'
sudo ufw allow 51413/tcp comment 'TorrServer Peer Wire'
sudo ufw --force enable`}
              </pre>
            </div>

            {/* Step 8: Vercel env */}
            <div className="p-5 bg-[#141312] border border-[#d4b581]/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <span className="w-6 h-6 rounded-lg bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs">8</span>
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
      {/* 2. SECURITY: FAIL2BAN & HARDENING */}
      {/* ========================================================================= */}
      {selectedVariant === 'security' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#0f0e0d] border border-emerald-500/30 rounded-3xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-serif">Защита сервера: Fail2ban, SSH ключи и Hardening</h3>
                <p className="text-xs text-[#e6e3df]/70 font-sans">
                  Комплексная защита вашего VPS от брутфорса, ботнетов, сканеров уязвимостей и несанкционированного доступа.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Step S1: Fail2ban Installation */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-xs">1</span>
                  Установка и автозапуск Fail2ban
                </span>
                <button
                  onClick={() => copyToClipboard(`sudo apt update && sudo apt install fail2ban -y\nsudo systemctl enable --now fail2ban\nsudo fail2ban-client status`, 'sec_f2b_inst')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_f2b_inst' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_f2b_inst' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <p className="text-[11px] text-[#e6e3df]/70 font-sans leading-relaxed">
                Fail2ban мониторит системные логи (SSH, Nginx) и автоматически блокирует IP-адреса, которые делают повторяющиеся неудачные попытки входа или сканируют порты.
              </p>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`sudo apt update && sudo apt install fail2ban -y
sudo systemctl enable --now fail2ban
sudo fail2ban-client status`}
              </pre>
            </div>

            {/* Step S2: Fail2ban Configuration */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-xs">2</span>
                  Настройка правил (/etc/fail2ban/jail.local)
                </span>
                <button
                  onClick={() => copyToClipboard(`sudo bash -c 'cat > /etc/fail2ban/jail.local << "EOF"
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
sudo systemctl restart fail2ban`, 'sec_jail_cfg')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_jail_cfg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_jail_cfg' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <p className="text-[11px] text-[#e6e3df]/70 font-sans leading-relaxed">
                Данная конфигурация блокирует IP на <b>24 часа</b> после 3 неудачных попыток ввода пароля SSH в течение 10 минут, а также банит ботов, сканирующих Nginx.
              </p>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`sudo bash -c 'cat > /etc/fail2ban/jail.local << "EOF"
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

# Перезапуск сервиса с новыми правилами
sudo systemctl restart fail2ban`}
              </pre>
            </div>

            {/* Step S3: Useful Fail2ban Commands */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3">
              <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-xs">3</span>
                Полезные команды управления Fail2ban
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10">
                  <span className="text-[#e6e3df]/60 text-[10px] block font-sans">Посмотреть список заблокированных IP:</span>
                  <code className="text-emerald-400 text-[11px] block mt-1">sudo fail2ban-client status sshd</code>
                </div>
                <div className="p-3 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10">
                  <span className="text-[#e6e3df]/60 text-[10px] block font-sans">Разблокировать случайно забаненный IP:</span>
                  <code className="text-emerald-400 text-[11px] block mt-1">sudo fail2ban-client set sshd unbanip 1.2.3.4</code>
                </div>
              </div>
            </div>

            {/* Step S4: SSH Hardening & Key Authentication */}
            <div className="p-5 bg-[#141312] border border-amber-500/20 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono text-xs">4</span>
                  SSH Hardening: Вход строго по ключам (Отключение паролей)
                </span>
                <button
                  onClick={() => copyToClipboard(`sudo bash -c 'echo "PasswordAuthentication no" >> /etc/ssh/sshd_config.d/99-disable-passwords.conf'\nsudo systemctl restart ssh || sudo systemctl restart sshd`, 'sec_ssh_keys')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_ssh_keys' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_ssh_keys' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-1 font-sans text-[11px] text-[#e6e3df]/90">
                <p className="font-bold text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Внимание: сначала убедитесь, что вы скопировали ваш публичный SSH-ключ на сервер!
                </p>
                <p className="text-[#e6e3df]/70">
                  На вашем локальном компьютере выполните команду: <code className="text-white font-mono">ssh-copy-id root@IP_ВАШЕГО_VPS</code> и проверьте, что вы можете войти без ввода пароля.
                </p>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`# 1. Запрещаем аутентификацию по паролю (полная защита от взлома по словарю)
sudo bash -c 'echo "PasswordAuthentication no" >> /etc/ssh/sshd_config.d/99-disable-passwords.conf'
sudo bash -c 'echo "PermitRootLogin prohibit-password" >> /etc/ssh/sshd_config.d/99-disable-passwords.conf'

# 2. Перезапускаем службу SSH
sudo systemctl restart ssh || sudo systemctl restart sshd`}
              </pre>
            </div>

            {/* Step S5: UFW Rate Limiting & Unattended Upgrades */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-xs">5</span>
                  UFW Rate Limit и Автообновления безопасности
                </span>
                <button
                  onClick={() => copyToClipboard(`sudo ufw limit 22/tcp comment 'Anti-brute force limit'\nsudo apt install unattended-upgrades -y\nsudo dpkg-reconfigure -plow unattended-upgrades`, 'sec_upgrades')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_upgrades' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_upgrades' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`# 1. Включаем аппаратное ограничение частоты подключений UFW для SSH
sudo ufw limit 22/tcp comment 'Anti-brute force limit'

# 2. Включаем автоматическую установку критических патчей безопасности Ubuntu
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PROWLARR: TRACKERS, EXTENSIONS & FLARESOLVERR */}
      {/* ========================================================================= */}
      {selectedVariant === 'prowlarr' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#0f0e0d] border border-amber-500/30 rounded-3xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-serif">Prowlarr: Трекеры, Индексаторы & FlareSolverr</h3>
                <p className="text-xs text-[#e6e3df]/70 font-sans">
                  Как устроен поиск торрентов, какие трекеры добавлять вместо IMDb и как обходить Cloudflare-защиту.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Architecture Explanation */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3 font-sans">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-[#d4b581]" />
                Почему TMDB + Prowlarr, а не IMDb?
              </h4>
              <p className="text-xs text-[#e6e3df]/70 leading-relaxed">
                <b>IMDb</b> — это закрытая база данных без бесплатного быстрого API для поиска файлов. В Alex HD используется современная двухконтурная архитектура:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10 space-y-1">
                  <span className="text-[#d4b581] font-bold text-xs">1. Каталог (TMDB / Кинопоиск API)</span>
                  <p className="text-[#e6e3df]/60 text-[11px] leading-normal">
                    Отвечает за медиатеку: красивые постеры в 4K, названия на русском и английском, актеров, сюжет, жанры, рейтинги и трейлеры.
                  </p>
                </div>
                <div className="p-3 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10 space-y-1">
                  <span className="text-emerald-400 font-bold text-xs">2. Поиск раздач (Prowlarr)</span>
                  <p className="text-[#e6e3df]/60 text-[11px] leading-normal">
                    Поисковый шлюз: по запросу мгновенно опрашивает десятки торрент-трекеров (RuTracker, Rutor, Kinozal) и находит доступные сиды, дубляжи и 4K HDR релизы.
                  </p>
                </div>
              </div>
            </div>

            {/* Recommended Trackers List */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3 font-sans">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4b581]" />
                Рекомендуемые индексаторы (трекеры) для добавления в Prowlarr
              </h4>
              <p className="text-xs text-[#e6e3df]/70 leading-relaxed">
                Откройте веб-панель Prowlarr (<code className="text-white font-mono">http://IP_СЕРВЕРА:9696</code>) &rarr; <b>Indexers</b> &rarr; <b>Add New</b> и добавьте следующие трекеры:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-3 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#d4b581]">RuTracker.org</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Нужен аккаунт</span>
                  </div>
                  <p className="text-[#e6e3df]/60 text-[11px]">
                    Главный каталог в СНГ. Огромная база редких фильмов, дубляжей и коллекций. В настройках введите свой логин и пароль.
                  </p>
                </div>

                <div className="p-3 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">Rutor (rutor.info)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Без регистрации</span>
                  </div>
                  <p className="text-[#e6e3df]/60 text-[11px]">
                    Открытый трекер. Моментальное появление свежих новинок кинопроката, сериалов и максимальное число раздающих (сидов).
                  </p>
                </div>

                <div className="p-3 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#38bdf8]">Kinozal.tv</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Нужен аккаунт</span>
                  </div>
                  <p className="text-[#e6e3df]/60 text-[11px]">
                    Качественные релизы и топовые студийные дубляжи (Red Head Sound, Flarrow Films, HDRezka Studio).
                  </p>
                </div>

                <div className="p-3 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-400">NNM-Club (NoName)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Без регистрации</span>
                  </div>
                  <p className="text-[#e6e3df]/60 text-[11px]">
                    Лучший трекер для тяжелых 4K HDR / Dolby Vision Remux и Blu-ray оригиналов с многоканальным звуком.
                  </p>
                </div>

                <div className="p-3 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-400">LostFilm.tv</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Нужен аккаунт</span>
                  </div>
                  <p className="text-[#e6e3df]/60 text-[11px]">
                    Лучшие зарубежные сериалы с профессиональной многоголосой озвучкой LostFilm.
                  </p>
                </div>

                <div className="p-3 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-400">1337x / TorrentGalaxy</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Без регистрации</span>
                  </div>
                  <p className="text-[#e6e3df]/60 text-[11px]">
                    Зарубежные оригиналы в 4K UHD с оригинальной английской дорожкой (Dolby Atmos) и субтитрами.
                  </p>
                </div>
              </div>
            </div>

            {/* FlareSolverr Setup */}
            <div className="p-5 bg-[#141312] border border-sky-500/20 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-mono text-xs">⚡️</span>
                  FlareSolverr: Расширение для обхода Cloudflare защиты и капч
                </span>
                <button
                  onClick={() => copyToClipboard(`sudo docker run -d \\\n  --name=flaresolverr \\\n  --network=alexhd-net \\\n  -p 8191:8191 \\\n  -e LOG_LEVEL=info \\\n  -e TZ=Europe/Moscow \\\n  --shm-size=1g \\\n  --restart always \\\n  ghcr.io/flaresolverr/flaresolverr:latest`, 'sec_flaresolverr')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_flaresolverr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_flaresolverr' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <p className="text-[11px] text-[#e6e3df]/70 font-sans leading-relaxed">
                Многие трекеры (RuTracker, Rutor) защищены от ботов проверками Cloudflare / DDoS-Guard. FlareSolverr — это headless-браузер в Docker, который автоматически решает эти проверки в фоне для Prowlarr.
              </p>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`# 1. Запуск контейнера FlareSolverr на порту 8191
sudo docker run -d \\
  --name=flaresolverr \\
  --network=alexhd-net \\
  -p 8191:8191 \\
  -e LOG_LEVEL=info \\
  -e TZ=Europe/Moscow \\
  --shm-size=1g \\
  --restart always \\
  ghcr.io/flaresolverr/flaresolverr:latest`}
              </pre>
              <div className="p-3.5 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-2 font-sans text-[11px] text-[#e6e3df]/90">
                <span className="font-bold text-[#d4b581] block">Как подключить FlareSolverr в Prowlarr:</span>
                <ol className="list-decimal pl-4 space-y-1 text-[#e6e3df]/70">
                  <li>В веб-панели Prowlarr перейдите в <b>Settings &rarr; Indexers</b>.</li>
                  <li>В блоке <b>Proxies</b> нажмите кнопку <b>+ (Add Proxy)</b> и выберите <b>FlareSolverr</b>.</li>
                  <li>В поле <b>Host</b> введите <code className="text-white font-mono">http://flaresolverr:8191</code>.</li>
                  <li>Поле <b>Tags</b> оставьте пустым (чтобы прокси работал для всех трекеров).</li>
                  <li>Нажмите <b>Test</b> &rarr; <b>Save</b>. Теперь все Cloudflare-челленджи решаются автоматически!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DOMAIN: DOMAIN, DDNS & DIRECT IP ACCESS */}
      {/* ========================================================================= */}
      {selectedVariant === 'domain' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#0f0e0d] border border-sky-500/30 rounded-3xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-serif">Домен, Бесплатный DDNS и Прямой доступ по IP</h3>
                <p className="text-xs text-[#e6e3df]/70 font-sans">
                  Как открывать сайт без домена по IP-адресу или настроить бесплатный домен с SSL за пару минут.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Option A: Direct IP */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-mono text-xs">A</span>
                  Вариант 1: Как обойтись полностью БЕЗ домена (Доступ по прямому IP)
                </span>
              </div>
              <p className="text-[11px] text-[#e6e3df]/70 font-sans leading-relaxed">
                Вам не обязательно покупать домен. Вы можете заходить на сайт и админку напрямую по IP вашего сервера:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
                <div className="p-3 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10">
                  <span className="text-[#e6e3df]/50 text-[10px] block font-sans">САЙТ И ПЛЕЕР</span>
                  <code className="text-[#d4b581] font-bold text-xs block mt-1">http://IP_VPS:3000</code>
                </div>
                <div className="p-3 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10">
                  <span className="text-[#e6e3df]/50 text-[10px] block font-sans">TORRSERVER</span>
                  <code className="text-emerald-400 font-bold text-xs block mt-1">http://IP_VPS:8090</code>
                </div>
                <div className="p-3 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10">
                  <span className="text-[#e6e3df]/50 text-[10px] block font-sans">PROWLARR</span>
                  <code className="text-[#38bdf8] font-bold text-xs block mt-1">http://IP_VPS:9696</code>
                </div>
              </div>
              <div className="p-3 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-2 font-sans text-[11px]">
                <span className="font-bold text-white block">Как убрать порт :3000 и открывать сайт просто по http://IP_VPS/?</span>
                <p className="text-[#e6e3df]/70">
                  Настройте Nginx на прослушивание стандартного HTTP-порта 80, чтобы браузер открывал приложение без указания порта в строке адреса:
                </p>
                <pre className="p-3 bg-black/60 rounded text-[#38bdf8] font-mono text-[10px] overflow-x-auto">
{`# В файле /etc/nginx/sites-available/default:
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
}`}
                </pre>
              </div>
            </div>

            {/* Option B: Free DDNS DuckDNS */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm font-sans">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-xs">B</span>
                  Вариант 2: Бесплатный динамический домен через DuckDNS + Бесплатный SSL
                </span>
                <button
                  onClick={() => copyToClipboard(`mkdir -p ~/duckdns\ncat > ~/duckdns/duck.sh << 'EOF'\necho url="https://www.duckdns.org/update?domains=YOUR_DOMAIN&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -\nEOF\nchmod 700 ~/duckdns/duck.sh\n(crontab -l 2>/dev/null; echo "*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1") | crontab -\nsudo certbot --nginx -d YOUR_DOMAIN.duckdns.org`, 'sec_duckdns')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
                >
                  {copiedId === 'sec_duckdns' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'sec_duckdns' ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <p className="text-[11px] text-[#e6e3df]/70 font-sans leading-relaxed">
                <b>DuckDNS.org</b> — бесплатный сервис, дающий субдомен вида <code className="text-[#d4b581]">мой-кинотеатр.duckdns.org</code> навсегда без оплаты и кредитных карт.
              </p>
              <div className="space-y-2 font-sans text-[11px] text-[#e6e3df]/80">
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Зайдите на <a href="https://www.duckdns.org" target="_blank" rel="noreferrer" className="text-[#d4b581] underline">duckdns.org</a> и войдите через GitHub или Google.</li>
                  <li>Создайте субдомен (например, <code className="text-white">alex-cinema</code>) и укажите IP вашего VPS.</li>
                  <li>Скопируйте ваш персональный <b>Token</b>.</li>
                </ol>
              </div>
              <pre className="p-3.5 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`# 1. Автоматическое обновление IP для DuckDNS раз в 5 минут
mkdir -p ~/duckdns
cat > ~/duckdns/duck.sh << 'EOF'
echo url="https://www.duckdns.org/update?domains=ВАШ_ДОМЕН&token=ВАШ_ТОКЕН&ip=" | curl -k -o ~/duckdns/duck.log -K -
EOF
chmod 700 ~/duckdns/duck.sh
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1") | crontab -

# 2. Получение бесплатного официального SSL-сертификата Let's Encrypt
sudo certbot --nginx -d ВАШ_ДОМЕН.duckdns.org`}
              </pre>
            </div>

            {/* Option C: Custom Domain + Cloudflare */}
            <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3 font-sans">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-lg bg-[#d4b581]/20 text-[#d4b581] flex items-center justify-center font-mono text-xs">C</span>
                  Вариант 3: Собственный домен + Cloudflare (Максимальная защита и скорость)
                </span>
              </div>
              <p className="text-xs text-[#e6e3df]/70 leading-relaxed">
                Если вы купили собственный домен (например, на Reg.ru, Namecheap или Spaceship от 150₽/год), подключите его к бесплатному DNS от <b>Cloudflare</b>:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs font-mono">
                <div className="p-3 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10">
                  <span className="text-[#e6e3df]/50 text-[10px] block font-sans">A-ЗАПИСЬ (ROOT)</span>
                  <span className="text-white block mt-1 font-bold">@ &rarr; IP_ВАШЕГО_VPS</span>
                  <span className="text-amber-400 text-[10px] block mt-1 font-sans">Proxy ON (Оранжевое облако)</span>
                </div>
                <div className="p-3 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10">
                  <span className="text-[#e6e3df]/50 text-[10px] block font-sans">A-ЗАПИСЬ (SUBDOMAIN)</span>
                  <span className="text-white block mt-1 font-bold">tv &rarr; IP_ВАШЕГО_VPS</span>
                  <span className="text-amber-400 text-[10px] block mt-1 font-sans">Proxy ON (Оранжевое облако)</span>
                </div>
                <div className="p-3 bg-[#0a0a09] rounded-xl border border-[#e6e3df]/10">
                  <span className="text-[#e6e3df]/50 text-[10px] block font-sans">SSL РЕЖИМ</span>
                  <span className="text-emerald-400 block mt-1 font-bold">Full / Strict</span>
                  <span className="text-[#e6e3df]/60 text-[10px] block mt-1 font-sans">Автоматический HTTPS</span>
                </div>
              </div>
              <ul className="list-disc pl-4 text-[#e6e3df]/70 text-xs space-y-1 mt-2">
                <li><b>Скрытие реального IP:</b> Боты и злоумышленники видят только IP-адреса Cloudflare, ваш сервер защищен от прямых DDoS-атак.</li>
                <li><b>Автоматический SSL:</b> Cloudflare бесплатно выпускает и автоматически продлевает SSL-сертификаты.</li>
                <li><b>Глобальный CDN-кэш:</b> Постеры фильмов и статичные скрипты загружаются мгновенно с ближайшего сервера Cloudflare.</li>
              </ul>
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
            <h3 className="text-lg font-bold text-white font-serif">Вариант 3: Запуск полного стека из 8 контейнеров в сети stream-net</h3>
            <p className="text-xs text-[#e6e3df]/70 leading-relaxed font-sans">
              Отказоустойчивая мультимедийная экосистема: Jellyseerr (витрина), Prowlarr + FlareSolverr + xray-client (поиск с обходом Cloudflare и блокировок), Radarr/Sonarr (автоматизация), TorrServer (стриминг в RAM 0MB диска) и Jellyfin (домашний медиасервер), объединенные в виртуальную сеть <code className="text-[#d4b581]">stream-net</code> (<code className="text-[#d4b581]">172.19.0.0/16</code>).
            </p>
          </div>

          <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-sans text-sm">Полный docker-compose.yml (8 сервисов)</span>
              <button
                onClick={() => copyToClipboard(`version: '3.8'

networks:
  stream-net:
    driver: bridge
    ipam:
      config:
        - subnet: 172.19.0.0/16

services:
  jellyseerr:
    image: fallenbagel/jellyseerr:latest
    container_name: jellyseerr
    networks:
      stream-net:
        ipv4_address: 172.19.0.2
    ports:
      - "5055:5055"
    environment:
      - LOG_LEVEL=debug
      - TZ=Europe/Moscow
    volumes:
      - /opt/jellyseerr/config:/app/config
    restart: always

  flaresolverr:
    image: flaresolverr/flaresolverr:latest
    container_name: flaresolverr
    networks:
      stream-net:
        ipv4_address: 172.19.0.3
    ports:
      - "8191:8191"
    environment:
      - LOG_LEVEL=info
      - TZ=Europe/Moscow
    restart: always

  xray-client:
    image: teddysun/xray:latest
    container_name: xray-client
    networks:
      stream-net:
        ipv4_address: 172.19.0.4
    ports:
      - "10808:10808"
      - "10809:10809"
    volumes:
      - /opt/xray/config.json:/etc/xray/config.json
    restart: always

  prowlarr:
    image: lscr.io/linuxserver/prowlarr:latest
    container_name: prowlarr
    networks:
      stream-net:
        ipv4_address: 172.19.0.5
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Moscow
      - HTTP_PROXY=http://172.19.0.4:10809
      - HTTPS_PROXY=http://172.19.0.4:10809
      - NO_PROXY=localhost,127.0.0.1,172.19.0.0/16,stream-net
    dns:
      - 77.88.8.8
      - 8.8.8.8
    ports:
      - "9696:9696"
    volumes:
      - /opt/prowlarr/config:/config
    restart: always

  torrserver:
    image: yourok/torrserver:latest
    container_name: torrserver
    networks:
      stream-net:
        ipv4_address: 172.19.0.6
    ports:
      - "8090:8090"
    volumes:
      - /opt/torrserver/db:/db
      - /opt/torrserver/cache:/cache
    restart: always

  jellyfin:
    image: lscr.io/linuxserver/jellyfin:latest
    container_name: jellyfin
    networks:
      stream-net:
        ipv4_address: 172.19.0.7
    ports:
      - "8096:8096"
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Moscow
    volumes:
      - /opt/jellyfin/config:/config
      - /opt/jellyfin/media:/media
    restart: always

  radarr:
    image: lscr.io/linuxserver/radarr:latest
    container_name: radarr
    networks:
      stream-net:
        ipv4_address: 172.19.0.8
    ports:
      - "7878:7878"
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Moscow
    volumes:
      - /opt/radarr/config:/config
    restart: always

  sonarr:
    image: lscr.io/linuxserver/sonarr:latest
    container_name: sonarr
    networks:
      stream-net:
        ipv4_address: 172.19.0.9
    ports:
      - "8989:8989"
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Moscow
    volumes:
      - /opt/sonarr/config:/config
    restart: always`, 'docker_compose_tmpl')}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
              >
                {copiedId === 'docker_compose_tmpl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'docker_compose_tmpl' ? 'Скопировано' : 'Копировать'}</span>
              </button>
            </div>
            <pre className="p-4 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`version: '3.8'

networks:
  stream-net:
    driver: bridge
    ipam:
      config:
        - subnet: 172.19.0.0/16

services:
  # 1. Jellyseerr — каталог и медиа-витрина запросов (172.19.0.2:5055)
  jellyseerr:
    image: fallenbagel/jellyseerr:latest
    container_name: jellyseerr
    networks:
      stream-net:
        ipv4_address: 172.19.0.2
    ports:
      - "5055:5055"
    environment:
      - LOG_LEVEL=debug
      - TZ=Europe/Moscow
    volumes:
      - /opt/jellyseerr/config:/app/config
    restart: always

  # 2. FlareSolverr — обход защиты Cloudflare для трекеров (172.19.0.3:8191)
  flaresolverr:
    image: flaresolverr/flaresolverr:latest
    container_name: flaresolverr
    networks:
      stream-net:
        ipv4_address: 172.19.0.3
    ports:
      - "8191:8191"
    environment:
      - LOG_LEVEL=info
      - TZ=Europe/Moscow
    restart: always

  # 3. xray-client — прокси-клиент для заблокированных трекеров (172.19.0.4:10809)
  xray-client:
    image: teddysun/xray:latest
    container_name: xray-client
    networks:
      stream-net:
        ipv4_address: 172.19.0.4
    ports:
      - "10808:10808"
      - "10809:10809"
    volumes:
      - /opt/xray/config.json:/etc/xray/config.json
    restart: always

  # 4. Prowlarr — поисковый индексер трекеров (172.19.0.5:9696)
  prowlarr:
    image: lscr.io/linuxserver/prowlarr:latest
    container_name: prowlarr
    networks:
      stream-net:
        ipv4_address: 172.19.0.5
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Moscow
      - HTTP_PROXY=http://172.19.0.4:10809
      - HTTPS_PROXY=http://172.19.0.4:10809
      - NO_PROXY=localhost,127.0.0.1,172.19.0.0/16,stream-net
    dns:
      - 77.88.8.8
      - 8.8.8.8
    ports:
      - "9696:9696"
    volumes:
      - /opt/prowlarr/config:/config
    restart: always

  # 5. TorrServer — движок стриминга в RAM (172.19.0.6:8090)
  torrserver:
    image: yourok/torrserver:latest
    container_name: torrserver
    networks:
      stream-net:
        ipv4_address: 172.19.0.6
    ports:
      - "8090:8090"
    volumes:
      - /opt/torrserver/db:/db
      - /opt/torrserver/cache:/cache
    restart: always

  # 6. Jellyfin — медиасервер (172.19.0.7:8096)
  jellyfin:
    image: lscr.io/linuxserver/jellyfin:latest
    container_name: jellyfin
    networks:
      stream-net:
        ipv4_address: 172.19.0.7
    ports:
      - "8096:8096"
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Moscow
    volumes:
      - /opt/jellyfin/config:/config
      - /opt/jellyfin/media:/media
    restart: always

  # 7. Radarr — управление каталогом фильмов (172.19.0.8:7878)
  radarr:
    image: lscr.io/linuxserver/radarr:latest
    container_name: radarr
    networks:
      stream-net:
        ipv4_address: 172.19.0.8
    ports:
      - "7878:7878"
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Moscow
    volumes:
      - /opt/radarr/config:/config
    restart: always

  # 8. Sonarr — управление каталогом сериалов (172.19.0.9:8989)
  sonarr:
    image: lscr.io/linuxserver/sonarr:latest
    container_name: sonarr
    networks:
      stream-net:
        ipv4_address: 172.19.0.9
    ports:
      - "8989:8989"
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Moscow
    volumes:
      - /opt/sonarr/config:/config
    restart: always`}
            </pre>
          </div>

          <div className="p-5 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-sans text-sm">Команды для развертывания сети stream-net</span>
              <button
                onClick={() => copyToClipboard(`sudo mkdir -p /opt/jellyseerr/config /opt/xray /opt/prowlarr/config /opt/torrserver/db /opt/torrserver/cache /opt/jellyfin/config /opt/jellyfin/media /opt/radarr/config /opt/sonarr/config\nsudo chmod -R 777 /opt/jellyseerr /opt/prowlarr /opt/torrserver /opt/jellyfin /opt/radarr /opt/sonarr\n\n# Создаем сеть stream-net (если не создана)\nsudo docker network create --subnet=172.19.0.0/16 stream-net 2>/dev/null || true\n\nnano docker-compose.yml\ndocker compose up -d\n\n# Проверить статус контейнеров\ndocker network inspect stream-net --format '{{range .Containers}}{{.Name}} ({{.IPv4Address}}){{"\\n"}}{{end}}'`, 'docker_cmd')}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#1f1e1c] hover:bg-[#2e2c28] border border-[#d4b581]/30 rounded-lg text-[#d4b581] text-xs transition-all cursor-pointer"
              >
                {copiedId === 'docker_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'docker_cmd' ? 'Скопировано' : 'Копировать'}</span>
              </button>
            </div>
            <pre className="p-4 bg-[#0a0a09] rounded-xl text-[#38bdf8] overflow-x-auto border border-[#e6e3df]/10 leading-relaxed text-[11px]">
{`# 1. Создаем директории для всех 8 сервисов
sudo mkdir -p /opt/jellyseerr/config /opt/xray /opt/prowlarr/config \\
  /opt/torrserver/db /opt/torrserver/cache /opt/jellyfin/config /opt/jellyfin/media \\
  /opt/radarr/config /opt/sonarr/config
sudo chmod -R 777 /opt/jellyseerr /opt/prowlarr /opt/torrserver /opt/jellyfin /opt/radarr /opt/sonarr

# 2. Создаем сеть stream-net
sudo docker network create --subnet=172.19.0.0/16 stream-net 2>/dev/null || true

# 3. Сохраняем docker-compose.yml и запускаем
nano docker-compose.yml
docker compose up -d

# 4. Проверяем распределение IP в stream-net:
docker network inspect stream-net --format '{{range .Containers}}{{.Name}} ({{.IPv4Address}}){{"\\n"}}{{end}}'`}
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

            <div className="p-4 bg-[#141312] border border-[#e6e3df]/10 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Проверка Prowlarr API</span>
                <span className="text-emerald-400 text-[10px]">HTTP 200/302</span>
              </div>
              <pre className="p-2 bg-black/40 rounded text-[#38bdf8] text-[11px]">curl -I http://127.0.0.1:9696</pre>
            </div>
          </div>

          <div className="p-6 bg-[#141312] border border-[#d4b581]/20 rounded-3xl space-y-4">
            <h4 className="font-bold text-white text-sm font-sans flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#d4b581]" />
              Что делать при ошибке DNS/SSL в Prowlarr («Unable to connect to indexer / DNS-SSL connection issues»)?
            </h4>
            <p className="text-xs text-[#e6e3df]/70 leading-relaxed font-sans">
              Если Prowlarr не может проверить или добавить торрент-трекеры, ссылаясь на невозможность установить защищенное соединение SSL или ошибки DNS, воспользуйтесь следующим планом:
            </p>
            <div className="space-y-3 font-sans text-xs">
              <div className="p-3 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-1">
                <span className="font-bold text-[#d4b581]">Решение 1. Принудительное назначение надежных DNS контейнеру</span>
                <p className="text-[#e6e3df]/60 text-[11px] leading-normal">
                  По умолчанию контейнеры Docker наследуют локальный DNS вашего хоста, который часто рендерит локальную петлю (например, 127.0.0.53) и не имеет выхода наружу. Пересоздайте контейнер Prowlarr, указав независимые DNS-сервера:
                </p>
                <code className="block p-2 bg-black/40 rounded text-emerald-400 text-[10px] whitespace-pre overflow-x-auto leading-normal">
{`docker stop prowlarr && docker rm prowlarr
docker run -d \\
  --name=prowlarr \\
  -e PUID=1000 -e PGID=1000 -e TZ=Europe/Moscow \\
  --dns 77.88.8.8 \\
  --dns 8.8.8.8 \\
  -p 9696:9696 \\
  -v /opt/prowlarr/config:/config \\
  --restart always \\
  lscr.io/linuxserver/prowlarr:latest`}
                </code>
              </div>

              <div className="p-3 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-1">
                <span className="font-bold text-[#d4b581]">Решение 2. Обход блокировок Роскомнадзора (Прокси)</span>
                <p className="text-[#e6e3df]/60 text-[11px] leading-normal">
                  Многие трекеры заблокированы провайдерами РФ, поэтому Prowlarr не может проверить к ним доступ напрямую.
                </p>
                <ul className="list-disc pl-4 text-[#e6e3df]/60 text-[11px] space-y-1 mt-1">
                  <li>Откройте Prowlarr и перейдите в <b>Settings &rarr; Connection</b>.</li>
                  <li>Добавьте ваше прокси-соединение (HTTP / Socks5).</li>
                  <li>В поле <b>Filter</b> укажите только заблокированные адреса через запятую (например, <code className="text-white">rutracker.org, kinozal.tv, rutor.info</code>). Это пустит запросы к ним в обход блокировок, сохранив максимальную скорость на остальных ресурсах.</li>
                </ul>
              </div>

              <div className="p-3 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl space-y-1">
                <span className="font-bold text-[#d4b581]">Решение 3. Отключение неиспользуемого IPv6</span>
                <p className="text-[#e6e3df]/60 text-[11px] leading-normal">
                  Если на вашем сервере нет активного IPv6, но Prowlarr упорно пытается делать HTTPS-запросы через него, отключите IPv6 в расширенных настройках (<b>Settings &rarr; General &rarr; Show Advanced</b>) или отключите IPv6 на стороне сетевой карты хоста.
                </p>
              </div>

              <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl space-y-2 mt-4 text-[#e6e3df]/90">
                <span className="font-bold text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Почему деплой на Vercel блокирует TorrServer и синхронизацию TMDB?
                </span>
                <p className="text-[11px] leading-normal text-[#e6e3df]/70">
                  При размещении фронтенда на Vercel вы сталкиваетесь со следующими ограничениями, из-за которых не работает TorrServer и обновление каталога:
                </p>
                <ul className="list-disc pl-4 space-y-2 text-[11px] text-[#e6e3df]/70 mt-1">
                  <li>
                    <b>Блокировка Mixed Content (HTTPS &rarr; HTTP):</b> Vercel всегда раздает сайт по защищенному протоколу <code className="text-white">https://</code>. Ваш TorrServer запущен на VPS по протоколу <code className="text-white">http://</code>. Браузер наотрез блокирует любые сетевые медиа-запросы к незащищенным IP-адресам со страниц HTTPS.
                  </li>
                  <li>
                    <b>Serverless-таймаут (10 секунд):</b> Синхронизация каталога TMDB — длительная фоновая операция. Serverless-функции Vercel на бесплатном тарифе принудительно завершаются ровно через 10 секунд, возвращая ошибку <code className="text-white">504 Gateway Timeout</code>.
                  </li>
                  <li>
                    <b>Файловая система Read-Only:</b> Контейнеры Vercel не сохраняют файлы. Попытка записать локальный кэш фильмов или SQLite-базу на диск сервера вызовет ошибку записи или сбросится через минуту.
                  </li>
                </ul>
                <div className="pt-2 border-t border-red-500/10 text-[11px] font-bold text-white">
                  Решение: Размещайте фронтенд и бэкенд на одном VPS-сервере (Вариант 1 или 3), либо настройте HTTPS Reverse Proxy на VPS для работы по защищенному SSL-соединению.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
