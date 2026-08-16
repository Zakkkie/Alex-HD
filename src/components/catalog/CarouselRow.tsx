import React from 'react';
import { ContentPoster } from './ContentPoster';
import { ContentItem, WatchHistoryItem } from '../../types';

interface CarouselRowProps {
  rowIndex: number;
  title: string;
  items: (ContentItem | WatchHistoryItem)[];
  onSelect: (item: ContentItem) => void;
  upTarget?: string;
  downTarget?: string;
  leftTargetPrefix?: string;
}

export const CarouselRow: React.FC<CarouselRowProps> = ({
  rowIndex,
  title,
  items,
  onSelect,
  upTarget,
  downTarget,
  leftTargetPrefix = 'sidebar-home'
}) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-8 space-y-3.5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif-display text-xl sm:text-2xl md:text-3xl font-bold text-[#f5f3ef] tracking-tight flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d4b581] shadow-[0_0_10px_#d4b581]" />
          <span>{title}</span>
        </h2>
        <div className="flex-1 h-[1px] bg-gradient-to-r from-[#f5f3ef]/20 via-[#f5f3ef]/5 to-transparent hidden sm:block" />
        <span className="font-mono-code text-xs text-[#d4b581] bg-[#d4b581]/10 px-3 py-1 rounded-lg border border-[#d4b581]/25 uppercase tracking-widest hidden md:inline-block font-semibold">
          {items.length} РЕЛИЗОВ
        </span>
      </div>

      <div className="flex items-center gap-5 sm:gap-6 overflow-x-auto pb-5 pt-3 px-1 no-scrollbar scroll-smooth">
        {items.map((entry, colIndex) => {
          const item: ContentItem = (entry as WatchHistoryItem).content || (entry as ContentItem);
          const historyItem = (entry as WatchHistoryItem).position_seconds !== undefined ? (entry as WatchHistoryItem) : undefined;

          const itemId = `carousel-row-${rowIndex}-item-${colIndex}`;

          // Direction target calculation
          const leftTarget = colIndex === 0 ? leftTargetPrefix : `carousel-row-${rowIndex}-item-${colIndex - 1}`;
          const rightTarget = colIndex < items.length - 1 ? `carousel-row-${rowIndex}-item-${colIndex + 1}` : undefined;

          const progressPercent = historyItem
            ? Math.round((historyItem.position_seconds / historyItem.duration_seconds) * 100)
            : undefined;

          return (
            <ContentPoster
              key={itemId}
              id={itemId}
              item={item}
              onSelect={onSelect}
              progressPercent={progressPercent}
              isFirst={colIndex === 0}
              isLast={colIndex === items.length - 1}
              upTarget={upTarget || (rowIndex > 0 ? `carousel-row-${rowIndex - 1}-item-${Math.min(colIndex, 4)}` : 'hero-play-btn')}
              downTarget={downTarget || `carousel-row-${rowIndex + 1}-item-${Math.min(colIndex, 4)}`}
              leftTarget={leftTarget}
              rightTarget={rightTarget}
            />
          );
        })}
      </div>
    </div>
  );
};
