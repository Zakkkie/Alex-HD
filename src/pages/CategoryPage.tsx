import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HomePayload, ContentItem } from '../types';
import { ContentPoster } from '../components/catalog/ContentPoster';
import { TrendingUp, Grid, Tv, Filter, Loader2, Sparkles, Film, Clapperboard, Flame } from 'lucide-react';
import { useTVNavigation } from '../navigation/useTVNavigation';
import { api } from '../api/client';

const CategoryFilterBtn: React.FC<{
  id: string;
  name: string;
  itemCount: number;
  isSelected: boolean;
  onSelect: () => void;
  left?: string;
  right?: string;
  down?: string;
}> = ({ id, name, itemCount, isSelected, onSelect, left, right, down }) => {
  const { ref, isFocused } = useTVNavigation({
    id,
    left,
    right,
    down,
    onEnter: onSelect
  });

  return (
    <button
      ref={ref}
      tabIndex={0}
      onClick={onSelect}
      className={`px-5 py-2.5 rounded-full font-mono-code text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-200 cursor-pointer border outline-none ${
        isFocused
          ? 'bg-[#d4b581] text-black scale-105 shadow-[0_0_15px_rgba(212,181,129,0.4)] border-[#d4b581] font-semibold'
          : isSelected
          ? 'bg-[#d4b581]/20 text-[#d4b581] border-[#d4b581]/50'
          : 'bg-[#e6e3df]/5 text-[#e6e3df]/70 border-[#e6e3df]/10 hover:bg-[#e6e3df]/10'
      }`}
    >
      {name} ({itemCount})
    </button>
  );
};

const LoadMoreBtn: React.FC<{
  id: string;
  isLoading: boolean;
  onLoadMore: () => void;
  upTarget?: string;
}> = ({ id, isLoading, onLoadMore, upTarget }) => {
  const { ref, isFocused } = useTVNavigation({
    id,
    up: upTarget,
    onEnter: onLoadMore
  });

  return (
    <button
      ref={ref}
      tabIndex={0}
      onClick={onLoadMore}
      disabled={isLoading}
      className={`px-8 py-4 rounded-2xl font-mono-code text-sm uppercase tracking-widest transition-all duration-200 cursor-pointer border outline-none flex items-center justify-center gap-3 mx-auto mt-12 ${
        isFocused
          ? 'bg-[#d4b581] text-black scale-105 shadow-[0_0_20px_rgba(212,181,129,0.5)] border-[#d4b581] font-bold'
          : 'bg-[#d4b581]/15 text-[#d4b581] border-[#d4b581]/40 hover:bg-[#d4b581]/25'
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Загрузка следующих 50 релизов...
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5" />
          Загрузить еще 50 релизов
        </>
      )}
    </button>
  );
};

interface CategoryPageProps {
  mode: 'trending' | 'collections' | '4k' | 'movies' | 'series' | 'anime';
  data: HomePayload;
  onSelectContent: (item: ContentItem) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  mode,
  data,
  onSelectContent
}) => {
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  // Paginated items state (50 per batch)
  const [items, setItems] = useState<ContentItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Safely resolve categories / collections list
  const categoriesList = (data as any)?.categories || data?.collections || [];

  // Title, subtitle & icon logic
  let title = '';
  let subtitle = '';
  let Icon = TrendingUp;

  if (mode === 'trending') {
    title = 'Сейчас смотрят (Тренды)';
    subtitle = 'Топ популярных релизов за последние 24 часа';
    Icon = Flame;
  } else if (mode === '4k') {
    title = '4K Ultra HDR Каталог';
    subtitle = 'Высокобитрейтные релизы в максимальном разрешении 2160p Dolby Vision';
    Icon = Tv;
  } else if (mode === 'movies') {
    title = 'Все Фильмы';
    subtitle = 'Полный каталог полнометражного кино в дубляже и 4K Ultra HD';
    Icon = Film;
  } else if (mode === 'series') {
    title = 'Все Сериалы';
    subtitle = 'Завершенные и выходящие многосерийные проекты со всеми сезонами';
    Icon = Clapperboard;
  } else if (mode === 'anime') {
    title = 'Аниме и Мультфильмы';
    subtitle = 'Анимационные шедевры, японские сериалы и культовые фильмы';
    Icon = Sparkles;
  } else {
    // Collections mode
    title = 'Тематические Подборки';
    subtitle = 'Коллекции фильмов и сериалов, отсортированные по жанрам и настроению';
    Icon = Grid;
  }

  // Load batch function (50 items per call)
  const loadBatch = useCallback(async (pageNum: number, isInitial = false) => {
    setIsLoadingMore(true);
    try {
      if (mode === 'collections') {
        const currentCat = categoriesList[selectedCategoryIndex];
        const initialList = currentCat?.items || data?.popular || [];
        const limit = 50;
        const startIndex = (pageNum - 1) * limit;
        const slice = initialList.slice(startIndex, startIndex + limit);

        if (isInitial) {
          setItems(slice);
        } else {
          setItems(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const newSlice = slice.filter(i => !existingIds.has(i.id));
            return [...prev, ...newSlice];
          });
        }
        setTotalItems(initialList.length);
        setHasMore(startIndex + limit < initialList.length);
        setPage(pageNum);
      } else {
        const res = await api.getCatalogItems({
          page: pageNum,
          limit: 50,
          type: mode
        });

        if (isInitial) {
          setItems(res.items);
        } else {
          setItems(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const newItems = res.items.filter(i => !existingIds.has(i.id));
            return [...prev, ...newItems];
          });
        }
        setTotalItems(res.total);
        setHasMore(res.hasMore);
        setPage(pageNum);
      }
    } catch (err) {
      console.warn('Failed to fetch paginated catalog batch:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [mode, selectedCategoryIndex, categoriesList, data?.popular]);

  // Initial fetch when mode or selected collection changes
  useEffect(() => {
    setPage(1);
    loadBatch(1, true);
  }, [mode, selectedCategoryIndex, loadBatch]);

  // Infinite Scroll Observer for auto-loading when reaching bottom
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadBatch(page + 1);
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, page, loadBatch]);

  return (
    <div className="pb-16 pt-4 text-[#e6e3df]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-[#e6e3df]/10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#d4b581]/15 border border-[#d4b581]/30 flex items-center justify-center text-[#d4b581] shrink-0 shadow-lg">
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#f5f3ef]">
              {title}
            </h1>
            <p className="font-serif-body italic text-[#e6e3df]/60 text-sm sm:text-base mt-1">
              {subtitle}
            </p>
          </div>
        </div>
      </div>


      {/* Collection Categories Filter (only in 'collections' mode) */}
      {mode === 'collections' && categoriesList.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4 font-mono-code text-sm text-[#d4b581] uppercase tracking-wider font-semibold">
            <Filter className="w-4 h-4" /> Выберите коллекцию:
          </div>
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-3">
            {categoriesList.map((cat: any, idx: number) => {
              const tabId = `cat-tab-${idx}`;
              const isSelected = selectedCategoryIndex === idx;
              const itemCount = cat.items?.length || 0;
              return (
                <CategoryFilterBtn
                  key={cat.id || tabId}
                  id={tabId}
                  name={cat.name}
                  itemCount={itemCount}
                  isSelected={isSelected}
                  onSelect={() => setSelectedCategoryIndex(idx)}
                  left={idx > 0 ? `cat-tab-${idx - 1}` : 'sidebar-collections'}
                  right={idx < categoriesList.length - 1 ? `cat-tab-${idx + 1}` : undefined}
                  down="cat-item-0"
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Content Grid */}
      {items.length === 0 && !isLoadingMore ? (
        <div className="p-16 bg-[#0f0e0d] border border-[#e6e3df]/15 rounded-3xl text-center space-y-4 max-w-xl mx-auto shadow-2xl">
          <p className="font-serif-body italic text-[#e6e3df]/70 text-lg">
            В данной категории пока нет релизов.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-9">
            {items.map((item, idx) => {
              const cardId = `cat-item-${idx}`;
              const cols = 4;
              const col = idx % cols;
              const row = Math.floor(idx / cols);

              const isFirstCol = col === 0;
              const isLastCol = col === cols - 1;

              return (
                <ContentPoster
                  key={cardId}
                  id={cardId}
                  item={item}
                  onSelect={onSelectContent}
                  widthClass="w-full"
                  alignOrigin={isFirstCol ? 'left' : isLastCol ? 'right' : 'center'}
                  leftTarget={col === 0 ? 'sidebar-trending' : `cat-item-${idx - 1}`}
                  rightTarget={col < cols - 1 && idx < items.length - 1 ? `cat-item-${idx + 1}` : undefined}
                  upTarget={row > 0 ? `cat-item-${idx - cols}` : 'sidebar-trending'}
                  downTarget={idx + cols < items.length ? `cat-item-${idx + cols}` : 'cat-load-more-btn'}
                />
              );
            })}
          </div>

          {/* Load More Button & Intersection Sentinel */}
          {hasMore && (
            <div className="text-center pt-8">
              <LoadMoreBtn
                id="cat-load-more-btn"
                isLoading={isLoadingMore}
                onLoadMore={() => loadBatch(page + 1)}
                upTarget={`cat-item-${items.length - 1}`}
              />
              <div ref={sentinelRef} className="h-10 w-full" />
            </div>
          )}
        </>
      )}
    </div>
  );
};
