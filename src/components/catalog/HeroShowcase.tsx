import React, { useState, useEffect, useCallback } from 'react';
import { Play, Heart, Bookmark, ChevronLeft, ChevronRight, Pause, RotateCw } from 'lucide-react';
import { ContentItem } from '../../types';
import { useTVNavigation } from '../../navigation/useTVNavigation';

interface HeroShowcaseProps {
  content?: ContentItem;
  items?: ContentItem[];
  onPlay: (item: ContentItem) => void;
  onToggleFavorite?: (id: string) => void;
  onToggleWatchlist?: (id: string) => void;
  isFavorite?: boolean;
  isWatchlist?: boolean;
  autoRotateIntervalMs?: number;
}

export const HeroShowcase: React.FC<HeroShowcaseProps> = ({
  content,
  items,
  onPlay,
  onToggleFavorite,
  onToggleWatchlist,
  isFavorite = false,
  isWatchlist = false,
  autoRotateIntervalMs = 5000
}) => {
  // Combine items into a hero slider playlist
  const heroList: ContentItem[] = React.useMemo(() => {
    if (items && items.length > 0) {
      return items;
    }
    return content ? [content] : [];
  }, [items, content]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeItem = heroList[currentIndex] || heroList[0];

  const handleNext = useCallback(() => {
    if (heroList.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % heroList.length);
  }, [heroList.length]);

  const handlePrev = useCallback(() => {
    if (heroList.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + heroList.length) % heroList.length);
  }, [heroList.length]);

  // Automatic slide rotation
  useEffect(() => {
    if (heroList.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      handleNext();
    }, autoRotateIntervalMs);

    return () => clearInterval(timer);
  }, [heroList.length, isPaused, autoRotateIntervalMs, handleNext]);

  // TV Remote Navigation Hooks for Active Item
  const playNav = useTVNavigation({
    id: 'hero-play-btn',
    left: 'sidebar-home',
    right: 'hero-fav-btn',
    down: 'carousel-row-0-item-0',
    onEnter: () => activeItem && onPlay(activeItem)
  });

  const favNav = useTVNavigation({
    id: 'hero-fav-btn',
    left: 'hero-play-btn',
    down: 'carousel-row-0-item-0',
    onEnter: () => activeItem && onToggleFavorite && onToggleFavorite(activeItem.id)
  });

  // Pause rotation when user focuses buttons
  useEffect(() => {
    if (playNav.isFocused || favNav.isFocused) {
      setIsPaused(true);
    }
  }, [playNav.isFocused, favNav.isFocused]);

  if (!activeItem) return null;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full min-h-[26rem] sm:min-h-[30rem] md:min-h-[34rem] lg:min-h-[36rem] rounded-3xl overflow-hidden mb-8 border border-[#f5f3ef]/15 bg-[#0c0b0a] group flex items-center px-6 sm:px-10 md:px-12 lg:px-14 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
    >
      {/* Background Image with rich cinematic gradient and soft zoom */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          key={activeItem.id}
          src={activeItem.backdrop_url || activeItem.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80'}
          alt={activeItem.title}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80';
          }}
          className="w-full h-full object-cover filter brightness-[0.52] contrast-[1.08] scale-100 transition-all duration-1000 ease-out"
        />
        {/* Multilayer gradient masks for supreme text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b0a] via-[#0c0b0a]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c0b0a] via-[#0c0b0a]/85 to-transparent w-full md:w-[75%]" />
      </div>

      {/* Hero Body Text Content */}
      <div className="relative z-10 max-w-3xl py-6 sm:py-8">
        {/* Meta Header Badges */}
        <div className="flex items-center gap-2.5 mb-3 flex-wrap">
          <span className="px-3 py-1 rounded-lg bg-[#d4b581]/20 text-[#d4b581] font-mono-code text-xs uppercase tracking-wider font-bold border border-[#d4b581]/40">
            {activeItem.is_4k ? '4K UHD' : '1080p FHD'} • МИН. 1080p НА ТОРРЕНТАХ
          </span>

          {activeItem.rating_imdb && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono-code text-xs font-bold border border-amber-500/40 flex items-center gap-1.5">
              ★ {activeItem.rating_imdb.toFixed(1)} IMDb
            </span>
          )}

          {activeItem.release_year && (
            <span className="font-mono-code text-xs sm:text-sm text-[#f5f3ef]/70 font-semibold">
              {activeItem.release_year}
            </span>
          )}

          <span className="font-mono-code text-xs sm:text-sm text-[#d4b581] font-semibold">
            • {activeItem.country || 'США'}
          </span>

          {activeItem.runtime_minutes && (
            <span className="font-mono-code text-xs sm:text-sm text-[#f5f3ef]/70 font-semibold">
              • {Math.floor(activeItem.runtime_minutes / 60)}ч {activeItem.runtime_minutes % 60}м
            </span>
          )}

          {activeItem.genres && activeItem.genres.length > 0 && (
            <span className="font-mono-code text-xs sm:text-sm text-[#d4b581] font-medium">
              • {activeItem.genres.slice(0, 2).join(', ')}
            </span>
          )}

          {heroList.length > 1 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f5f3ef]/10 text-[#f5f3ef]/80 font-mono-code text-xs uppercase font-semibold border border-[#f5f3ef]/20 ml-auto">
              <RotateCw className={`w-3 h-3 ${!isPaused ? 'animate-spin' : ''}`} />
              {currentIndex + 1}/{heroList.length}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-serif-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#f5f3ef] leading-[1.05] tracking-tight mb-2 drop-shadow-lg transition-all duration-300">
          {activeItem.title}
        </h1>
        {activeItem.original_title && (
          <p className="font-serif-display italic text-lg sm:text-xl text-[#d4b581]/90 mb-3 font-normal">
            {activeItem.original_title}
          </p>
        )}

        {/* Summary */}
        <p className="font-sans text-xs sm:text-sm md:text-base text-[#f5f3ef]/85 leading-relaxed mb-6 max-w-2xl line-clamp-2">
          {activeItem.overview}
        </p>

        {/* CTA Row */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {/* Play Button */}
          <button
            ref={playNav.ref}
            tabIndex={0}
            onClick={() => onPlay(activeItem)}
            className={`bg-[#d4b581] text-black font-bold font-sans px-10 py-4.5 rounded-2xl uppercase tracking-wider text-sm sm:text-base border border-[#e5c999] cursor-pointer transition-all duration-200 outline-none select-none flex items-center gap-3 shadow-xl ${
              playNav.isFocused
                ? 'scale-105 shadow-[0_0_35px_rgba(212,181,129,0.8)] bg-[#e5c999] ring-2 ring-white/50'
                : 'hover:bg-[#e2c694]'
            }`}
          >
            <Play className="w-5 h-5 fill-black" />
            Смотреть
          </button>

          {/* Icon Button: Favorites */}
          {/* Icon Button: Unified Favorites/Watchlist */}
          <button
            ref={favNav.ref}
            tabIndex={0}
            onClick={() => onToggleFavorite && onToggleFavorite(activeItem.id)}
            title={isFavorite ? "В избранном" : "Буду смотреть"}
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border outline-none flex items-center justify-center cursor-pointer select-none backdrop-blur-md transition-[transform,background-color,border-color,box-shadow] duration-200 active:scale-95 active:translate-y-0.5 ${
              favNav.isFocused
                ? 'border-[#d4b581] text-[#d4b581] bg-[#d4b581]/25 scale-110 shadow-[0_0_25px_rgba(212,181,129,0.6)] ring-2 ring-[#d4b581]'
                : isFavorite
                ? 'border-[#d4b581]/50 text-[#d4b581] bg-[#d4b581]/20 shadow-[0_0_15px_rgba(212,181,129,0.2)]'
                : 'border-[#f5f3ef]/25 bg-[#0c0b0a]/70 text-[#f5f3ef] hover:border-[#d4b581] hover:text-[#d4b581] hover:bg-[#d4b581]/10'
            }`}
          >
            <Heart className={`w-6 h-6 transition-transform duration-300 ${isFavorite ? 'fill-[#d4b581] text-[#d4b581] scale-110' : 'text-[#f5f3ef]/70'}`} />
          </button>

          {/* Slider Prev / Next Controls */}
          {heroList.length > 1 && (
            <div className="flex items-center gap-2.5 ml-auto sm:ml-4">
              <button
                onClick={handlePrev}
                title="Предыдущий фильм"
                className="w-12 h-12 rounded-2xl bg-black/60 border border-[#f5f3ef]/25 hover:border-[#d4b581] text-[#f5f3ef] hover:text-[#d4b581] flex items-center justify-center transition cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                title="Следующий фильм"
                className="w-12 h-12 rounded-2xl bg-black/60 border border-[#f5f3ef]/25 hover:border-[#d4b581] text-[#f5f3ef] hover:text-[#d4b581] flex items-center justify-center transition cursor-pointer active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Dots Navigation Indicators */}
        {heroList.length > 1 && (
          <div className="flex items-center gap-2.5 mt-5">
            {heroList.map((item, idx) => (
              <button
                key={item.id || idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex
                    ? 'w-10 bg-[#d4b581]'
                    : 'w-3 bg-[#f5f3ef]/30 hover:bg-[#f5f3ef]/70'
                }`}
                title={item.title}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
