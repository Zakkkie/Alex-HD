import React from 'react';
import { HistoryItem, ContentItem } from '../types';
import { Clock, Play, Trash2 } from 'lucide-react';
import { useTVNavigation } from '../navigation/useTVNavigation';

interface HistoryPageProps {
  history: HistoryItem[];
  onPlay: (item: ContentItem) => void;
  onClearHistory?: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ history, onPlay, onClearHistory }) => {
  return (
    <div className="pb-16 pt-4 text-[#e6e3df]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pb-8 border-b border-[#e6e3df]/15">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#d4b581]/15 border border-[#d4b581]/40 flex items-center justify-center text-[#d4b581] shrink-0 shadow-lg">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-serif-display text-4xl sm:text-5xl font-bold tracking-tight text-[#f5f3ef]">История просмотров</h1>
            <p className="font-mono-code text-sm text-[#d4b581] uppercase tracking-wider mt-1.5 font-semibold">
              СИНХРОНИЗИРОВАНО С ОБЛАКОМ (TV SYNC ACTIVE)
            </p>
          </div>
        </div>

        {history.length > 0 && onClearHistory && (
          <ClearHistoryBtn onClear={onClearHistory} />
        )}
      </div>

      {history.length === 0 ? (
        <div className="p-16 bg-[#0f0e0d] border border-[#e6e3df]/15 rounded-3xl text-center space-y-4 max-w-xl mx-auto shadow-2xl">
          <p className="font-serif-body italic text-[#e6e3df]/80 text-lg">История просмотров пуста.</p>
          <p className="font-mono-code text-xs sm:text-sm text-[#e6e3df]/50">
            Начните просмотр фильма или сериала, и ваш прогресс автоматически сохранится.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {history.map((hist, idx) => {
            const cardId = `history-item-${idx}`;
            return (
              <HistoryCard
                key={cardId}
                id={cardId}
                item={hist}
                onPlay={() => onPlay(hist.content)}
                up={idx < 3 ? 'sidebar-history' : `history-item-${idx - 3}`}
                down={`history-item-${idx + 3}`}
                left={idx % 3 > 0 ? `history-item-${idx - 1}` : 'sidebar-history'}
                right={idx % 3 < 2 && idx < history.length - 1 ? `history-item-${idx + 1}` : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

const ClearHistoryBtn: React.FC<{ onClear: () => void }> = ({ onClear }) => {
  const { ref, isFocused } = useTVNavigation({
    id: 'history-clear-btn',
    left: 'history-item-0',
    onEnter: onClear
  });

  return (
    <button
      ref={ref}
      tabIndex={0}
      onClick={onClear}
      className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-mono-code text-xs sm:text-sm uppercase tracking-wider transition-all outline-none border cursor-pointer font-bold select-none ${
        isFocused
          ? 'bg-[#d4b581] text-black border-[#d4b581] scale-105 shadow-[0_0_20px_rgba(212,181,129,0.5)]'
          : 'bg-[#e6e3df]/5 text-[#e6e3df]/70 border-[#e6e3df]/15 hover:bg-[#e6e3df]/15 hover:text-white'
      }`}
    >
      <Trash2 className="w-5 h-5" />
      Очистить историю
    </button>
  );
};

const HistoryCard: React.FC<{
  id: string;
  item: HistoryItem;
  onPlay: () => void;
  up?: string;
  down?: string;
  left?: string;
  right?: string;
}> = ({ id, item, onPlay, up, down, left, right }) => {
  const { ref, isFocused } = useTVNavigation({
    id,
    up,
    down,
    left,
    right,
    onEnter: onPlay
  });

  const minutes = Math.floor(item.position_seconds / 60);

  return (
    <div
      ref={ref}
      tabIndex={0}
      onClick={onPlay}
      className={`bg-[#121110] border border-[#e6e3df]/15 rounded-3xl p-5 cursor-pointer transition-all duration-200 outline-none flex gap-5 select-none ${
        isFocused
          ? 'scale-105 z-10 border-[#d4b581] shadow-[0_0_30px_rgba(212,181,129,0.4)] bg-[#d4b581]/15 ring-2 ring-[#d4b581]'
          : 'hover:border-[#d4b581]/50 hover:bg-[#181715]'
      }`}
    >
      <div className="relative w-44 aspect-video overflow-hidden rounded-2xl bg-black shrink-0 border border-[#e6e3df]/15 shadow-md group">
        <img
          src={item.content.backdrop_url || item.content.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80'}
          alt={item.content.title}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80';
          }}
          className="w-full h-full object-cover filter brightness-90"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-[#d4b581] flex items-center justify-center text-black shadow-lg">
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </div>
        </div>
        {/* Hover / Focus dark description overlay */}
        <div
          className={`absolute inset-0 bg-[#0a0a09]/90 backdrop-blur-md p-2.5 flex flex-col justify-between transition-opacity duration-200 z-20 ${
            isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <p className="font-sans text-[10px] text-[#e6e3df]/90 line-clamp-3 leading-snug">
            {item.content.overview || 'Сохраненный прогресс просмотра.'}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-[#d4b581] font-mono-code font-bold uppercase">
            <span>Продолжить</span>
            <span>▶</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/80 z-30">
          <div className="h-full bg-[#d4b581]" style={{ width: `${item.percentage}%` }} />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <h4 className="font-serif-display font-bold text-lg text-[#f5f3ef] line-clamp-1">{item.content.title}</h4>
          <p className="font-serif-body text-xs sm:text-sm text-[#e6e3df]/70 mt-1">Остановились на {minutes} мин ({item.percentage}%)</p>
        </div>
        <span className="text-xs text-[#d4b581] font-mono-code font-bold uppercase tracking-wider flex items-center gap-1">
          ПРОДОЛЖИТЬ <span>▶</span>
        </span>
      </div>
    </div>
  );
};

