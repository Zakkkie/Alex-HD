import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Image as ImageIcon, ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

interface StillsCarouselProps {
  stills: string[];
  title?: string;
}

export const StillsCarousel: React.FC<StillsCarouselProps> = ({
  stills,
  title = 'Кадры из фильма'
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeModalIdx, setActiveModalIdx] = useState<number | null>(null);

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

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (activeModalIdx === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModalIdx(null);
      } else if (e.key === 'ArrowLeft') {
        setActiveModalIdx((prev) => (prev !== null && prev > 0 ? prev - 1 : stills.length - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveModalIdx((prev) => (prev !== null && prev < stills.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModalIdx, stills.length]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 500;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(() => {
      if (scrollRef.current) checkScroll();
    }, 300);
  };

  if (!stills || stills.length === 0) return null;

  return (
    <div className="space-y-5 my-10">
      {/* Header with Title and Carousel Controls */}
      <div className="flex items-center justify-between border-b border-[#f5f3ef]/15 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#d4b581]/15 flex items-center justify-center text-[#d4b581] border border-[#d4b581]/35 shadow-md">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#f5f3ef]">
                {title}
              </h2>
              <span className="px-2.5 py-1 bg-[#d4b581]/20 text-[#d4b581] font-mono-code text-xs font-bold rounded-lg border border-[#d4b581]/30">
                {stills.length} кадров
              </span>
            </div>
            <p className="font-mono-code text-xs text-[#f5f3ef]/50 hidden sm:block mt-0.5">
              Кликните для просмотра в 4K разрешении • Прокручивайте колесом мыши
            </p>
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              scroll('left');
            }}
            disabled={!canScrollLeft}
            aria-label="Назад"
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
            aria-label="Вперед"
            className="w-11 h-11 rounded-2xl bg-[#121110] border border-[#f5f3ef]/20 hover:border-[#d4b581] hover:bg-[#d4b581]/15 text-[#f5f3ef] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-[background-color,border-color,transform] cursor-pointer shadow-lg active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Horizontal Stills Track */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1 -mx-2 px-2 select-none"
      >
        {stills.map((still, idx) => (
          <div
            key={idx}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveModalIdx(idx);
            }}
            className="group relative w-[320px] sm:w-[400px] md:w-[460px] lg:w-[500px] shrink-0 aspect-video rounded-3xl overflow-hidden border border-[#f5f3ef]/15 hover:border-[#d4b581] hover:shadow-[0_0_35px_rgba(212,181,129,0.35)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1.5 cursor-pointer bg-neutral-900 shadow-xl"
          >
            <img
              src={still}
              alt={`Кадр ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent opacity-40 group-hover:opacity-10 transition-opacity" />
            
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="p-2.5 rounded-2xl bg-black/80 backdrop-blur-md border border-white/25 text-[#d4b581] shadow-2xl">
                <Maximize2 className="w-5 h-5" />
              </div>
            </div>

            <div className="absolute bottom-4 left-4 flex items-center gap-2.5">
              <span className="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white font-mono-code text-xs uppercase font-bold shadow-lg">
                Кадр {idx + 1}
              </span>
              <span className="text-xs font-mono-code text-[#d4b581] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                4K Ultra HD
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal rendered via Portal directly to body */}
      {activeModalIdx !== null &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9999] flex flex-col justify-between p-4 sm:p-8 animate-[fadeIn_0.15s_ease-out] select-none"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveModalIdx(null);
              }
            }}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 z-50">
              <div className="flex items-center gap-3">
                <span className="font-mono-code text-xs uppercase tracking-widest text-[#d4b581] font-bold">
                  Просмотр кадра
                </span>
                <span className="text-white/40 font-mono-code text-xs">
                  {activeModalIdx + 1} / {stills.length}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveModalIdx(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-[#d4b581] hover:text-black text-white border border-white/15 rounded-xl transition-all font-mono-code text-xs uppercase font-semibold cursor-pointer"
              >
                <X className="w-4 h-4" />
                Закрыть (ESC)
              </button>
            </div>

            {/* Main Center Image with Left/Right Click zones */}
            <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveModalIdx((prev) => (prev !== null && prev > 0 ? prev - 1 : stills.length - 1));
                }}
                aria-label="Предыдущий кадр"
                className="absolute left-2 sm:left-6 z-40 w-12 h-12 rounded-full bg-black/60 hover:bg-[#d4b581] hover:text-black text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-2xl backdrop-blur-md active:scale-95"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>

              <img
                src={stills[activeModalIdx]}
                alt={`Кадр ${activeModalIdx + 1}`}
                className="max-w-full max-h-[78vh] object-contain rounded-xl shadow-2xl border border-white/10"
              />

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveModalIdx((prev) => (prev !== null && prev < stills.length - 1 ? prev + 1 : 0));
                }}
                aria-label="Следующий кадр"
                className="absolute right-2 sm:right-6 z-40 w-12 h-12 rounded-full bg-black/60 hover:bg-[#d4b581] hover:text-black text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-2xl backdrop-blur-md active:scale-95"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </div>

            {/* Bottom thumbnail strip */}
            <div className="flex items-center justify-center gap-3 overflow-x-auto no-scrollbar py-2">
              {stills.map((st, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveModalIdx(i);
                  }}
                  className={`relative w-20 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    i === activeModalIdx
                      ? 'border-[#d4b581] scale-110 shadow-[0_0_15px_rgba(212,181,129,0.5)]'
                      : 'border-white/20 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={st} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
