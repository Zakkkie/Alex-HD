import React, { useState } from 'react';
import { X, Server, Globe, Cpu, HardDrive, ShieldCheck, Zap, Plus, Check } from 'lucide-react';
import { ServerNode } from '../../types';
import { adminStore } from '../../data/adminStore';
import { api } from '../../api/client';

interface AddNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNodeAdded: (node: ServerNode) => void;
}

export const AddNodeModal: React.FC<AddNodeModalProps> = ({ isOpen, onClose, onNodeAdded }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<ServerNode['type']>('torrserver');
  const [ip, setIp] = useState('');
  const [location, setLocation] = useState('');
  const [countryCode, setCountryCode] = useState('RU');
  const [version, setVersion] = useState('TorrServer MatriX.134');
  const [bandwidthGbps, setBandwidthGbps] = useState<number>(2.5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secretKey] = useState(() => `sec_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ip) {
      alert('Пожалуйста, укажите имя узла и IP/хост');
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedId = `node-${Date.now().toString(36)}`;
      const newNode: Partial<ServerNode> = {
        id: generatedId,
        name,
        type,
        ip,
        location: location || 'Локальный дата-центр',
        countryCode: countryCode || 'RU',
        status: 'online',
        cpuUsage: 12,
        ramUsage: 22,
        diskUsage: 28,
        bandwidthGbps: Number(bandwidthGbps) || 2.5,
        activeStreams: 0,
        pingMs: 15,
        uptimeHours: 0,
        errorCount24h: 0,
        version: version || 'TorrServer MatriX.134',
        lastHealthCheck: 'Только что'
      };

      // Register via API and store
      await api.registerNode({
        nodeId: generatedId,
        hostname: ip,
        region: location,
        bandwidthMbps: (Number(bandwidthGbps) || 2.5) * 1000,
        maxCapacity: 100
      });

      const added = adminStore.addNode(newNode);
      onNodeAdded(added);
      onClose();
    } catch (err: any) {
      alert(`Ошибка добавления узла: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-[#121110] border border-[#e6e3df]/15 rounded-3xl w-full max-w-xl p-6 md:p-8 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-[#1c1b18] hover:bg-[#2a2825] text-[#e6e3df]/60 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#d4b581]/15 border border-[#d4b581]/30 flex items-center justify-center text-[#d4b581]">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-white">Подключить серверный узел</h3>
            <p className="font-mono text-xs text-[#e6e3df]/50">
              Регистрация TorrServer, Edge CDN прокси или GPU транскодера
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[#e6e3df]/70 mb-1.5 font-sans font-medium text-xs">
              Название узла / Кластера *
            </label>
            <input
              type="text"
              required
              placeholder="например, TorrServer Edge MOW-04 (NVMe)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white placeholder-[#e6e3df]/30 outline-none focus:border-[#d4b581] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#e6e3df]/70 mb-1.5 font-sans font-medium text-xs">
                Тип роли узла *
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white outline-none focus:border-[#d4b581] transition-all cursor-pointer"
              >
                <option value="torrserver">TorrServer MatriX (P2P Стриминг)</option>
                <option value="edge_cdn">Edge CDN HLS Кэш (Nginx / Varnish)</option>
                <option value="transcoder">FFmpeg GPU Транскодер (4K HEVC)</option>
                <option value="balancer">Балансировщик Least-Loaded</option>
              </select>
            </div>

            <div>
              <label className="block text-[#e6e3df]/70 mb-1.5 font-sans font-medium text-xs">
                IP адрес или Домен с портом *
              </label>
              <input
                type="text"
                required
                placeholder="194.87.142.15:8090"
                value={ip}
                onChange={e => setIp(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white placeholder-[#e6e3df]/30 outline-none focus:border-[#d4b581] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#e6e3df]/70 mb-1.5 font-sans font-medium text-xs">
                Локация (Город, Страна)
              </label>
              <input
                type="text"
                placeholder="Москва, Россия"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white placeholder-[#e6e3df]/30 outline-none focus:border-[#d4b581] transition-all"
              />
            </div>

            <div>
              <label className="block text-[#e6e3df]/70 mb-1.5 font-sans font-medium text-xs">
                Пропускная способность канала (Gbps)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="100"
                value={bandwidthGbps}
                onChange={e => setBandwidthGbps(parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white outline-none focus:border-[#d4b581] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#e6e3df]/70 mb-1.5 font-sans font-medium text-xs">
              Версия демона / ПО
            </label>
            <input
              type="text"
              placeholder="TorrServer MatriX.134"
              value={version}
              onChange={e => setVersion(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white placeholder-[#e6e3df]/30 outline-none focus:border-[#d4b581] transition-all"
            />
          </div>

          {/* Secret Token Information */}
          <div className="p-4 rounded-2xl bg-[#0a0a09] border border-[#d4b581]/25 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#d4b581] font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> X-Node-Secret (Ключ аутентификации телеметрии)
              </span>
              <span className="text-[10px] text-[#e6e3df]/40">Сгенерирован автоматически</span>
            </div>
            <code className="block p-2 bg-[#171615] rounded-lg text-emerald-400 font-mono text-[11px] break-all border border-[#e6e3df]/10">
              {secretKey}
            </code>
            <p className="text-[10px] text-[#e6e3df]/50">
              Передайте этот ключ в заголовке <span className="text-white font-mono">X-Node-Secret</span> при отправке телеметрии с демона.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e6e3df]/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#171615] hover:bg-[#252422] text-[#e6e3df] text-xs font-sans transition-all cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#d4b581] hover:bg-[#e2c799] text-black font-bold text-xs font-sans transition-all cursor-pointer shadow-[0_0_15px_rgba(212,181,129,0.3)] disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Регистрация...' : 'Зарегистрировать узел'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
