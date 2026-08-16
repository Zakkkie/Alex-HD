import React, { useState } from 'react';
import {
  Server,
  Activity,
  Terminal,
  Copy,
  Check,
  Zap,
  Shield,
  ShieldCheck,
  Globe,
  HardDrive,
  Cpu,
  RefreshCw,
  Code2,
  BookOpen,
  ArrowRight,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  Sparkles
} from 'lucide-react';
import { ServerNode } from '../../types';
import { adminStore } from '../../data/adminStore';
import { api } from '../../api/client';

interface IntegrationGuideProps {
  nodes: ServerNode[];
  onDataRefresh: () => void;
}

export const IntegrationGuide: React.FC<IntegrationGuideProps> = ({ nodes, onDataRefresh }) => {
  // Config Generator State
  const [selectedRole, setSelectedRole] = useState<'torrserver' | 'edge_cdn' | 'transcoder' | 'scraper'>('torrserver');
  const [nodeId, setNodeId] = useState('node-edge-01');
  const [nodeIp, setNodeIp] = useState('194.87.142.10');
  const [nodePort, setNodePort] = useState('8090');
  const [nodeLocation, setNodeLocation] = useState('Франкфурт, DE');
  const [nodeSecret, setNodeSecret] = useState('sec_alexhd_cluster_98f12a88');
  const [serverUrl, setServerUrl] = useState(() => window.location.origin);
  const [activeCodeTab, setActiveCodeTab] = useState<'docker' | 'python' | 'nginx' | 'systemd' | 'curl'>('docker');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Live Telemetry Tester State
  const [testNodeId, setTestNodeId] = useState('node-fra-01');
  const [testCpu, setTestCpu] = useState(35);
  const [testRam, setTestRam] = useState(48);
  const [testBandwidth, setTestBandwidth] = useState(4.2);
  const [testStreams, setTestStreams] = useState(12);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  // Generate One-line Curl Installer Command
  const oneLineCommand = `curl -sSL ${serverUrl}/api/v1/install-agent.sh | sudo bash -s -- \\
  --node-id="${nodeId}" \\
  --type="${selectedRole}" \\
  --server="${serverUrl}" \\
  --secret="${nodeSecret}" \\
  --port=${nodePort}`;

  // Generate Docker Compose File
  const dockerComposeContent = `version: '3.8'

services:
  # 1. High-Performance TorrServer MatriX Engine
  torrserver:
    image: yourok/torrserver:latest
    container_name: alexhd_torrserver
    restart: always
    environment:
      - TS_CACHE_SIZE=268435456 # 256 MB RAM Ring Buffer
      - TS_PRELOAD=15          # Preload 15% before stream start
      - TS_TORR_DIR=/torrents
      - TS_LOG_LEVEL=INFO
    ports:
      - "${nodePort}:8090"
      - "51413:51413/tcp"
      - "51413:51413/udp"
    volumes:
      - ./torrents:/torrents
      - ./torrserver_db:/opt/torrserver/db

  # 2. Real-Time Telemetry Daemon (Sends healthcheck to Alex HD Core)
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
      - NODE_ID=${nodeId}
      - NODE_ROLE=${selectedRole}
      - NODE_IP=${nodeIp}
      - NODE_PORT=${nodePort}
      - CORE_SERVER_URL=${serverUrl}
      - NODE_SECRET=${nodeSecret}
      - TELEMETRY_INTERVAL_SEC=10
    command: >
      bash -c "pip install --no-cache-dir requests psutil && python telemetry_daemon.py"

  # 3. Nginx Reverse Proxy with CORS for Smart TVs (Tizen / webOS / MSX)
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
`;

  // Generate Python Telemetry Daemon Script
  const pythonAgentContent = `#!/usr/bin/env python3
"""
Alex HD Cloud - Real-time Edge Node Telemetry Agent
Collects CPU, RAM, Disk, Active TorrServer Streams and reports to Core API.
"""

import time
import os
import psutil
import requests
import json

NODE_ID = os.getenv("NODE_ID", "${nodeId}")
CORE_URL = os.getenv("CORE_SERVER_URL", "${serverUrl}")
SECRET = os.getenv("NODE_SECRET", "${nodeSecret}")
TORR_PORT = os.getenv("NODE_PORT", "${nodePort}")
INTERVAL = int(os.getenv("TELEMETRY_INTERVAL_SEC", "10"))

print(f"[*] Alex HD Telemetry Agent starting for node: {NODE_ID}")
print(f"[*] Target Core API: {CORE_URL}/api/v1/admin/nodes/telemetry")

while True:
    try:
        # 1. System Metrics via psutil
        cpu_usage = round(psutil.cpu_percent(interval=1), 1)
        ram = psutil.virtual_memory()
        ram_usage = round(ram.percent, 1)
        disk = psutil.disk_usage('/')
        disk_usage = round(disk.percent, 1)

        # 2. TorrServer Active Stream Query
        active_streams = 0
        bandwidth_mbps = 0.0
        try:
            r = requests.get(f"http://127.0.0.1:{TORR_PORT}/torrents/list", timeout=3)
            if r.status_code == 200:
                torrents = r.json()
                active_torrents = [t for t in torrents if t.get('stat') in (2, 3)]
                active_streams = len(active_torrents)
                # Compute upload/download rate
                dl_speed = sum(t.get('download_speed', 0) for t in active_torrents)
                bandwidth_mbps = round((dl_speed * 8) / (1024 * 1024), 2)
        except Exception:
            pass

        # 3. Payload preparation
        payload = {
            "nodeId": NODE_ID,
            "hostname": os.getenv("NODE_IP", "${nodeIp}"),
            "region": "${nodeLocation}",
            "cpuUsagePercent": cpu_usage,
            "ramUsagePercent": ram_usage,
            "diskUsagePercent": disk_usage,
            "bandwidthMbps": bandwidth_mbps,
            "activeStreams": active_streams,
            "version": "TorrServer MatriX.134",
            "pingMs": 15
        }

        # 4. Ingest Telemetry to Server
        headers = {
            "Content-Type": "application/json",
            "X-Node-Secret": SECRET
        }

        endpoint = f"{CORE_URL}/api/v1/admin/nodes/telemetry"
        resp = requests.post(endpoint, json=payload, headers=headers, timeout=5)

        if resp.status_code == 200:
            print(f"[OK] Telemetry sent: CPU {cpu_usage}% | RAM {ram_usage}% | Streams {active_streams} | Bandwidth {bandwidth_mbps} Mbps")
        else:
            print(f"[WARN] Core returned status {resp.status_code}: {resp.text}")

    except Exception as e:
        print(f"[ERR] Telemetry collection loop failed: {e}")

    time.sleep(INTERVAL)
`;

  // Generate Nginx CORS Configuration
  const nginxConfigContent = `user nginx;
worker_processes auto;

events {
    worker_connections 2048;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    # Smart TV CORS Header Support (Tizen, webOS, MSX)
    map $http_origin $cors_header {
        default "*";
    }

    server {
        listen 80;
        server_name _;

        # Disable buffering for live video streaming & HLS chunks
        proxy_buffering off;
        proxy_read_timeout 600s;
        proxy_connect_timeout 10s;

        # TorrServer Stream Proxy
        location /stream/ {
            proxy_pass http://127.0.0.1:${nodePort}/stream/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;

            # CORS Headers for Media Station X & Smart TVs
            add_header 'Access-Control-Allow-Origin' $cors_header always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Range, Content-Type, Authorization, X-Device-Id' always;
            add_header 'Access-Control-Expose-Headers' 'Content-Length, Content-Range, Accept-Ranges' always;

            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }

        # TorrServer API Proxy
        location /torrents/ {
            proxy_pass http://127.0.0.1:${nodePort}/torrents/;
            proxy_set_header Host $host;
            add_header 'Access-Control-Allow-Origin' '*' always;
        }

        # Status Healthcheck
        location /health {
            access_log off;
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }
}
`;

  // Generate Systemd Service Unit
  const systemdServiceContent = `[Unit]
Description=Alex HD TorrServer & Telemetry Service
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/alexhd
ExecStart=/opt/alexhd/torrserver -p ${nodePort} -d /opt/alexhd/db -k 268435456
ExecStartPost=/usr/bin/python3 /opt/alexhd/telemetry_daemon.py
Restart=always
RestartSec=5s
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
`;

  // Execute Live Telemetry Test
  const handleSendTestTelemetry = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const payload = {
        nodeId: testNodeId,
        hostname: `${testNodeId}.internal`,
        region: 'Live Diagnostic Tool',
        cpuUsagePercent: Number(testCpu),
        ramUsagePercent: Number(testRam),
        diskUsagePercent: 35,
        bandwidthMbps: Number(testBandwidth) * 1000,
        activeStreams: Number(testStreams),
        pingMs: 14,
        version: 'TorrServer MatriX.134'
      };

      const res = await api.sendTelemetry(payload, nodeSecret);
      setTestResult({
        success: true,
        response: res,
        timestamp: new Date().toLocaleTimeString('ru-RU')
      });

      // Update in admin store directly for instantaneous UI reflection
      adminStore.ingestTelemetry({
        id: testNodeId,
        cpuUsage: Number(testCpu),
        ramUsage: Number(testRam),
        bandwidthGbps: Number(testBandwidth),
        activeStreams: Number(testStreams),
        pingMs: 14,
        version: 'TorrServer MatriX.134'
      });

      onDataRefresh();
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message,
        timestamp: new Date().toLocaleTimeString('ru-RU')
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-10 animate-[fadeIn_0.2s_ease-out] font-sans">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#171615] via-[#1c1b18] to-[#121110] border border-[#d4b581]/30 shadow-[0_0_30px_rgba(212,181,129,0.1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4b581]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4b581]/15 border border-[#d4b581]/30 text-[#d4b581] font-mono text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              ИНТЕГРАЦИЯ УЗЛОВ И СБОР ТЕЛЕМЕТРИИ
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-white tracking-tight">
              Гайд по подключению серверов, сбору данных и сквозной маршрутизации
            </h2>
            <p className="text-sm text-[#e6e3df]/70 leading-relaxed font-sans">
              Подробная документация, готовые скрипты развертывания TorrServer, Nginx-прокси и демонов телеметрии.
              Сервер Alex HD автоматически балансирует нагрузку между нодами по формуле <span className="font-mono text-[#d4b581]">Least-Loaded Routing</span> и собирает метрики CPU, RAM, битрейта и HLS-сессий.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <div className="px-4 py-3 bg-[#0a0a09]/80 border border-[#e6e3df]/10 rounded-2xl font-mono text-xs">
              <span className="text-[#e6e3df]/40 block text-[10px]">КЛАСТЕРНЫЙ ЭНДПОИНТ</span>
              <span className="text-white font-bold">{serverUrl}/api/v1/admin/nodes/telemetry</span>
            </div>
            <div className="px-4 py-3 bg-[#0a0a09]/80 border border-[#e6e3df]/10 rounded-2xl font-mono text-xs">
              <span className="text-[#e6e3df]/40 block text-[10px]">АКТИВНЫХ УЗЛОВ В СЕТИ</span>
              <span className="text-emerald-400 font-bold">{nodes.length} узлов онлайн</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: ARCHITECTURAL DATA FLOW DIAGRAMS */}
      {/* ========================================================================= */}
      <div className="p-6 md:p-8 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-3xl space-y-6">
        <div>
          <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#d4b581]" />
            <span>Архитектура потоков данных и балансировки (Data Pipeline)</span>
          </h3>
          <p className="font-mono text-xs text-[#e6e3df]/50 mt-1">
            Как происходит передача метаданных, маршрутизация плеера и сбор телеметрии
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono text-xs">
          {/* Step 1: Telemetry Loop */}
          <div className="p-5 rounded-2xl bg-[#141312] border border-[#e6e3df]/10 space-y-3 relative group hover:border-[#d4b581]/40 transition-all">
            <div className="w-8 h-8 rounded-xl bg-[#d4b581]/15 text-[#d4b581] font-bold flex items-center justify-center text-sm border border-[#d4b581]/30">
              1
            </div>
            <h4 className="font-bold text-white text-sm">Сбор телеметрии узлов (Heartbeat)</h4>
            <p className="text-[#e6e3df]/60 font-sans text-xs leading-relaxed">
              Каждые 5-15 секунд фоновый демон на каждом сервере собирает метрики CPU, RAM, битрейта и числа активных пиров, отправляя POST-запрос на <code className="text-[#d4b581] bg-black/40 px-1 py-0.5 rounded">/api/v1/admin/nodes/telemetry</code> с заголовком <code className="text-[#38bdf8] bg-black/40 px-1 py-0.5 rounded">X-Node-Secret</code>.
            </p>
            <div className="pt-2 border-t border-[#e6e3df]/5 flex items-center gap-1.5 text-[11px] text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Частота опроса: 10 сек
            </div>
          </div>

          {/* Step 2: Least-Loaded Balancing */}
          <div className="p-5 rounded-2xl bg-[#141312] border border-[#e6e3df]/10 space-y-3 relative group hover:border-[#d4b581]/40 transition-all">
            <div className="w-8 h-8 rounded-xl bg-[#38bdf8]/15 text-[#38bdf8] font-bold flex items-center justify-center text-sm border border-[#38bdf8]/30">
              2
            </div>
            <h4 className="font-bold text-white text-sm">Балансировка Least-Loaded</h4>
            <p className="text-[#e6e3df]/60 font-sans text-xs leading-relaxed">
              При нажатии кнопки «Смотреть» на Smart TV запрос <code className="text-[#d4b581] bg-black/40 px-1 py-0.5 rounded">/api/v1/playback/play</code> вычисляет Load Factor:
              <br />
              <span className="text-[#d4b581] font-bold block my-1">
                L = (CPU*0.3) + (RAM*0.3) + ((Streams/Max)*0.4)
              </span>
              Поток мгновенно направляется на самый свободный узел.
            </p>
            <div className="pt-2 border-t border-[#e6e3df]/5 flex items-center gap-1.5 text-[11px] text-[#38bdf8]">
              <Zap className="w-3.5 h-3.5" /> Задержка маршрутизации &lt; 5 ms
            </div>
          </div>

          {/* Step 3: Client Watch Telemetry */}
          <div className="p-5 rounded-2xl bg-[#141312] border border-[#e6e3df]/10 space-y-3 relative group hover:border-[#d4b581]/40 transition-all">
            <div className="w-8 h-8 rounded-xl bg-purple-400/15 text-purple-400 font-bold flex items-center justify-center text-sm border border-purple-400/30">
              3
            </div>
            <h4 className="font-bold text-white text-sm">Клиентский прогресс (Smart TV)</h4>
            <p className="text-[#e6e3df]/60 font-sans text-xs leading-relaxed">
              Видеоплеер (Media Station X / HTML5 Video) каждые 10 секунд и при паузе отправляет точную позицию воспроизведения на <code className="text-[#d4b581] bg-black/40 px-1 py-0.5 rounded">/api/v1/me/history</code>, гарантируя продолжение просмотра с того же кадра на любом ТВ.
            </p>
            <div className="pt-2 border-t border-[#e6e3df]/5 flex items-center gap-1.5 text-[11px] text-purple-400">
              <Tv className="w-3.5 h-3.5" /> Синхронизация между устройствами
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: INTERACTIVE CONFIG GENERATOR */}
      {/* ========================================================================= */}
      <div className="p-6 md:p-8 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e6e3df]/10">
          <div>
            <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-[#d4b581]" />
              <span>Конструктор подключения и готовые скрипты установки</span>
            </h3>
            <p className="font-mono text-xs text-[#e6e3df]/50 mt-1">
              Настройте параметры узла и скопируйте готовый конфигурационный файл
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#d4b581] bg-[#d4b581]/10 px-3 py-1 rounded-full border border-[#d4b581]/30">
              AUTO CONFIG GENERATOR
            </span>
          </div>
        </div>

        {/* Node Setup Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 font-mono text-xs">
          <div>
            <label className="block text-[#e6e3df]/70 mb-1 font-sans text-xs">Роль узла</label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white outline-none focus:border-[#d4b581] cursor-pointer"
            >
              <option value="torrserver">TorrServer MatriX (P2P Стриминг)</option>
              <option value="edge_cdn">Edge CDN Cache (Nginx)</option>
              <option value="transcoder">FFmpeg Transcoder (GPU HEVC)</option>
              <option value="scraper">Metadata Scraper & Indexer</option>
            </select>
          </div>

          <div>
            <label className="block text-[#e6e3df]/70 mb-1 font-sans text-xs">ID узла в кластере</label>
            <input
              type="text"
              value={nodeId}
              onChange={e => setNodeId(e.target.value)}
              className="w-full px-3 py-2 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white outline-none focus:border-[#d4b581]"
            />
          </div>

          <div>
            <label className="block text-[#e6e3df]/70 mb-1 font-sans text-xs">IP / Домен узла</label>
            <input
              type="text"
              value={nodeIp}
              onChange={e => setNodeIp(e.target.value)}
              className="w-full px-3 py-2 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white outline-none focus:border-[#d4b581]"
            />
          </div>

          <div>
            <label className="block text-[#e6e3df]/70 mb-1 font-sans text-xs">Порт TorrServer</label>
            <input
              type="text"
              value={nodePort}
              onChange={e => setNodePort(e.target.value)}
              className="w-full px-3 py-2 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white outline-none focus:border-[#d4b581]"
            />
          </div>

          <div>
            <label className="block text-[#e6e3df]/70 mb-1 font-sans text-xs">X-Node-Secret</label>
            <input
              type="text"
              value={nodeSecret}
              onChange={e => setNodeSecret(e.target.value)}
              className="w-full px-3 py-2 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-emerald-400 outline-none focus:border-[#d4b581]"
            />
          </div>
        </div>

        {/* Quick One-Line Installer */}
        <div className="p-4 rounded-2xl bg-[#0a0a09] border border-[#d4b581]/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#d4b581] flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Быстрая установка одной командой (Ubuntu / Debian / CentOS)
            </span>
            <button
              onClick={() => copyToClipboard(oneLineCommand, 'oneline')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1c1b18] hover:bg-[#2a2825] text-xs font-mono text-[#d4b581] transition-all cursor-pointer"
            >
              {copiedSection === 'oneline' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSection === 'oneline' ? 'Скопировано' : 'Копировать'}</span>
            </button>
          </div>
          <pre className="p-3 bg-[#141312] rounded-xl text-[#38bdf8] font-mono text-xs overflow-x-auto border border-[#e6e3df]/10">
            {oneLineCommand}
          </pre>
        </div>

        {/* Code Tabs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            <button
              onClick={() => setActiveCodeTab('docker')}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCodeTab === 'docker'
                  ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.3)]'
                  : 'bg-[#171615] text-[#e6e3df]/70 hover:text-white border border-[#e6e3df]/10'
              }`}
            >
              docker-compose.yml
            </button>

            <button
              onClick={() => setActiveCodeTab('python')}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCodeTab === 'python'
                  ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.3)]'
                  : 'bg-[#171615] text-[#e6e3df]/70 hover:text-white border border-[#e6e3df]/10'
              }`}
            >
              telemetry_daemon.py (Скрипт агента)
            </button>

            <button
              onClick={() => setActiveCodeTab('nginx')}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCodeTab === 'nginx'
                  ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.3)]'
                  : 'bg-[#171615] text-[#e6e3df]/70 hover:text-white border border-[#e6e3df]/10'
              }`}
            >
              nginx.conf (CORS для Smart TV)
            </button>

            <button
              onClick={() => setActiveCodeTab('systemd')}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCodeTab === 'systemd'
                  ? 'bg-[#d4b581] text-black shadow-[0_0_15px_rgba(212,181,129,0.3)]'
                  : 'bg-[#171615] text-[#e6e3df]/70 hover:text-white border border-[#e6e3df]/10'
              }`}
            >
              alexhd.service (Systemd daemon)
            </button>
          </div>

          <div className="relative">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => {
                  const code =
                    activeCodeTab === 'docker'
                      ? dockerComposeContent
                      : activeCodeTab === 'python'
                      ? pythonAgentContent
                      : activeCodeTab === 'nginx'
                      ? nginxConfigContent
                      : systemdServiceContent;
                  copyToClipboard(code, activeCodeTab);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f1e1c] hover:bg-[#2f2d29] text-xs font-mono text-[#d4b581] transition-all cursor-pointer shadow-lg border border-[#d4b581]/30"
              >
                {copiedSection === activeCodeTab ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedSection === activeCodeTab ? 'Скопировано в буфер' : 'Скопировать весь файл'}</span>
              </button>
            </div>

            <pre className="p-5 bg-[#090908] rounded-2xl text-xs font-mono text-[#e6e3df]/90 overflow-x-auto border border-[#e6e3df]/10 max-h-96 leading-relaxed">
              {activeCodeTab === 'docker' && dockerComposeContent}
              {activeCodeTab === 'python' && pythonAgentContent}
              {activeCodeTab === 'nginx' && nginxConfigContent}
              {activeCodeTab === 'systemd' && systemdServiceContent}
            </pre>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: LIVE TELEMETRY INGESTION TESTER */}
      {/* ========================================================================= */}
      <div className="p-6 md:p-8 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-3xl space-y-6">
        <div>
          <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Интерактивный тестер сбора телеметрии (Live Telemetry Simulator)</span>
          </h3>
          <p className="font-mono text-xs text-[#e6e3df]/50 mt-1">
            Отправьте тестовый пакет данных от имени узла и проверьте корректность сохранения на сервере
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
          {/* Controls Form */}
          <div className="p-5 rounded-2xl bg-[#141312] border border-[#e6e3df]/10 space-y-4">
            <h4 className="font-bold text-white text-sm font-sans flex items-center gap-2">
              <span>Параметры тестового пакета (Payload)</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#e6e3df]/60 mb-1 text-[11px]">Выбор узла</label>
                <select
                  value={testNodeId}
                  onChange={e => setTestNodeId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1b1a18] border border-[#e6e3df]/15 rounded-xl text-white outline-none cursor-pointer"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#e6e3df]/60 mb-1 text-[11px]">Активных стримов</label>
                <input
                  type="number"
                  value={testStreams}
                  onChange={e => setTestStreams(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#1b1a18] border border-[#e6e3df]/15 rounded-xl text-white outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-[#e6e3df]/70 mb-1">
                <span>Загрузка CPU: {testCpu}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="98"
                value={testCpu}
                onChange={e => setTestCpu(parseInt(e.target.value))}
                className="w-full accent-[#d4b581] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-[#e6e3df]/70 mb-1">
                <span>Загрузка RAM: {testRam}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="98"
                value={testRam}
                onChange={e => setTestRam(parseInt(e.target.value))}
                className="w-full accent-[#38bdf8] cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[#e6e3df]/60 mb-1 text-[11px]">Трафик (Gbps)</label>
              <input
                type="number"
                step="0.1"
                value={testBandwidth}
                onChange={e => setTestBandwidth(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[#1b1a18] border border-[#e6e3df]/15 rounded-xl text-white outline-none"
              />
            </div>

            <button
              onClick={handleSendTestTelemetry}
              disabled={isSendingTest}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#d4b581] hover:bg-[#e2c799] text-black font-bold font-sans text-xs rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(212,181,129,0.3)] disabled:opacity-50"
            >
              <Play className={`w-4 h-4 ${isSendingTest ? 'animate-spin' : ''}`} />
              <span>{isSendingTest ? 'Отправка пакета...' : 'Отправить Heartbeat на сервер'}</span>
            </button>
          </div>

          {/* Response Inspector */}
          <div className="p-5 rounded-2xl bg-[#090908] border border-[#e6e3df]/10 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#e6e3df]/10 mb-3">
                <span className="font-bold text-white font-sans text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#d4b581]" /> Ответ сервера Core API
                </span>
                {testResult && (
                  <span className="text-[10px] text-[#e6e3df]/40">{testResult.timestamp}</span>
                )}
              </div>

              {testResult ? (
                <pre className="p-3 bg-[#121110] rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto border border-emerald-500/20">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              ) : (
                <div className="text-center py-12 text-[#e6e3df]/30 font-sans text-xs">
                  Нажмите кнопку «Отправить Heartbeat на сервер» для проверки приёма данных.
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-[#141312] border border-[#e6e3df]/5 text-[11px] text-[#e6e3df]/60 font-sans">
              <span className="text-[#d4b581] font-bold">Примечание:</span> При получении телеметрии сервер Alex HD обновляет внутреннюю карту состояния узлов и пересчитывает веса для балансировщика HLS-потоков.
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: FIREWALL & PORTS CHECKLIST */}
      {/* ========================================================================= */}
      <div className="p-6 md:p-8 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-3xl space-y-6">
        <div>
          <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#d4b581]" />
            <span>Контрольный чек-лист портов, фаервола и безопасности</span>
          </h3>
          <p className="font-mono text-xs text-[#e6e3df]/50 mt-1">
            Убедитесь, что на серверах открыты все необходимые сетевые порты для P2P и Smart TV
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-4 rounded-2xl bg-[#141312] border border-[#e6e3df]/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">8090 / TCP</span>
              <span className="text-[10px] text-[#d4b581] bg-[#d4b581]/15 px-2 py-0.5 rounded">TORRSERVER API</span>
            </div>
            <p className="text-[#e6e3df]/60 font-sans text-xs">
              HTTP API управления торрентами и стриминг медиапотоков для плееров.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#141312] border border-[#e6e3df]/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">51413 / TCP+UDP</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded">P2P DHT & PEERS</span>
            </div>
            <p className="text-[#e6e3df]/60 font-sans text-xs">
              Входящие и исходящие P2P соединения BitTorrent. Обязателен для максимальной скорости сидов.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#141312] border border-[#e6e3df]/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">80, 443 / TCP</span>
              <span className="text-[10px] text-[#38bdf8] bg-[#38bdf8]/15 px-2 py-0.5 rounded">NGINX / SSL</span>
            </div>
            <p className="text-[#e6e3df]/60 font-sans text-xs">
              HLS кэширование, CORS заголовки и HTTPS сертификаты Let's Encrypt для Smart TV.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#141312] border border-[#e6e3df]/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">3000 / TCP</span>
              <span className="text-[10px] text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded">CORE BACKEND</span>
            </div>
            <p className="text-[#e6e3df]/60 font-sans text-xs">
              Центральный сервер аутентификации, биллинга, каталога и сбора телеметрии.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
