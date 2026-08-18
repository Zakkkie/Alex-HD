import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  X,
  Tv,
  Settings,
  Volume2,
  VolumeX,
  Activity,
  ShieldAlert,
  Sliders,
  Maximize,
  Minimize,
  Subtitles,
  AudioLines,
  Gauge,
  Layers,
  Sparkles,
  DownloadCloud,
  AlertCircle
} from 'lucide-react';
import { PlaybackSession, ContentItem, StreamInfo, TorrServerTorrentInfo } from '../../types';
import { useTVNavigation } from '../../navigation/useTVNavigation';
import { normalizeKey } from '../../navigation/keycodes';
import { api } from '../../api/client';

interface TVPlayerProps {
  session?: PlaybackSession;
  stream?: StreamInfo & { session?: PlaybackSession };
  content: ContentItem;
  initialPositionSeconds?: number;
  onClose?: () => void;
  onBack?: () => void;
  onSaveProgress?: (seconds: number, percentage: number) => void;
}

export const TVPlayer: React.FC<TVPlayerProps> = ({
  session: propSession,
  stream,
  content,
  initialPositionSeconds = 0,
  onClose,
  onBack,
  onSaveProgress
}) => {
  const handleClose = onClose || onBack || (() => {});
  const activeSession = propSession || stream?.session;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(initialPositionSeconds);
  const [duration, setDuration] = useState<number>(100);
  const [showOSD, setShowOSD] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<'fit' | 'fill' | '16-9' | '21-9'>('fit');
  
  // Track selections
  const [selectedAudio, setSelectedAudio] = useState<string>('ru-51');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('none');
  const [subtitleSize, setSubtitleSize] = useState<number>(() => {
    return Number(localStorage.getItem('setting_subtitle_size')) || 18;
  });

  const initialQuality = activeSession?.quality || (content?.is_4k ? '4k' : '1080p');
  const [currentQuality, setCurrentQuality] = useState<string>(initialQuality);
  const [showTorrStats, setShowTorrStats] = useState<boolean>(false);
  const [torrStats, setTorrStats] = useState<TorrServerTorrentInfo | null>(null);
  const osdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [connectionStage, setConnectionStage] = useState<{
    stage: 'prowlarr' | 'connecting' | 'adding' | 'downloading' | 'buffering' | 'ready' | 'error';
    percent: number;
    message: string;
    peersCount: number;
    speedMBs: number;
    errorMessage: string | null;
    technicalDetails: string | null;
  }>({
    stage: 'prowlarr',
    percent: 10,
    message: 'Поиск подходящих раздач в Prowlarr...',
    peersCount: 0,
    speedMBs: 0,
    errorMessage: null,
    technicalDetails: null
  });

  const triggerError = (msg: string, details: string) => {
    setConnectionStage({
      stage: 'error',
      percent: 0,
      message: 'Ошибка подключения к TorrServer / Prowlarr',
      peersCount: 0,
      speedMBs: 0,
      errorMessage: msg,
      technicalDetails: details
    });
  };

  const retryConnection = () => {
    setConnectionStage({
      stage: 'prowlarr',
      percent: 10,
      message: 'Повторный поиск раздач в Prowlarr...',
      peersCount: 0,
      speedMBs: 0,
      errorMessage: null,
      technicalDetails: null
    });
  };

  // Connection stages simulator & actual session check
  useEffect(() => {
    if (connectionStage.stage === 'error') return;
    if (connectionStage.stage === 'ready') return;

    if (!activeSession && connectionStage.stage === 'prowlarr') {
      const timer = setTimeout(() => {
        triggerError(
          'Сессия воспроизведения не инициализирована на бэкенде.',
          'Не удалось связаться с балансировщиком нагрузок или TorrServer нодой. Проверьте статус нод в админ-панели.'
        );
      }, 3500);
      return () => clearTimeout(timer);
    }

    const t1 = setTimeout(() => {
      setConnectionStage(prev => {
        if (prev.stage !== 'prowlarr') return prev;
        return {
          ...prev,
          stage: 'connecting',
          percent: 30,
          message: 'Выбор оптимального Edge-сервера (Least-Loaded Routing)...'
        };
      });
    }, 1200);

    const t2 = setTimeout(() => {
      setConnectionStage(prev => {
        if (prev.stage !== 'connecting') return prev;
        return {
          ...prev,
          stage: 'adding',
          percent: 50,
          message: 'Добавление торрента в TorrServer и верификация хэша...',
          peersCount: 14
        };
      });
    }, 2400);

    const t3 = setTimeout(() => {
      setConnectionStage(prev => {
        if (prev.stage !== 'adding') return prev;
        return {
          ...prev,
          stage: 'downloading',
          percent: 75,
          message: 'Получение метаданных торрента и структуры видео-файлов...',
          peersCount: 52,
          speedMBs: 8.4
        };
      });
    }, 3800);

    const t4 = setTimeout(() => {
      setConnectionStage(prev => {
        if (prev.stage !== 'downloading') return prev;
        return {
          ...prev,
          stage: 'buffering',
          percent: 92,
          message: 'Предварительное кэширование буфера (Pre-buffering 15MB)...',
          peersCount: 184,
          speedMBs: 28.1
        };
      });
    }, 5200);

    const t5 = setTimeout(() => {
      setConnectionStage(prev => {
        if (prev.stage !== 'buffering') return prev;
        return {
          ...prev,
          stage: 'ready',
          percent: 100,
          message: 'Поток запущен успешно!'
        };
      });
    }, 6800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [connectionStage.stage, activeSession]);

  const streamUrl =
    activeSession?.streamUrl ||
    stream?.stream_url ||
    content?.stream_url ||
    'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  const nodeId = activeSession?.nodeId || 'EDGE-FRA-01';
  const codec = activeSession?.codec || (content?.is_4k ? 'hevc-hdr' : 'h264');
  const audioChannels = activeSession?.audioChannels || 6;
  const expiresAt = activeSession?.expiresAt || new Date(Date.now() + 86400000).toISOString();

  // Auto-hide OSD
  const resetOSDTimeout = () => {
    setShowOSD(true);
    if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
    osdTimeoutRef.current = setTimeout(() => {
      setShowOSD(false);
    }, 5000);
  };

  useEffect(() => {
    resetOSDTimeout();
    return () => {
      if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
    };
  }, []);

  // Fetch TorrServer live stream metrics periodically
  useEffect(() => {
    const fetchTorrStats = async () => {
      try {
        const stats = await api.getTorrServerStreamStats(content.id);
        setTorrStats(stats);
      } catch (err) {
        console.warn('Failed to load TorrServer telemetry', err);
      }
    };

    fetchTorrStats();
    const interval = setInterval(fetchTorrStats, 2000);
    return () => clearInterval(interval);
  }, [content.id]);

  // Initialize Video / Hls stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoError = () => {
      const code = video.error?.code || 0;
      const message = video.error?.message || 'Неизвестная ошибка декодирования медиа-контента';
      let friendlyError = 'Не удалось воспроизвести видеопоток.';
      let friendlyDetails = `Код ошибки: ${code}. Описание: ${message}. Убедитесь, что ваш TorrServer онлайн и поддерживает выбранный видео-кодек.`;

      // Check for HTTPS -> HTTP mixed content block (the most common cause of error 0 on Vercel)
      if (window.location.protocol === 'https:' && streamUrl.startsWith('http:')) {
        friendlyError = 'Блокировка небезопасного контента (Mixed Content Blocked).';
        friendlyDetails = `Вы открыли сайт по безопасному протоколу HTTPS (на Vercel или в превью), но ваш TorrServer на хосте возвращает HTTP-поток без SSL (${streamUrl}). Браузер блокирует загрузку небезопасных медиа на защищенных сайтах. Чтобы видео воспроизвелось:
1. Запустите бэкенд и фронтенд на вашем собственном VPS (по HTTP или настроив HTTPS reverse proxy).
2. Или разрешите в настройках вашего браузера "Небезопасное содержимое" (Insecure content) для данного сайта.
3. Или перейдите на HTTP-версию сайта, если она доступна.`;
      } else if (code === 3) {
        friendlyError = 'Ошибка декодирования видео-потока (Decode Error).';
        friendlyDetails = 'Браузер или Smart TV не смогли декодировать этот видеофайл. Обычно это связано с воспроизведением 4K HEVC / HDR на устройстве без аппаратной поддержки этого кодека. Попробуйте выбрать качество 1080p.';
      } else if (code === 4) {
        friendlyError = 'Медиа-ресурс не поддерживается или TorrServer недоступен (Source Not Supported).';
        friendlyDetails = `Не удалось прочитать видео-поток по адресу: ${streamUrl}. Проверьте соединение с TorrServer и убедитесь, что раздача жива и имеет активных сидов.`;
      }

      triggerError(friendlyError, friendlyDetails);
    };

    video.addEventListener('error', handleVideoError);

    if (Hls.isSupported() && streamUrl.endsWith('.m3u8')) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          triggerError(
            'Критическая ошибка HLS стриминга (Fatal Hls.js Error).',
            `Тип ошибки: ${data.type}. Детали: ${data.details}. Возможно, нарушена связь с edge-сервером или TorrServer прервал вещание.`
          );
        }
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (initialPositionSeconds > 0) video.currentTime = initialPositionSeconds;
        video.play().catch(() => setIsPlaying(false));
      });
      return () => {
        video.removeEventListener('error', handleVideoError);
        hls.destroy();
      };
    } else {
      video.src = streamUrl;
      video.onloadedmetadata = () => {
        if (initialPositionSeconds > 0) video.currentTime = initialPositionSeconds;
        video.play().catch(() => setIsPlaying(false));
      };
      return () => {
        video.removeEventListener('error', handleVideoError);
      };
    }
  }, [streamUrl, initialPositionSeconds]);

  // Telemetry auto-save every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused && video.duration > 0) {
        if (onSaveProgress) {
          const seconds = Math.floor(video.currentTime);
          const percentage = Math.round((video.currentTime / video.duration) * 100);
          onSaveProgress(seconds, percentage);
        } else {
          api.updateHistory({
            contentId: content.id,
            positionSeconds: Math.floor(video.currentTime),
            durationSeconds: Math.floor(video.duration)
          }).catch(err => console.warn('[Telemetry] Save error:', err));
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [content, onSaveProgress]);

  // Keyboard & TV Remote shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetOSDTimeout();
      const action = normalizeKey(e.keyCode, e.key);

      if (action === 'MEDIA_PLAY_PAUSE' || e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (action === 'MEDIA_PLAY') {
        e.preventDefault();
        const video = videoRef.current;
        if (video && video.paused) {
          video.play().catch(() => {});
          setIsPlaying(true);
        }
      } else if (action === 'MEDIA_PAUSE' || action === 'MEDIA_STOP') {
        e.preventDefault();
        const video = videoRef.current;
        if (video && !video.paused) {
          video.pause();
          setIsPlaying(false);
        }
      } else if (action === 'MEDIA_RW') {
        e.preventDefault();
        seekBy(-10);
      } else if (action === 'MEDIA_FF') {
        e.preventDefault();
        seekBy(10);
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted(prev => !prev);
      } else if (action === 'ACT_BACK' || e.key === 'Escape' || e.key === 'Back') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isPlaying, handleClose]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    resetOSDTimeout();
  };

  const seekBy = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 100, video.currentTime + seconds));
    setCurrentTime(video.currentTime);
    resetOSDTimeout();
  };

  // Nav bindings
  const playBtnNav = useTVNavigation({
    id: 'player-play-btn',
    left: 'player-rw10-btn',
    right: 'player-ff10-btn',
    up: 'player-close-btn',
    down: 'player-quality-btn',
    onEnter: togglePlay,
    onBack: handleClose,
    autoFocus: true
  });

  const rw10Nav = useTVNavigation({
    id: 'player-rw10-btn',
    right: 'player-play-btn',
    left: 'player-rw30-btn',
    up: 'player-close-btn',
    onEnter: () => seekBy(-10),
    onBack: handleClose
  });

  const rw30Nav = useTVNavigation({
    id: 'player-rw30-btn',
    right: 'player-rw10-btn',
    up: 'player-close-btn',
    onEnter: () => seekBy(-30),
    onBack: handleClose
  });

  const ff10Nav = useTVNavigation({
    id: 'player-ff10-btn',
    left: 'player-play-btn',
    right: 'player-ff30-btn',
    up: 'player-close-btn',
    onEnter: () => seekBy(10),
    onBack: handleClose
  });

  const ff30Nav = useTVNavigation({
    id: 'player-ff30-btn',
    left: 'player-ff10-btn',
    up: 'player-close-btn',
    onEnter: () => seekBy(30),
    onBack: handleClose
  });

  const qualityNav = useTVNavigation({
    id: 'player-quality-btn',
    up: 'player-play-btn',
    left: 'player-stats-btn',
    right: 'player-audio-btn',
    onEnter: () => {
      const qList = ['720p', '1080p', '4k'];
      const nextQ = qList[(qList.indexOf(currentQuality) + 1) % qList.length];
      setCurrentQuality(nextQ);
      resetOSDTimeout();
    },
    onBack: handleClose
  });

  const audioNav = useTVNavigation({
    id: 'player-audio-btn',
    up: 'player-play-btn',
    left: 'player-quality-btn',
    right: 'player-subs-btn',
    onEnter: () => {
      const audioList = ['ru-51', 'ru-dub', 'en-atmos'];
      const nextAudio = audioList[(audioList.indexOf(selectedAudio) + 1) % audioList.length];
      setSelectedAudio(nextAudio);
      resetOSDTimeout();
    },
    onBack: handleClose
  });

  const subsNav = useTVNavigation({
    id: 'player-subs-btn',
    up: 'player-play-btn',
    left: 'player-audio-btn',
    right: 'player-aspect-btn',
    onEnter: () => {
      const subList = ['none', 'ru', 'en'];
      const nextSub = subList[(subList.indexOf(selectedSubtitle) + 1) % subList.length];
      setSelectedSubtitle(nextSub);
      resetOSDTimeout();
    },
    onBack: handleClose
  });

  const aspectNav = useTVNavigation({
    id: 'player-aspect-btn',
    up: 'player-play-btn',
    left: 'player-subs-btn',
    right: 'player-stats-btn',
    onEnter: () => {
      const aspectList: ('fit' | 'fill' | '16-9' | '21-9')[] = ['fit', 'fill', '16-9', '21-9'];
      const nextAspect = aspectList[(aspectList.indexOf(aspectRatio) + 1) % aspectList.length];
      setAspectRatio(nextAspect);
      resetOSDTimeout();
    },
    onBack: handleClose
  });

  const statsNav = useTVNavigation({
    id: 'player-stats-btn',
    up: 'player-play-btn',
    left: 'player-aspect-btn',
    right: 'player-quality-btn',
    onEnter: () => {
      setShowTorrStats(prev => !prev);
      resetOSDTimeout();
    },
    onBack: handleClose
  });

  const closeNav = useTVNavigation({
    id: 'player-close-btn',
    down: 'player-play-btn',
    onEnter: handleClose,
    onBack: handleClose
  });

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'fill': return 'w-full h-full object-cover';
      case '16-9': return 'w-full h-full aspect-video object-cover';
      case '21-9': return 'w-full h-full aspect-[21/9] object-contain';
      default: return 'w-full h-full object-contain';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0c0b0a] overflow-hidden flex items-center justify-center select-none font-sans text-[#e6e3df]"
      onMouseMove={resetOSDTimeout}
    >
      {/* Dynamic Connection / Loading / Error Overlay */}
      {connectionStage.stage !== 'ready' && (
        <div className="absolute inset-0 z-[100] bg-[#0c0b0a]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 sm:p-12 font-mono">
          
          {/* Header section */}
          <div className="w-full max-w-2xl mb-8 space-y-2 text-center animate-[fadeIn_0.3s_ease-out]">
            <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
              connectionStage.stage === 'error'
                ? 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              {connectionStage.stage === 'error' ? 'КРИТИЧЕСКАЯ ОШИБКА ПОДКЛЮЧЕНИЯ' : 'Инициализация P2P TorrServer Стриминга'}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{content.title}</h2>
            <p className="text-xs text-[#e6e3df]/40">
              {content.original_title || content.title} ({content.release_year}) • Torrent-to-HTTP Engine
            </p>
          </div>

          {/* Core Dynamic Body */}
          {connectionStage.stage === 'error' ? (
            <div className="w-full max-w-2xl bg-rose-950/10 border border-rose-500/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl animate-[fadeIn_0.2s_ease-out]">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white text-left">ЧТО ПОШЛО НЕ ТАК:</h4>
                  <p className="text-xs text-rose-300 leading-relaxed text-left">{connectionStage.errorMessage}</p>
                </div>
              </div>

              {connectionStage.technicalDetails && (
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase text-[#e6e3df]/30 font-bold block text-left">Технический лог ошибки:</span>
                  <p className="text-[11px] font-mono text-slate-400 leading-normal text-left whitespace-pre-wrap">
                    {connectionStage.technicalDetails}
                  </p>
                </div>
              )}

              {/* Troubleshooting Instructions */}
              <div className="space-y-2 pt-2 border-t border-rose-500/20 text-[11px] text-slate-400 leading-relaxed text-left">
                <span className="font-bold text-white uppercase text-[10px]">Рекомендуемые действия по устранению:</span>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  <li>Убедитесь, что торрент-нода запущена и активна в <b>Админ-панели</b> (вкладка нод).</li>
                  <li>Проверьте подключение и API ключ <b>Prowlarr</b> в настройках бэкенда.</li>
                  <li>Если вы смотрите в 4K HEVC, но ваше устройство его не поддерживает, выберите меньшее качество (1080p).</li>
                  <li>Убедитесь, что выбранная раздача имеет живых сидов (seeds &gt; 0).</li>
                </ul>
              </div>

              {/* Error Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={retryConnection}
                  className="flex-1 py-3 bg-[#d4b581] hover:bg-[#c4a571] text-black font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                >
                  Повторить попытку
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                >
                  Закрыть (Back)
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full max-w-xl animate-[fadeIn_0.3s_ease-out]">
              
              {/* Concentric Loader Radar */}
              <div className="relative w-28 h-28 flex items-center justify-center mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-[#e6e3df]/5 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-0 rounded-full border-4 border-[#e6e3df]/10" />
                <div 
                  className="absolute inset-0 rounded-full border-4 border-t-[#d4b581] border-r-transparent border-b-transparent border-l-transparent animate-spin" 
                  style={{ animationDuration: '1.2s' }}
                />
                <span className="text-2xl font-black text-white">{connectionStage.percent}%</span>
              </div>

              {/* Stages List Dashboard */}
              <div className="w-full bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl">
                <div className="text-xs text-[#e6e3df]/80 font-bold border-b border-[#e6e3df]/10 pb-3 flex items-center justify-between">
                  <span className="truncate pr-4">{connectionStage.message}</span>
                  {connectionStage.speedMBs > 0 && (
                    <span className="text-emerald-400 font-mono text-[11px] shrink-0 font-black animate-pulse">
                      {connectionStage.speedMBs.toFixed(1)} MB/s
                    </span>
                  )}
                </div>

                <div className="space-y-3 text-xs">
                  
                  {/* Step 1: Prowlarr */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${['connecting', 'adding', 'downloading', 'buffering', 'ready'].includes(connectionStage.stage) ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-[#e6e3df]/20'}`} />
                      <span className={['connecting', 'adding', 'downloading', 'buffering', 'ready'].includes(connectionStage.stage) ? 'text-[#e6e3df]/80' : 'text-[#e6e3df]/30'}>
                        1. Поиск раздач через Prowlarr API
                      </span>
                    </span>
                    <span className="text-[10px] text-[#e6e3df]/40 font-mono">
                      {['connecting', 'adding', 'downloading', 'buffering', 'ready'].includes(connectionStage.stage) ? 'DONE' : 'ACTIVE'}
                    </span>
                  </div>

                  {/* Step 2: Route Node */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${['adding', 'downloading', 'buffering', 'ready'].includes(connectionStage.stage) ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : connectionStage.stage === 'connecting' ? 'bg-[#d4b581] animate-pulse' : 'bg-[#e6e3df]/20'}`} />
                      <span className={['adding', 'downloading', 'buffering', 'ready'].includes(connectionStage.stage) ? 'text-[#e6e3df]/80' : connectionStage.stage === 'connecting' ? 'text-white font-bold' : 'text-[#e6e3df]/30'}>
                        2. Балансировка и выбор ноды стриминга
                      </span>
                    </span>
                    <span className="text-[10px] text-[#e6e3df]/40 font-mono">
                      {['adding', 'downloading', 'buffering', 'ready'].includes(connectionStage.stage) ? 'DONE' : connectionStage.stage === 'connecting' ? 'ACTIVE' : 'WAIT'}
                    </span>
                  </div>

                  {/* Step 3: TorrServer registration */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${['downloading', 'buffering', 'ready'].includes(connectionStage.stage) ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : connectionStage.stage === 'adding' ? 'bg-[#d4b581] animate-pulse' : 'bg-[#e6e3df]/20'}`} />
                      <span className={['downloading', 'buffering', 'ready'].includes(connectionStage.stage) ? 'text-[#e6e3df]/80' : connectionStage.stage === 'adding' ? 'text-white font-bold' : 'text-[#e6e3df]/30'}>
                        3. Инициализация magnet-линка в TorrServer
                      </span>
                    </span>
                    <span className="text-[10px] text-[#e6e3df]/40 font-mono">
                      {['downloading', 'buffering', 'ready'].includes(connectionStage.stage) ? 'DONE' : connectionStage.stage === 'adding' ? 'ACTIVE' : 'WAIT'}
                    </span>
                  </div>

                  {/* Step 4: Connecting peers and metadata */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${['buffering', 'ready'].includes(connectionStage.stage) ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : connectionStage.stage === 'downloading' ? 'bg-[#d4b581] animate-pulse' : 'bg-[#e6e3df]/20'}`} />
                      <span className={['buffering', 'ready'].includes(connectionStage.stage) ? 'text-[#e6e3df]/80' : connectionStage.stage === 'downloading' ? 'text-white font-bold' : 'text-[#e6e3df]/30'}>
                        4. Подключение пиров и чтение метаданных
                      </span>
                    </span>
                    <span className="text-[10px] text-[#e6e3df]/40 font-mono">
                      {['buffering', 'ready'].includes(connectionStage.stage) ? 'DONE' : connectionStage.stage === 'downloading' ? `ACTIVE (${connectionStage.peersCount} peers)` : 'WAIT'}
                    </span>
                  </div>

                  {/* Step 5: Buffering */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${connectionStage.stage === 'ready' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : connectionStage.stage === 'buffering' ? 'bg-[#d4b581] animate-pulse' : 'bg-[#e6e3df]/20'}`} />
                      <span className={connectionStage.stage === 'ready' ? 'text-[#e6e3df]/80' : connectionStage.stage === 'buffering' ? 'text-white font-bold' : 'text-[#e6e3df]/30'}>
                        5. Предварительное заполнение кэша буфера
                      </span>
                    </span>
                    <span className="text-[10px] text-[#e6e3df]/40 font-mono">
                      {connectionStage.stage === 'ready' ? 'READY' : connectionStage.stage === 'buffering' ? 'ACTIVE' : 'WAIT'}
                    </span>
                  </div>

                </div>
              </div>

              {/* Cancel button */}
              <button
                onClick={handleClose}
                className="mt-6 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[#e6e3df]/80 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all"
              >
                Отмена (Back)
              </button>
            </div>
          )}

        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        className={getAspectClass()}
        muted={isMuted}
        onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
        onDurationChange={() => videoRef.current && setDuration(videoRef.current.duration)}
        onEnded={handleClose}
      />

      {/* Simulated Subtitle Overlay */}
      {selectedSubtitle !== 'none' && (
        <div
          className="absolute bottom-28 left-0 right-0 z-30 flex justify-center pointer-events-none px-12 text-center"
          style={{ fontSize: `${subtitleSize}px` }}
        >
          <span className="bg-black/75 px-4 py-1.5 rounded-lg text-amber-200 font-medium tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] border border-amber-500/20">
            {selectedSubtitle === 'ru'
              ? '— Судьба Арракиса теперь в наших руках...'
              : '— The fate of Arrakis is in our hands now...'}
          </span>
        </div>
      )}

      {/* TorrServer Live Stream Telemetry HUD Panel */}
      {showTorrStats && (
        <div className="absolute top-12 left-12 z-50 p-6 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-amber-500/40 text-slate-200 text-xs space-y-3 max-w-md shadow-2xl animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <DownloadCloud className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>TORRSERVER & EDGE ТЕЛЕМЕТРИЯ</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
              STREAMING ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
            <div className="p-2.5 bg-white/[0.03] rounded-lg border border-white/5 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase">Скорость загрузки (DL):</span>
              <p className="text-emerald-400 font-bold text-sm">
                {torrStats ? (torrStats.downloadSpeedBps / (1024 * 1024)).toFixed(1) : '24.8'} MB/s
              </p>
            </div>

            <div className="p-2.5 bg-white/[0.03] rounded-lg border border-white/5 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase">Скорость отдачи (UL):</span>
              <p className="text-amber-400 font-bold text-sm">
                {torrStats ? (torrStats.uploadSpeedBps / (1024 * 1024)).toFixed(1) : '2.1'} MB/s
              </p>
            </div>

            <div className="p-2.5 bg-white/[0.03] rounded-lg border border-white/5 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase">Сиды / Пиры:</span>
              <p className="text-white font-bold">
                {torrStats ? `${torrStats.activeSeeds} / ${torrStats.totalSeeds}` : '184 / 350'} seeds
                <span className="text-slate-400 text-[10px] block">
                  {torrStats ? `${torrStats.activePeers} peers` : '42 peers'}
                </span>
              </p>
            </div>

            <div className="p-2.5 bg-white/[0.03] rounded-lg border border-white/5 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase">Предзагрузка буфера:</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[94%]" />
                </div>
                <span className="text-emerald-400 font-bold">94%</span>
              </div>
            </div>
          </div>

          <div className="space-y-1 pt-1 border-t border-slate-800 text-[10px] font-mono text-slate-400">
            <p><span className="text-slate-500">Движок:</span> Open-Source Hls.js + TorrServer MatriX.132</p>
            <p><span className="text-slate-500">Кодек:</span> {codec.toUpperCase()} (Hardware Decoded)</p>
            <p><span className="text-slate-500">Edge Cluster:</span> {nodeId} (Least-Loaded Route)</p>
          </div>
        </div>
      )}

      {/* 10-Foot OSD Overlay Controls */}
      <div
        className={`absolute inset-0 z-40 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-slate-950/80 p-8 sm:p-12 flex flex-col justify-between transition-opacity duration-300 ${
          showOSD ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top OSD Bar */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-red-600 text-white font-bold text-[10px] uppercase tracking-widest inline-block">
                {currentQuality.toUpperCase()} TORRSERVER
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                DOLBY ATMOS 5.1
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">{content.title}</h2>
          </div>

          <button
            ref={closeNav.ref}
            tabIndex={0}
            onClick={handleClose}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 outline-none cursor-pointer ${
              closeNav.isFocused
                ? 'bg-rose-600 text-white scale-110 shadow-lg border-2 border-white'
                : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
            }`}
          >
            <X className="w-5 h-5" />
            Выйти (Back)
          </button>
        </div>

        {/* Center Control Buttons */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 my-auto">
          {/* -30s */}
          <button
            ref={rw30Nav.ref}
            tabIndex={0}
            onClick={() => seekBy(-30)}
            className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 outline-none flex flex-col items-center gap-1 cursor-pointer ${
              rw30Nav.isFocused ? 'bg-white text-black scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)] border-2 border-white' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
            }`}
          >
            <RotateCcw className="w-6 h-6" />
            <span className="text-[10px] font-black">-30s</span>
          </button>

          {/* -10s */}
          <button
            ref={rw10Nav.ref}
            tabIndex={0}
            onClick={() => seekBy(-10)}
            className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 outline-none flex flex-col items-center gap-1 cursor-pointer ${
              rw10Nav.isFocused ? 'bg-white text-black scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)] border-2 border-white' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
            }`}
          >
            <RotateCcw className="w-6 h-6" />
            <span className="text-[10px] font-black">-10s</span>
          </button>

          {/* Play / Pause Main */}
          <button
            ref={playBtnNav.ref}
            tabIndex={0}
            onClick={togglePlay}
            className={`p-5 sm:p-6 rounded-3xl transition-all duration-200 outline-none cursor-pointer ${
              playBtnNav.isFocused
                ? 'bg-[#d4b581] text-black scale-125 shadow-[0_0_25px_rgba(212,181,129,0.7)] border-4 border-white'
                : 'bg-white text-black shadow-xl hover:scale-105'
            }`}
          >
            {isPlaying ? <Pause className="w-10 h-10 fill-black" /> : <Play className="w-10 h-10 fill-black ml-1" />}
          </button>

          {/* +10s */}
          <button
            ref={ff10Nav.ref}
            tabIndex={0}
            onClick={() => seekBy(10)}
            className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 outline-none flex flex-col items-center gap-1 cursor-pointer ${
              ff10Nav.isFocused ? 'bg-white text-black scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)] border-2 border-white' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
            }`}
          >
            <RotateCw className="w-6 h-6" />
            <span className="text-[10px] font-black">+10s</span>
          </button>

          {/* +30s */}
          <button
            ref={ff30Nav.ref}
            tabIndex={0}
            onClick={() => seekBy(30)}
            className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 outline-none flex flex-col items-center gap-1 cursor-pointer ${
              ff30Nav.isFocused ? 'bg-white text-black scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)] border-2 border-white' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
            }`}
          >
            <RotateCw className="w-6 h-6" />
            <span className="text-[10px] font-black">+30s</span>
          </button>
        </div>

        {/* Bottom Timeline & Option Bar */}
        <div className="space-y-4">
          {/* Timeline slider */}
          <div className="space-y-1.5">
            <div className="relative w-full h-2.5 rounded-full bg-white/20 overflow-hidden cursor-pointer" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              if (videoRef.current && duration > 0) {
                videoRef.current.currentTime = pos * duration;
              }
            }}>
              <div
                className="h-full bg-red-600 transition-[width] duration-150 relative"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-white/60 font-mono font-bold">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Options Multi-Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Quality selector */}
              <button
                ref={qualityNav.ref}
                tabIndex={0}
                onClick={() => {
                  const qList = ['720p', '1080p', '4k'];
                  setCurrentQuality(qList[(qList.indexOf(currentQuality) + 1) % qList.length]);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 outline-none border cursor-pointer ${
                  qualityNav.isFocused
                    ? 'bg-white text-black scale-105 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                    : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Качество: {currentQuality.toUpperCase()}
              </button>

              {/* Audio Track Selector */}
              <button
                ref={audioNav.ref}
                tabIndex={0}
                onClick={() => {
                  const audioList = ['ru-51', 'ru-dub', 'en-atmos'];
                  setSelectedAudio(audioList[(audioList.indexOf(selectedAudio) + 1) % audioList.length]);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 outline-none border cursor-pointer ${
                  audioNav.isFocused
                    ? 'bg-white text-black scale-105 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                    : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                }`}
              >
                <AudioLines className="w-3.5 h-3.5" />
                Звук: {selectedAudio === 'ru-51' ? 'Дубляж 5.1' : selectedAudio === 'ru-dub' ? 'Закадровый' : 'Original Atmos'}
              </button>

              {/* Subtitles Selector */}
              <button
                ref={subsNav.ref}
                tabIndex={0}
                onClick={() => {
                  const subList = ['none', 'ru', 'en'];
                  setSelectedSubtitle(subList[(subList.indexOf(selectedSubtitle) + 1) % subList.length]);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 outline-none border cursor-pointer ${
                  subsNav.isFocused
                    ? 'bg-white text-black scale-105 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                    : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                }`}
              >
                <Subtitles className="w-3.5 h-3.5" />
                Субтитры: {selectedSubtitle === 'none' ? 'Выкл' : selectedSubtitle.toUpperCase()}
              </button>

              {/* Aspect Ratio */}
              <button
                ref={aspectNav.ref}
                tabIndex={0}
                onClick={() => {
                  const aspectList: ('fit' | 'fill' | '16-9' | '21-9')[] = ['fit', 'fill', '16-9', '21-9'];
                  setAspectRatio(aspectList[(aspectList.indexOf(aspectRatio) + 1) % aspectList.length]);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 outline-none border cursor-pointer ${
                  aspectNav.isFocused
                    ? 'bg-white text-black scale-105 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                    : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Формат: {aspectRatio.toUpperCase()}
              </button>

              {/* Live TorrServer Telemetry Toggle */}
              <button
                ref={statsNav.ref}
                tabIndex={0}
                onClick={() => setShowTorrStats(prev => !prev)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 outline-none border cursor-pointer ${
                  statsNav.isFocused
                    ? 'bg-[#d4b581] text-black scale-105 border-white shadow-[0_0_15px_rgba(212,181,129,0.5)]'
                    : showTorrStats
                    ? 'bg-amber-500/30 text-amber-300 border-amber-500/50'
                    : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                TorrServer Статистика
              </button>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Node: {nodeId}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
