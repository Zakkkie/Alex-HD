import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Download, 
  Play, 
  Sparkles, 
  HardDrive, 
  Radio, 
  Zap, 
  CheckCircle2, 
  RefreshCw, 
  Volume2, 
  Server,
  Layers,
  Filter,
  Film
} from 'lucide-react';
import { api } from '../../api/client';
import { ContentItem } from '../../types';

interface ReleasesModalProps {
  content: ContentItem;
  season?: number;
  episode?: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectRelease: (source: any) => void;
}

export const ReleasesModal: React.FC<ReleasesModalProps> = ({
  content,
  season,
  episode,
  isOpen,
  onClose,
  onSelectRelease
}) => {
  const [sources, setSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterQuality, setFilterQuality] = useState<'all' | '4k' | '1080p' | '720p'>('all');
  const [preloadingHash, setPreloadingHash] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    api.getCatalogReleases(content.id, season, episode)
      .then(res => {
        if (isMounted) {
          setSources(res.sources || []);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch releases:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, content.id, season, episode]);

  if (!isOpen) return null;

  const filteredSources = sources.filter(s => {
    if (filterQuality === 'all') return true;
    return s.qualityLabel === filterQuality;
  });

  const handleStreamClick = async (source: any) => {
    setPreloadingHash(source.id);
    try {
      if (source.locator) {
        await api.preloadTorrServerTorrent(source.locator, `${content.title} ${source.qualityLabel}`);
      }
    } catch (e) {
      console.warn('TorrServer preload warning:', e);
    } finally {
      setPreloadingHash(null);
      onSelectRelease(source);
      onClose();
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#121110] border border-[#f5f3ef]/20 rounded-3xl shadow-2xl overflow-hidden text-[#e6e3df]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f3ef]/15 bg-[#181715]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#d4b581]/15 text-[#d4b581] rounded-xl border border-[#d4b581]/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-serif-display text-xl font-bold text-[#f5f3ef]">
                Торрент-раздачи и озвучки (Prowlarr / Radarr / Sonarr)
              </h2>
              <p className="text-xs text-[#f5f3ef]/70 mt-0.5">
                {content.title} {season !== undefined ? `• Сезон ${season} ${episode !== undefined ? `Серия ${episode}` : ''}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#f5f3ef]/10 rounded-full text-[#f5f3ef]/70 hover:text-[#f5f3ef] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quality Filter Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#151413] border-b border-[#f5f3ef]/10 text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#d4b581]" />
            <span className="text-[#f5f3ef]/60 uppercase tracking-wider font-semibold">Качество:</span>
            <div className="flex gap-1.5">
              {(['all', '4k', '1080p', '720p'] as const).map(q => (
                <button
                  key={q}
                  onClick={() => setFilterQuality(q)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs uppercase transition cursor-pointer ${
                    filterQuality === q
                      ? 'bg-[#d4b581] text-black shadow-md'
                      : 'bg-[#f5f3ef]/5 text-[#f5f3ef]/70 hover:bg-[#f5f3ef]/10'
                  }`}
                >
                  {q === 'all' ? 'Все' : q}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[#f5f3ef]/60 text-xs">
            Найдено источников: <span className="text-[#d4b581] font-bold">{filteredSources.length}</span>
          </div>
        </div>

        {/* Sources List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-4 text-[#f5f3ef]/70">
              <RefreshCw className="w-8 h-8 text-[#d4b581] animate-spin" />
              <p className="text-sm font-medium">Поиск торрент-раздач на трекерах через Prowlarr...</p>
            </div>
          ) : filteredSources.length === 0 ? (
            <div className="py-16 text-center text-[#f5f3ef]/60">
              <HardDrive className="w-12 h-12 mx-auto mb-3 text-[#d4b581]/50" />
              <p className="text-base font-semibold text-[#f5f3ef]">Раздачи по выбранному фильтру не найдены</p>
              <p className="text-xs mt-1">Попробуйте переключить фильтр качества на «Все»</p>
            </div>
          ) : (
            filteredSources.map((source, idx) => {
              const is4k = source.qualityLabel === '4k';
              const sizeGb = source.sizeBytes ? (source.sizeBytes / (1024 * 1024 * 1024)).toFixed(1) + ' ГБ' : '—';
              const isPreloading = preloadingHash === source.id;

              return (
                <div
                  key={source.id || idx}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-[#1b1a18] hover:bg-[#22211e] border border-[#f5f3ef]/10 hover:border-[#d4b581]/50 rounded-2xl transition duration-200 gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                        is4k ? 'bg-amber-400 text-black font-extrabold' : 'bg-[#d4b581]/20 text-[#d4b581] border border-[#d4b581]/40'
                      }`}>
                        {source.qualityLabel || '1080p'}
                      </span>
                      {source.hdr && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded text-xs font-semibold">
                          HDR10+ / DV
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-[#f5f3ef]/10 text-[#f5f3ef]/80 rounded text-xs font-mono">
                        {source.codec?.toUpperCase() || 'HEVC'}
                      </span>
                      <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3" /> {source.seeds || 1} сидов
                      </span>
                      <span className="text-[#f5f3ef]/60 text-xs font-mono">
                        Размер: {sizeGb}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-[#f5f3ef] truncate">
                      {source.indexerName || 'Prowlarr Tracker Source'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStreamClick(source)}
                    disabled={isPreloading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#d4b581] hover:bg-[#e5c999] text-black font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shrink-0 shadow-md hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {isPreloading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Буферизация...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-black" />
                        Смотреть через TorrServer
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#151413] border-t border-[#f5f3ef]/15 flex items-center justify-between text-xs text-[#f5f3ef]/60">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#d4b581]" />
            <span>Прямое кэширование и стриминг в ОЗУ через TorrServer Matrix</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#f5f3ef]/10 hover:bg-[#f5f3ef]/20 text-[#f5f3ef] rounded-lg transition cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
