import React, { useState } from 'react';
import { HomePayload, ContentItem, WatchHistoryItem } from '../types';
import { HeroShowcase } from '../components/catalog/HeroShowcase';
import { CarouselRow } from '../components/catalog/CarouselRow';
import { useTVNavigation } from '../navigation/useTVNavigation';
import { api } from '../api/client';

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

  // Track state for infinite scroll per row
  const [rowItems, setRowItems] = useState<Record<string, (ContentItem | WatchHistoryItem)[]>>({});
  const [rowPages, setRowPages] = useState<Record<string, number>>({});
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({});

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

  const filterItems = (items: ContentItem[]) => {
    if (!items) return [];
    if (filter === 'movies') return items.filter(i => i.type === 'movie');
    if (filter === 'series') return items.filter(i => i.type === 'series');
    if (filter === '4k') return items.filter(i => i.is_4k);
    return items;
  };

  const filteredTrending = React.useMemo(() => filterItems(data?.trending24h || []), [data, filter]);
  const filteredPopular = React.useMemo(() => filterItems(data?.popular || []), [data, filter]);
  const filteredNew = React.useMemo(() => filterItems(data?.newReleases || []), [data, filter]);
  const filteredClassics = React.useMemo(() => filterItems(data?.timelessClassics || []), [data, filter]);
  const filtered4k = React.useMemo(() => filterItems(data?.fourKCollection || []), [data, filter]);

  // When data or filter changes, initialize or reset row items and page counts
  React.useEffect(() => {
    if (!data) return;
    const initialItems: Record<string, (ContentItem | WatchHistoryItem)[]> = {};
    const initialPages: Record<string, number> = {};

    const topMoviesItems = filter === 'series' ? [] : filterItems(data.topMovies || []);
    const topSeriesItems = filter === 'movies' ? [] : filterItems(data.topSeries || []);
    const animeItems = filter === '4k' ? filterItems(data.anime || []).filter(i => i.is_4k) : filterItems(data.anime || []);
    const trendingItems = filteredTrending;
    const popularItems = filteredPopular;
    const classicsItems = filteredClassics;
    const fourKItems = filtered4k;
    const continueItems = data.continueWatching && data.continueWatching.length > 0 && filter === 'all' ? data.continueWatching : [];

    initialItems['continue'] = continueItems;
    initialItems['top-movies'] = topMoviesItems;
    initialItems['top-series'] = topSeriesItems;
    initialItems['anime'] = animeItems;
    initialItems['trending'] = trendingItems;
    initialItems['popular'] = popularItems;
    initialItems['classics'] = classicsItems;
    initialItems['4k'] = fourKItems;

    initialPages['continue'] = 1;
    initialPages['top-movies'] = 1;
    initialPages['top-series'] = 1;
    initialPages['anime'] = 1;
    initialPages['trending'] = 1;
    initialPages['popular'] = 1;
    initialPages['classics'] = 1;
    initialPages['4k'] = 1;

    setRowItems(initialItems);
    setRowPages(initialPages);
    setRowLoading({});
  }, [data, filter, filteredTrending, filteredPopular, filteredClassics, filtered4k]);

  // Load more function triggered by scroll-to-end detection
  const handleLoadMore = async (rowId: string) => {
    if (rowLoading[rowId]) return;
    if (rowId === 'continue') return;

    const currentPage = rowPages[rowId] || 1;
    const nextPage = currentPage + 1;

    let type = 'all';
    let sortBy = 'popularity';

    switch (rowId) {
      case 'top-movies':
        type = 'movie';
        sortBy = 'year';
        break;
      case 'top-series':
        type = 'series';
        sortBy = 'year';
        break;
      case 'anime':
        type = 'anime';
        sortBy = 'rating';
        break;
      case 'trending':
        type = 'trending';
        sortBy = 'popularity';
        break;
      case 'popular':
        type = 'all';
        sortBy = 'popularity';
        break;
      case 'classics':
        type = 'all';
        sortBy = 'rating';
        break;
      case '4k':
        type = '4k';
        sortBy = 'popularity';
        break;
      default:
        return;
    }

    setRowLoading(prev => ({ ...prev, [rowId]: true }));

    try {
      const res = await api.getCatalogItems({
        page: nextPage,
        limit: 15, // load chunks of 15
        type,
        sortBy
      });

      if (res && Array.isArray(res.items) && res.items.length > 0) {
        const existingRowItems = rowItems[rowId] || [];
        const existingIds = new Set(existingRowItems.map(item => {
          const content = (item as WatchHistoryItem).content || (item as ContentItem);
          return content.id;
        }));

        const newItems = res.items.filter(item => !existingIds.has(item.id));

        if (newItems.length > 0) {
          setRowItems(prev => ({
            ...prev,
            [rowId]: [...(prev[rowId] || []), ...newItems]
          }));
          setRowPages(prev => ({
            ...prev,
            [rowId]: nextPage
          }));
        }
      }
    } catch (err) {
      console.warn(`[Home.tsx] Failed to load more items for ${rowId}:`, err);
    } finally {
      setRowLoading(prev => ({ ...prev, [rowId]: false }));
    }
  };

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

  const rows = [
    {
      id: 'continue',
      rowIndex: 0,
      title: 'Продолжить просмотр',
      items: rowItems['continue'] || []
    },
    {
      id: 'top-movies',
      rowIndex: 1,
      title: 'Последние новинки кино',
      items: rowItems['top-movies'] || []
    },
    {
      id: 'top-series',
      rowIndex: 2,
      title: 'Топовые новые сериалы',
      items: rowItems['top-series'] || []
    },
    {
      id: 'anime',
      rowIndex: 3,
      title: 'Популярное аниме и мультфильмы',
      items: rowItems['anime'] || []
    },
    {
      id: 'trending',
      rowIndex: 4,
      title: 'Сейчас смотрят (Тренды 24ч)',
      items: rowItems['trending'] || []
    },
    {
      id: 'popular',
      rowIndex: 5,
      title: 'Популярное в каталоге',
      items: rowItems['popular'] || []
    },
    {
      id: 'classics',
      rowIndex: 6,
      title: 'Вечные хиты и Классика',
      items: rowItems['classics'] || []
    },
    {
      id: '4k',
      rowIndex: 7,
      title: '4K Ultra HDR Качество',
      items: rowItems['4k'] || []
    }
  ].filter(r => r.items.length > 0);

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
              onScrollToEnd={() => handleLoadMore(row.id)}
              isLoadingMore={rowLoading[row.id]}
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
