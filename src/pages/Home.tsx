import React, { useState } from 'react';
import { HomePayload, ContentItem } from '../types';
import { HeroShowcase } from '../components/catalog/HeroShowcase';
import { CarouselRow } from '../components/catalog/CarouselRow';
import { useTVNavigation } from '../navigation/useTVNavigation';

interface HomeProps {
  data: HomePayload;
  onPlay: (item: ContentItem) => void;
  onSelectContent: (item: ContentItem) => void;
  onToggleFavorite?: (id: string) => void;
  onToggleWatchlist?: (id: string) => void;
}

export const Home: React.FC<HomeProps> = ({
  data,
  onPlay,
  onSelectContent,
  onToggleFavorite,
  onToggleWatchlist
}) => {
  const [filter, setFilter] = useState<'all' | 'movies' | 'series' | '4k'>('all');

  const heroPlaylist = React.useMemo(() => {
    if (!data) return [];
    const list: ContentItem[] = [];
    if (data.hero) list.push(data.hero);
    if (data.trending24h && data.trending24h.length > 0) {
      data.trending24h.forEach((item) => {
        if (!list.some((i) => i.id === item.id)) {
          list.push(item);
        }
      });
    }
    return list.slice(0, 6);
  }, [data]);

  if (!data || !data.hero) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-12 h-12 border-4 border-[#e5a93c] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Загрузка каталога Alex HD...</h2>
        <p className="text-white/60 text-sm max-w-md">
          Подключение к серверу и загрузка списка фильмов...
        </p>
      </div>
    );
  }

  const filterItems = (items: ContentItem[]) => {
    if (!items) return [];
    if (filter === 'movies') return items.filter(i => i.type === 'movie');
    if (filter === 'series') return items.filter(i => i.type === 'series');
    if (filter === '4k') return items.filter(i => i.is_4k);
    return items;
  };

  const filteredTrending = filterItems(data.trending24h || []);
  const filteredPopular = filterItems(data.popular || []);
  const filteredNew = filterItems(data.newReleases || []);
  const filteredClassics = filterItems(data.timelessClassics || []);
  const filtered4k = filterItems(data.fourKCollection || []);

  const rows = React.useMemo(() => {
    return [
      {
        id: 'continue',
        rowIndex: 0,
        title: 'Продолжить просмотр',
        items: data.continueWatching && data.continueWatching.length > 0 && filter === 'all' ? data.continueWatching : []
      },
      {
        id: 'top-movies',
        rowIndex: 1,
        title: 'Последние новинки кино',
        items: filter === 'series' ? [] : filterItems(data.topMovies || [])
      },
      {
        id: 'top-series',
        rowIndex: 2,
        title: 'Топовые новые сериалы',
        items: filter === 'movies' ? [] : filterItems(data.topSeries || [])
      },
      {
        id: 'anime',
        rowIndex: 3,
        title: 'Популярное аниме и мультфильмы',
        items: filter === '4k' ? filterItems(data.anime || []).filter(i => i.is_4k) : filterItems(data.anime || [])
      },
      {
        id: 'trending',
        rowIndex: 4,
        title: 'Сейчас смотрят (Тренды 24ч)',
        items: filteredTrending
      },
      {
        id: 'popular',
        rowIndex: 5,
        title: 'Популярное в каталоге',
        items: filteredPopular
      },
      {
        id: 'classics',
        rowIndex: 6,
        title: 'Вечные хиты и Классика',
        items: filteredClassics
      },
      {
        id: '4k',
        rowIndex: 7,
        title: '4K Ultra HDR Качество',
        items: filtered4k
      }
    ].filter(r => r.items.length > 0);
  }, [data, filter, filteredTrending, filteredPopular, filteredClassics, filtered4k]);

  const firstRowItemId = rows.length > 0 ? `carousel-row-${rows[0].rowIndex}-item-0` : 'carousel-row-1-item-0';

  return (
    <div className="pb-16 pt-4">
      {/* Featured Hero Showcase */}
      <HeroShowcase
        content={data.hero}
        items={heroPlaylist}
        onPlay={onPlay}
        onToggleFavorite={onToggleFavorite}
        onToggleWatchlist={onToggleWatchlist}
      />

      {/* Quick Filter Bar */}
      <div className="flex items-center gap-3 mb-8 overflow-x-auto no-scrollbar py-2 px-1">
        <FilterTag
          id="filter-tag-all"
          label="Все категории"
          isActive={filter === 'all'}
          onClick={() => setFilter('all')}
          left="sidebar-home"
          right="filter-tag-movies"
          up="hero-play-btn"
          down={firstRowItemId}
        />
        <FilterTag
          id="filter-tag-movies"
          label="Фильмы"
          isActive={filter === 'movies'}
          onClick={() => setFilter('movies')}
          left="filter-tag-all"
          right="filter-tag-series"
          up="hero-play-btn"
          down={firstRowItemId}
        />
        <FilterTag
          id="filter-tag-series"
          label="Сериалы"
          isActive={filter === 'series'}
          onClick={() => setFilter('series')}
          left="filter-tag-movies"
          right="filter-tag-4k"
          up="hero-play-btn"
          down={firstRowItemId}
        />
        <FilterTag
          id="filter-tag-4k"
          label="4K Ultra HD"
          isActive={filter === '4k'}
          onClick={() => setFilter('4k')}
          left="filter-tag-series"
          up="hero-play-btn"
          down={firstRowItemId}
        />
      </div>

      {/* Carousel Rows */}
      <div className="space-y-6">
        {rows.map((row, idx) => {
          const upTarget = idx === 0 
            ? 'filter-tag-all' 
            : `carousel-row-${rows[idx - 1].rowIndex}-item-0`;
          
          const downTarget = idx === rows.length - 1 
            ? undefined 
            : `carousel-row-${rows[idx + 1].rowIndex}-item-0`;

          return (
            <CarouselRow
              key={row.id}
              rowIndex={row.rowIndex}
              title={row.title}
              items={row.items}
              onSelect={onSelectContent}
              upTarget={upTarget}
              downTarget={downTarget}
            />
          );
        })}
      </div>
    </div>
  );
};

const FilterTag: React.FC<{
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  left?: string;
  right?: string;
  up?: string;
  down?: string;
}> = ({ id, label, isActive, onClick, left, right, up, down }) => {
  const { ref, isFocused } = useTVNavigation({
    id,
    left,
    right,
    up,
    down,
    onEnter: onClick
  });

  return (
    <button
      ref={ref}
      tabIndex={0}
      onClick={onClick}
      className={`px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl font-mono-code text-xs sm:text-sm uppercase tracking-wider transition-all outline-none border cursor-pointer select-none whitespace-nowrap ${
        isFocused
          ? 'bg-[#d4b581] text-black scale-105 shadow-[0_0_20px_rgba(212,181,129,0.5)] border-[#d4b581] font-bold z-10'
          : isActive
          ? 'bg-[#d4b581]/25 text-[#d4b581] border-[#d4b581]/60 font-semibold shadow-sm'
          : 'bg-[#e6e3df]/5 text-[#e6e3df]/70 border-[#e6e3df]/15 hover:bg-[#e6e3df]/10 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
};
