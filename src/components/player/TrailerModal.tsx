import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Sparkles } from 'lucide-react';
import { ContentItem } from '../../types';

interface TrailerModalProps {
  content: ContentItem;
  isOpen: boolean;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ content, isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [videoError, setVideoError] = useState<string | null>(null);

  const trailerStreamUrl =
    content.trailer_url ||
    content.stream_url ||
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Back' || e.keyCode === 10009) {
        e.preventDefault();
        onClose();
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * duration;
    setCurrentTime(video.currentTime);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[9999] flex flex-col justify-between p-4 sm:p-8 animate-[fadeIn_0.15s_ease-out] font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#d4b581] font-bold">
              Официальный Трейлер в 4K Ultra HD
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
              DOLBY VISION
            </span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl text-white font-bold mt-1">{content.title}</h2>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-[#d4b581] hover:text-black text-white border border-white/15 rounded-xl transition font-mono text-xs uppercase font-bold cursor-pointer"
        >
          <X className="w-4 h-4" />
          Закрыть
        </button>
      </div>

      {/* Main Video Viewport */}
      <div className="relative flex-1 my-4 bg-black rounded-2xl flex items-center justify-center overflow-hidden border border-white/10">
        <video
          ref={videoRef}
          src={trailerStreamUrl}
          poster={content.backdrop_url || content.poster_url}
          autoPlay
          playsInline
          muted={isMuted}
          className="w-full h-full object-contain"
          onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
          onDurationChange={() => videoRef.current && setDuration(videoRef.current.duration)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setVideoError('Не удалось загрузить трейлер. Проверьте интернет-соединение.')}
        />

        {videoError && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-rose-400 font-mono text-sm mb-4">{videoError}</p>
            <button
              onClick={() => {
                setVideoError(null);
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play();
                }
              }}
              className="px-4 py-2 bg-[#d4b581] text-black font-mono font-bold text-xs uppercase rounded-xl cursor-pointer"
            >
              Попробовать снова
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="bg-black/60 border border-white/10 rounded-2xl p-4 font-mono space-y-3">
        <div className="flex justify-between text-xs text-[#d4b581] font-bold">
          <span className="uppercase tracking-wider">{content.title} — ТРЕЙЛЕР</span>
          <span>
            {formatTime(currentTime)} / {formatTime(duration || 120)}
          </span>
        </div>

        {/* Seek Bar */}
        <div
          onClick={handleSeek}
          className="w-full h-2 bg-white/20 hover:h-3 transition-all relative cursor-pointer group rounded-full overflow-hidden"
        >
          <div
            className="absolute top-0 left-0 bottom-0 bg-[#d4b581] transition-all"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        {/* Media action controls */}
        <div className="flex items-center justify-between text-xs text-white/70 pt-1">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="p-2 bg-white/10 hover:bg-[#d4b581] hover:text-black rounded-lg transition text-white cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-white cursor-pointer flex items-center gap-2"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#d4b581]" />}
            </button>

            <span className="text-[11px] text-[#d4b581] font-bold">● ДУБЛЯЖ [РУС] (DOLBY ATMOS 7.1)</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#e6e3df]/60 font-mono">
            <span>Качество: 4K 60FPS</span>
            <span>Кодек: HEVC / H.265</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
