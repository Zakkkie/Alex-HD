import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Users, ChevronLeft, ChevronRight, Clapperboard, Sparkles } from 'lucide-react';

export interface CastMember {
  id?: number | string;
  name: string;
  role?: string;
  avatar: string;
}

interface CastCarouselProps {
  director?: string;
  directorId?: number | string;
  directorPhoto?: string;
  cast: CastMember[];
  onPersonClick: (person: { id?: number | string; name: string }) => void;
  title?: string;
}

export const CastCarousel: React.FC<CastCarouselProps> = ({
  director,
  directorId,
  directorPhoto,
  cast,
  onPersonClick,
  title = 'Актеры и создатели'
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    // Smooth wheel scrolling
    const handleWheel = (e: WheelEvent) => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const maxScroll = scrollWidth - clientWidth;

      if (Math.abs(e.deltaY) > 0) {
        if ((e.deltaY > 0 && scrollLeft < maxScroll - 2) || (e.deltaY < 0 && scrollLeft > 2)) {
          e.preventDefault();
          el.scrollLeft += e.deltaY * 1.2;
          checkScroll();
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 450;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(checkScroll, 300);
  };

  const totalPeople = (director && director !== 'Неизвестно' ? 1 : 0) + cast.length;

  return (
    <div className="space-y-5 my-10">
      {/* Header with Title and Carousel Controls */}
      <div className="flex items-center justify-between border-b border-[#f5f3ef]/15 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#d4b581]/15 flex items-center justify-center text-[#d4b581] border border-[#d4b581]/35 shadow-md">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#f5f3ef]">
                {title}
              </h2>
              <span className="px-2.5 py-1 bg-[#d4b581]/20 text-[#d4b581] font-mono-code text-xs font-bold rounded-lg border border-[#d4b581]/30">
                {totalPeople}
              </span>
            </div>
            <p className="font-mono-code text-xs text-[#f5f3ef]/50 hidden sm:block mt-0.5">
              Кликните для просмотра полной фильмографии • Прокручивайте колесом мыши или стрелками
            </p>
          </div>
        </div>

        {/* Arrow Navigation Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              scroll('left');
            }}
            disabled={!canScrollLeft}
            aria-label="Прокрутить назад"
            className="w-11 h-11 rounded-2xl bg-[#121110] border border-[#f5f3ef]/20 hover:border-[#d4b581] hover:bg-[#d4b581]/15 text-[#f5f3ef] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-[background-color,border-color,transform] cursor-pointer shadow-lg active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              scroll('right');
            }}
            disabled={!canScrollRight}
            aria-label="Прокрутить вперед"
            className="w-11 h-11 rounded-2xl bg-[#121110] border border-[#f5f3ef]/20 hover:border-[#d4b581] hover:bg-[#d4b581]/15 text-[#f5f3ef] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-[background-color,border-color,transform] cursor-pointer shadow-lg active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1 -mx-2 px-2 select-none"
      >
        {/* Director Card */}
        {director && director !== 'Неизвестно' && (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPersonClick({ id: directorId, name: director });
            }}
            className="group relative w-[230px] sm:w-[260px] md:w-[280px] shrink-0 bg-gradient-to-b from-[#1c1a17] to-[#0e0d0c] border-2 border-[#d4b581]/60 hover:border-[#d4b581] hover:shadow-[0_0_30px_rgba(212,181,129,0.4)] rounded-3xl p-5 cursor-pointer transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 bg-[#d4b581] text-black text-xs font-mono-code font-bold rounded-md tracking-wider uppercase shadow">
                  РЕЖИССЕР
                </span>
                <Sparkles className="w-4 h-4 text-[#d4b581]" />
              </div>

              <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-4 rounded-2xl overflow-hidden border-2 border-[#d4b581]/50 shadow-xl bg-[#d4b581]/10 flex items-center justify-center">
                {directorPhoto ? (
                  <img
                    src={directorPhoto}
                    alt={director}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <Clapperboard className="w-12 h-12 text-[#d4b581]" />
                )}
              </div>

              <h4 className="font-serif-display text-lg sm:text-xl font-bold text-[#f5f3ef] group-hover:text-[#d4b581] transition-colors text-center line-clamp-1">
                {director}
              </h4>
              <p className="font-mono-code text-xs text-[#d4b581] text-center mt-1 font-medium">
                Главный создатель
              </p>
            </div>

            <div className="mt-5 pt-3.5 border-t border-[#d4b581]/25 flex items-center justify-center gap-1.5 font-mono-code text-xs text-[#d4b581] font-semibold group-hover:underline">
              <span>Фильмография</span>
              <span>↗</span>
            </div>
          </div>
        )}

        {/* Cast Member Cards */}
        {cast.map((actor, idx) => (
          <div
            key={idx}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPersonClick({ id: actor.id, name: actor.name });
            }}
            className="group relative w-[190px] sm:w-[220px] md:w-[240px] shrink-0 bg-[#121110] border border-[#f5f3ef]/15 hover:border-[#d4b581] hover:bg-[#181715] hover:shadow-[0_0_25px_rgba(212,181,129,0.25)] rounded-3xl p-4 cursor-pointer transition-[transform,border-color,background-color,box-shadow] duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden mb-3.5 border border-[#f5f3ef]/15 group-hover:border-[#d4b581]/50 transition-colors bg-neutral-900 shadow-md">
                <img
                  src={actor.avatar}
                  alt={actor.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95 group-hover:brightness-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
                <div className="absolute top-2.5 right-2.5">
                  <span className="px-2 py-0.5 bg-black/80 backdrop-blur-sm border border-white/15 text-[10px] sm:text-[11px] font-mono-code text-[#d4b581] font-bold rounded-md">
                    TMDB
                  </span>
                </div>
              </div>

              <h4 className="font-serif-display text-base sm:text-lg font-bold text-[#f5f3ef] group-hover:text-[#d4b581] transition-colors line-clamp-1 leading-snug">
                {actor.name}
              </h4>
              <p className="font-mono-code text-xs sm:text-sm text-[#f5f3ef]/60 truncate mt-1">
                {actor.role || 'В ролях'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#f5f3ef]/10 flex items-center justify-between font-mono-code text-xs text-[#f5f3ef]/50 group-hover:text-[#d4b581] font-semibold">
              <span>Все фильмы</span>
              <span className="group-hover:translate-x-1 transition-transform">↗</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
