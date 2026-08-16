import React, { useState } from 'react';
import { HomePayload, ContentItem } from '../types';
import { ContentPoster } from '../components/catalog/ContentPoster';
import { TrendingUp, Grid, Tv, Filter } from 'lucide-react';
import { useTVNavigation } from '../navigation/useTVNavigation';

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

interface CategoryPageProps {
  mode: 'trending' | 'collections' | '4k';
  data: HomePayload;
  onSelectContent: (item: ContentItem) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  mode,
  data,
  onSelectContent
}) => {
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  // Safely resolve categories / collections list
  const categoriesList = (data as any)?.categories || data?.collections || [];

  const allItems = (data as any)?.all || [
    ...(data?.trending24h || []),
    ...(data?.newReleases || []),
    ...(data?.fourKCollection || [])
  ];

  // Derive items based on mode
  let title = '';
  let subtitle = '';
  let Icon = TrendingUp;
  let itemsToDisplay: ContentItem[] = [];

  if (mode === 'trending') {
    title = 'Сейчас смотрят (Тренды)';
    subtitle = 'Топ популярных релизов за последние 24 часа';
    Icon = TrendingUp;
    itemsToDisplay = data?.trending24h || allItems;
  } else if (mode === '4k') {
    title = '4K Ultra HDR Каталог';
    subtitle = 'Высокобитрейтные релизы в максимальном разрешении 2160p Dolby Vision';
    Icon = Tv;
    itemsToDisplay = (data?.fourKCollection && data.fourKCollection.length > 0)
      ? data.fourKCollection
      : allItems.filter((item) => item?.is_4k);
  } else {
    // Collections mode
    title = 'Тематические Подборки';
    subtitle = 'Коллекции фильмов и сериалов, отсортированные по жанрам и настроению';
    Icon = Grid;
    const currentCategory = categoriesList[selectedCategoryIndex];
    itemsToDisplay = currentCategory?.items || allItems;
  }

  return (
    <div className="pb-16 pt-4 text-[#e6e3df]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-[#e6e3df]/15">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#d4b581]/15 border border-[#d4b581]/40 flex items-center justify-center text-[#d4b581] shrink-0 shadow-lg">
            <Icon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#f5f3ef]">
              {title}
            </h1>
            <p className="font-serif-body italic text-[#e6e3df]/70 text-base sm:text-lg mt-2">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="font-mono-code text-sm sm:text-base text-[#d4b581] bg-[#d4b581]/15 px-5 py-2.5 rounded-xl border border-[#d4b581]/35 self-start md:self-auto uppercase tracking-wider font-bold shadow-md">
          НАЙДЕНО: {itemsToDisplay.length} РЕЛИЗОВ
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
      {itemsToDisplay.length === 0 ? (
        <div className="p-16 bg-[#0f0e0d] border border-[#e6e3df]/15 rounded-3xl text-center space-y-4 max-w-xl mx-auto shadow-2xl">
          <p className="font-serif-body italic text-[#e6e3df]/70 text-lg">
            В данной категории пока нет релизов.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-9">
          {itemsToDisplay.map((item, idx) => {
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
                rightTarget={col < cols - 1 && idx < itemsToDisplay.length - 1 ? `cat-item-${idx + 1}` : undefined}
                upTarget={row > 0 ? `cat-item-${idx - cols}` : 'sidebar-trending'}
                downTarget={`cat-item-${idx + cols}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
