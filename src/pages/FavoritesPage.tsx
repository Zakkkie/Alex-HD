import React from 'react';
import { ContentItem } from '../types';
import { ContentPoster } from '../components/catalog/ContentPoster';
import { Heart } from 'lucide-react';

interface FavoritesPageProps {
  favorites: ContentItem[];
  onSelectContent: (item: ContentItem) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({ favorites, onSelectContent }) => {
  return (
    <div className="pb-16 pt-4 text-[#e6e3df]">
      <div className="flex items-center gap-5 mb-10 pb-8 border-b border-[#e6e3df]/15">
        <div className="w-16 h-16 rounded-2xl bg-[#d4b581]/15 border border-[#d4b581]/40 flex items-center justify-center text-[#d4b581] shrink-0 shadow-lg">
          <Heart className="w-8 h-8 fill-[#d4b581]" />
        </div>
        <div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-bold tracking-tight text-[#f5f3ef]">Буду смотреть</h1>
          <p className="font-mono-code text-sm text-[#d4b581] uppercase tracking-wider mt-1.5 font-semibold">
            ЗАПЛАНИРОВАНО К ПРОСМОТРУ: {favorites.length}
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="p-16 bg-[#0f0e0d] border border-[#e6e3df]/15 rounded-3xl text-center space-y-4 max-w-xl mx-auto shadow-2xl">
          <p className="font-serif-body italic text-[#e6e3df]/80 text-lg">Ваш список запланированного пока пуст.</p>
          <p className="font-mono-code text-xs sm:text-sm text-[#e6e3df]/50">
            Сохраняйте фильмы и сериалы с помощью кнопки «Буду смотреть» на странице детального описания релиза.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-9">
          {favorites.map((item, idx) => {
            const cardId = `fav-item-${idx}`;
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
                leftTarget={col === 0 ? 'sidebar-favorites' : `fav-item-${idx - 1}`}
                rightTarget={col < cols - 1 && idx < favorites.length - 1 ? `fav-item-${idx + 1}` : undefined}
                upTarget={row > 0 ? `fav-item-${idx - cols}` : 'sidebar-favorites'}
                downTarget={`fav-item-${idx + cols}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

