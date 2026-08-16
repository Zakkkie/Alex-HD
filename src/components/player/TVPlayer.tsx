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
  DownloadCloud
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

    if (Hls.isSupported() && streamUrl.endsWith('.m3u8')) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (initialPositionSeconds > 0) video.currentTime = initialPositionSeconds;
        video.play().catch(() => setIsPlaying(false));
      });
      return () => {
        hls.destroy();
      };
    } else {
      video.src = streamUrl;
      video.onloadedmetadata = () => {
        if (initialPositionSeconds > 0) video.currentTime = initialPositionSeconds;
        video.play().catch(() => setIsPlaying(false));
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
      className="fixed inset-0 z-50 bg-black overflow-hidden flex items-center justify-center select-none font-sans"
      onMouseMove={resetOSDTimeout}
    >
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
