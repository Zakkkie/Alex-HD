import React from 'react';
import { Star, Play } from 'lucide-react';
import { ContentItem } from '../../types';
import { useTVNavigation } from '../../navigation/useTVNavigation';

interface ContentPosterProps {
  id: string;
  item: ContentItem;
  onSelect: (item: ContentItem) => void;
  progressPercent?: number;
  upTarget?: string;
  downTarget?: string;
  leftTarget?: string;
  rightTarget?: string;
  widthClass?: string;
  isFirst?: boolean;
  isLast?: boolean;
  alignOrigin?: 'left' | 'right' | 'center' | 'auto';
}

const DEFAULT_BACKDROP = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80';

export const ContentPoster: React.FC<ContentPosterProps> = ({
  id,
  item,
  onSelect,
  progressPercent,
  upTarget,
  downTarget,
  leftTarget,
  rightTarget,
  widthClass,
  isFirst,
  isLast,
  alignOrigin
}) => {
  const { ref, isFocused } = useTVNavigation({
    id,
    up: upTarget,
    down: downTarget,
    left: leftTarget,
    right: rightTarget,
    onEnter: () => onSelect(item)
  });

  const [imgSrc, setImgSrc] = React.useState<string>(
    item.backdrop_url || item.poster_url || DEFAULT_BACKDROP
  );

  React.useEffect(() => {
    setImgSrc(item.backdrop_url || item.poster_url || DEFAULT_BACKDROP);
  }, [item.backdrop_url, item.poster_url]);

  const handleImageError = () => {
    if (imgSrc !== item.poster_url && item.poster_url) {
      setImgSrc(item.poster_url);
    } else if (imgSrc !== DEFAULT_BACKDROP) {
      setImgSrc(DEFAULT_BACKDROP);
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'movie': return 'ФИЛЬМ';
      case 'series': return 'СЕРИАЛ';
      case 'cartoon': return 'МУЛЬТФИЛЬМ';
      case 'show': return 'ШОУ';
      default: return 'ФИЛЬМ';
    }
  };

  const rating = item.rating_imdb || item.rating_tmdb || 8.0;

  // Determine transform origin so first items scale inward without crossing left screen/container boundary
  let originClass = 'origin-center';
  if (alignOrigin === 'left' || isFirst) {
    originClass = 'origin-left';
  } else if (alignOrigin === 'right' || isLast) {
    originClass = 'origin-right';
  }

  return (
    <div
      ref={ref}
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect(item);
      }}
      className={`relative flex-shrink-0 ${widthClass || 'w-[15.5rem] sm:w-[17.5rem] md:w-[19.5rem] lg:w-[21.5rem]'} ${originClass} cursor-pointer transition-transform duration-300 ease-out outline-none select-none group ${
        isFocused ? 'scale-[1.04] z-30' : 'hover:scale-[1.01] hover:z-10'
      }`}
    >
      {/* Frame Container */}
      <div className={`relative aspect-video w-full overflow-hidden rounded-2xl mb-3 bg-[#141312] border transition-[border-color,box-shadow] duration-300 ease-out ${
        isFocused
          ? 'border-[#d4b581] shadow-[0_0_30px_rgba(212,181,129,0.5)] ring-2 ring-[#d4b581]'
          : 'border-[#f5f3ef]/15 group-hover:border-[#d4b581]/60'
      }`}>
        <img
          src={imgSrc}
          alt={item.title}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-[transform,filter] duration-500 ease-out ${
            isFocused ? 'scale-105 filter brightness-100' : 'filter brightness-[0.88] group-hover:scale-105 group-hover:brightness-100'
          }`}
        />

        {/* 4K Badge */}
        {item.is_4k && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-[#d4b581] text-black font-mono-code font-bold text-[10px] sm:text-xs uppercase tracking-wider shadow-lg">
            4K UHD
          </span>
        )}

        {/* Media Type Badge */}
        <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-[#0c0b0a]/90 text-[#f5f3ef] font-mono-code font-semibold text-[10px] sm:text-xs uppercase tracking-wider border border-[#f5f3ef]/20 backdrop-blur-md">
          {getTypeName(item.type)}
        </span>

        {/* Rating Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0c0b0a]/90 text-amber-300 font-mono-code font-bold text-xs sm:text-sm border border-amber-500/30 backdrop-blur-md shadow-lg">
          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-300 text-amber-300" />
          {rating.toFixed(1)}
        </div>

        {/* Focus / Hover Short Description Overlay on Dark Semi-Transparent Backdrop */}
        <div
          className={`absolute inset-0 bg-[#0a0a09]/90 backdrop-blur-md p-3.5 sm:p-4 flex flex-col justify-between transition-opacity duration-300 ease-out z-20 ${
            isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <div className="space-y-1.5 overflow-hidden">
            <div className="flex items-center justify-between text-[11px] font-mono-code">
              <span className="text-[#d4b581] font-bold">{item.release_year} • {item.country || 'США'} • {getTypeName(item.type)}</span>
              <span className="flex items-center gap-1 text-amber-300 font-bold bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                <Star className="w-3 h-3 fill-amber-300" />
                {rating.toFixed(1)}
              </span>
            </div>

            <h4 className="font-serif-display font-bold text-xs sm:text-sm text-[#f5f3ef] line-clamp-1 leading-snug">
              {item.title}
            </h4>

            <p className="font-sans text-[11px] sm:text-xs text-[#e6e3df]/85 line-clamp-2 sm:line-clamp-3 leading-snug">
              {item.overview || 'Краткое описание данного фильма или сериала доступно в детальной карточке.'}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/10 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#d4b581] flex items-center justify-center text-black shrink-0 shadow-lg">
              <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
            </div>
            <span className="font-mono-code text-[11px] sm:text-xs text-[#d4b581] font-bold uppercase tracking-wider">
              Смотреть
            </span>
            {item.age_rating && (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-white/10 text-white/80 rounded border border-white/15 font-mono-code">
                {item.age_rating}
              </span>
            )}
          </div>
        </div>

        {/* Watch Progress Line */}
        {progressPercent !== undefined && progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-white/20">
            <div
              className="h-full bg-[#d4b581] transition-[width] duration-300 ease-out"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        )}
      </div>

      {/* Title & Detailed Metadata Chips */}
      <div className="px-1 space-y-1">
        <p className="font-sans font-bold text-base sm:text-lg md:text-xl text-[#f5f3ef] truncate leading-tight group-hover:text-[#d4b581] transition-colors">
          {item.title}
        </p>
        <div className="font-mono-code text-xs sm:text-sm text-[#f5f3ef]/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#d4b581] font-bold">{item.release_year}</span>
            <span>•</span>
            <span className="text-[#e6e3df] font-medium">{item.country || 'США'}</span>
            <span>•</span>
            <span>{getTypeName(item.type)}</span>
            {item.age_rating && (
              <>
                <span>•</span>
                <span className="text-[11px] sm:text-xs px-1.5 py-0.5 bg-[#f5f3ef]/10 text-[#f5f3ef]/90 border border-[#f5f3ef]/20 rounded font-semibold">{item.age_rating}</span>
              </>
            )}
          </div>
          {item.genres && item.genres.length > 0 && (
            <span className="text-[#d4b581]/70 truncate max-w-[100px] text-xs font-medium">{item.genres[0]}</span>
          )}
        </div>
      </div>
    </div>
  );
};
