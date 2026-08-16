import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Star,
  Film,
  Calendar,
  Award,
  ArrowUpDown,
  MapPin,
  Clapperboard,
  Sparkles,
  ExternalLink,
  Play
} from 'lucide-react';
import { PersonDetails, PersonCredit, ContentItem } from '../../types';
import { normalizeKey } from '../../navigation/keycodes';
import { ContentPoster } from '../catalog/ContentPoster';

interface PersonModalProps {
  person: PersonDetails | null;
  isLoading: boolean;
  onClose: () => void;
  onSelectCredit: (credit: PersonCredit | ContentItem) => void;
}

type SortMode = 'year-desc' | 'year-asc' | 'rating-desc' | 'popularity';

export const PersonModal: React.FC<PersonModalProps> = ({
  person,
  isLoading,
  onClose,
  onSelectCredit
}) => {
  const [sortMode, setSortMode] = useState<SortMode>('year-desc');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'series'>('all');
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const action = normalizeKey(e.keyCode, e.key);
      if (action === 'ACT_BACK' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown' || action === 'NAV_DOWN') {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollBy({ top: 160, behavior: 'smooth' });
        }
      } else if (e.key === 'ArrowUp' || action === 'NAV_UP') {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollBy({ top: -160, behavior: 'smooth' });
        }
      } else if (e.key === 'PageDown') {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollBy({ top: 400, behavior: 'smooth' });
        }
      } else if (e.key === 'PageUp') {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollBy({ top: -400, behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const sortedAndFilteredCredits = useMemo(() => {
    if (!person || !person.credits) return [];

    let list = [...person.credits];

    // Filter by type
    if (filterType !== 'all') {
      list = list.filter((c) => c.type === filterType);
    }

    // Sort
    list.sort((a, b) => {
      if (sortMode === 'year-desc') {
        return (b.release_year || 0) - (a.release_year || 0);
      }
      if (sortMode === 'year-asc') {
        return (a.release_year || 0) - (b.release_year || 0);
      }
      if (sortMode === 'rating-desc') {
        return (b.rating_imdb || 0) - (a.rating_imdb || 0);
      }
      // default: year desc
      return (b.release_year || 0) - (a.release_year || 0);
    });

    return list;
  }, [person, sortMode, filterType]);

  if (!person && !isLoading) return null;

  return createPortal(
    <div
      ref={scrollContainerRef}
      className="fixed inset-0 bg-[#070606]/95 backdrop-blur-2xl z-[9999] p-4 sm:p-8 md:p-12 animate-[fadeIn_0.15s_ease-out] overflow-y-auto overflow-x-hidden scroll-smooth"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-w-7xl mx-auto w-full flex flex-col space-y-6 pb-16">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-[#f5f3ef]/10 pb-4 mb-6 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#d4b581]" />
            <span className="font-mono-code text-xs uppercase tracking-widest text-[#d4b581] font-semibold">
              Интерактивная фильмография TMDB & TVDB
            </span>
          </div>
          <button
            onClick={onClose}
            tabIndex={0}
            className="flex items-center gap-2 px-4 py-2 bg-[#f5f3ef]/5 hover:bg-[#d4b581] hover:text-black text-[#f5f3ef] border border-[#f5f3ef]/15 rounded-xl transition-all font-mono-code text-xs uppercase font-semibold cursor-pointer outline-none focus:border-[#d4b581] focus:bg-[#d4b581] focus:text-black"
          >
            <X className="w-4 h-4" />
            Закрыть
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-2 border-[#d4b581] border-t-transparent rounded-full animate-spin" />
            <p className="font-mono-code text-xs text-[#d4b581] tracking-widest uppercase animate-pulse">
              Синхронизация профиля и фильмографии с TMDB...
            </p>
          </div>
        ) : person ? (
          <div className="flex flex-col space-y-8">
            {/* Person Profile Hero */}
            <div className="bg-[#121110] border border-[#f5f3ef]/10 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:gap-8 shadow-2xl shrink-0">
              {/* Person Face Photo */}
              <div className="relative group shrink-0 mx-auto md:mx-0">
                <img
                  src={person.profile_url}
                  alt={person.name}
                  className="w-36 h-52 sm:w-48 sm:h-64 md:w-56 md:h-76 rounded-2xl object-cover border-2 border-[#d4b581]/50 shadow-[0_0_35px_rgba(212,181,129,0.35)]"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Person Bio & Details */}
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-3 flex-wrap font-mono-code">
                    <span className="px-3 py-1 bg-[#d4b581] text-black font-bold text-xs sm:text-sm rounded-lg uppercase tracking-wider">
                      {person.known_for_department || 'Кинематограф'}
                    </span>
                    {person.birthday && (
                      <span className="flex items-center gap-1.5 text-xs sm:text-sm text-[#f5f3ef]/80 bg-[#f5f3ef]/5 px-3 py-1 rounded-lg border border-[#f5f3ef]/10">
                        <Calendar className="w-4 h-4 text-[#d4b581]" />
                        {person.birthday} {person.deathday ? `— ${person.deathday}` : ''}
                      </span>
                    )}
                    {person.place_of_birth && (
                      <span className="flex items-center gap-1.5 text-xs sm:text-sm text-[#f5f3ef]/80 bg-[#f5f3ef]/5 px-3 py-1 rounded-lg border border-[#f5f3ef]/10">
                        <MapPin className="w-4 h-4 text-[#d4b581]" />
                        {person.place_of_birth}
                      </span>
                    )}
                    <span className="text-xs sm:text-sm font-mono-code text-[#d4b581] bg-[#d4b581]/15 px-3 py-1 rounded-lg border border-[#d4b581]/30 font-bold">
                      {person.credits.length} РАБОТ
                    </span>
                  </div>

                  <h1 className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-bold text-[#f5f3ef] tracking-tight">
                    {person.name}
                  </h1>
                  {person.original_name && person.original_name !== person.name && (
                    <p className="font-serif-display italic text-lg sm:text-xl text-[#d4b581]/80 mt-1">
                      {person.original_name}
                    </p>
                  )}

                  <p className="font-sans text-base sm:text-lg text-[#f5f3ef]/85 leading-relaxed mt-3">
                    {person.biography || 'Биография пока не добавлена в международную фильмотеку.'}
                  </p>
                </div>

                {/* Sorting & Filter Controls */}
                <div className="flex items-center justify-between flex-wrap gap-4 pt-3 border-t border-[#f5f3ef]/10">
                  {/* Media Type Filter */}
                  <div className="flex items-center gap-1.5 bg-[#f5f3ef]/5 p-1 rounded-xl border border-[#f5f3ef]/10 font-mono-code text-xs sm:text-sm">
                    <button
                      onClick={() => setFilterType('all')}
                      className={`px-4 py-2 rounded-lg transition-all cursor-pointer font-bold ${
                        filterType === 'all'
                          ? 'bg-[#d4b581] text-black shadow'
                          : 'text-[#f5f3ef]/70 hover:text-[#f5f3ef]'
                      }`}
                    >
                      Все ({person.credits.length})
                    </button>
                    <button
                      onClick={() => setFilterType('movie')}
                      className={`px-4 py-2 rounded-lg transition-all cursor-pointer font-bold ${
                        filterType === 'movie'
                          ? 'bg-[#d4b581] text-black shadow'
                          : 'text-[#f5f3ef]/70 hover:text-[#f5f3ef]'
                      }`}
                    >
                      Фильмы ({person.credits.filter((c) => c.type === 'movie').length})
                    </button>
                    <button
                      onClick={() => setFilterType('series')}
                      className={`px-4 py-2 rounded-lg transition-all cursor-pointer font-bold ${
                        filterType === 'series'
                          ? 'bg-[#d4b581] text-black shadow'
                          : 'text-[#f5f3ef]/70 hover:text-[#f5f3ef]'
                      }`}
                    >
                      Сериалы ({person.credits.filter((c) => c.type === 'series').length})
                    </button>
                  </div>

                  {/* Sort Mode Selectors */}
                  <div className="flex items-center gap-2 font-mono-code text-xs sm:text-sm">
                    <span className="text-[#f5f3ef]/60 flex items-center gap-1.5 font-semibold">
                      <ArrowUpDown className="w-4 h-4 text-[#d4b581]" />
                      Сортировка:
                    </span>
                    <div className="flex items-center gap-1 bg-[#f5f3ef]/5 p-1 rounded-xl border border-[#f5f3ef]/10">
                      <button
                        onClick={() => setSortMode('year-desc')}
                        className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                          sortMode === 'year-desc'
                            ? 'bg-[#d4b581] text-black shadow'
                            : 'text-[#f5f3ef]/70 hover:text-[#f5f3ef]'
                        }`}
                      >
                        Сначала новые ↓
                      </button>
                      <button
                        onClick={() => setSortMode('year-asc')}
                        className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                          sortMode === 'year-asc'
                            ? 'bg-[#d4b581] text-black shadow'
                            : 'text-[#f5f3ef]/70 hover:text-[#f5f3ef]'
                        }`}
                      >
                        Сначала старые ↑
                      </button>
                      <button
                        onClick={() => setSortMode('rating-desc')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                          sortMode === 'rating-desc'
                            ? 'bg-[#d4b581] text-black shadow'
                            : 'text-[#f5f3ef]/70 hover:text-[#f5f3ef]'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        По рейтингу
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filmography Work Grid / Row */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#f5f3ef] flex items-center gap-3">
                  <Clapperboard className="w-6 h-6 text-[#d4b581]" />
                  Фильмография ({sortedAndFilteredCredits.length})
                </h3>
                <span className="font-mono-code text-xs sm:text-sm text-[#d4b581] uppercase tracking-widest font-semibold">
                  Нажмите на фильм для просмотра
                </span>
              </div>

              {sortedAndFilteredCredits.length > 0 ? (
                <div className="pb-12">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {sortedAndFilteredCredits.map((credit, idx) => {
                    const asContentItem: ContentItem = {
                      id: credit.id,
                      tmdb_id: credit.tmdb_id,
                      type: credit.type,
                      title: credit.title,
                      original_title: credit.original_title,
                      release_year: credit.release_year,
                      age_rating: '16+',
                      rating_imdb: credit.rating_imdb,
                      rating_tmdb: credit.rating_imdb,
                      runtime_minutes: credit.type === 'movie' ? 120 : 45,
                      overview: credit.overview || '',
                      poster_url: credit.poster_url,
                      backdrop_url: credit.backdrop_url,
                      is_4k: true,
                      is_published: true,
                      play_count: 5000,
                      director: credit.job === 'Режиссер' ? person.name : undefined
                    };

                    return (
                      <div
                        key={`${credit.id}-${idx}`}
                        tabIndex={0}
                        onFocus={(e) => {
                          e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }}
                        onClick={() => {
                          onClose();
                          onSelectCredit(asContentItem);
                        }}
                        className="group relative flex flex-col bg-[#121110] border border-[#f5f3ef]/10 hover:border-[#d4b581] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.03] shadow-lg outline-none focus:border-[#d4b581] focus:ring-2 focus:ring-[#d4b581]/50"
                      >
                        <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                          <img
                            src={credit.poster_url || credit.backdrop_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80'}
                            alt={credit.title}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80';
                            }}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                            {credit.rating_imdb > 0 && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded text-[11px] font-bold text-amber-300 border border-amber-500/30">
                                <Star className="w-3 h-3 fill-amber-300" />
                                {credit.rating_imdb}
                              </span>
                            )}
                          </div>
                          <div className="absolute top-2 right-2 z-10">
                            <span className="px-2 py-0.5 bg-[#d4b581] text-black font-bold text-[10px] rounded uppercase font-mono-code">
                              {credit.type === 'series' ? 'СЕРИАЛ' : 'ФИЛЬМ'}
                            </span>
                          </div>
                          {/* Dark semi-transparent short description overlay on hover or focus */}
                          <div className="absolute inset-0 bg-[#0a0a09]/90 backdrop-blur-md p-3.5 flex flex-col justify-between opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 z-20">
                            <div className="space-y-1.5 overflow-hidden">
                              <div className="flex items-center justify-between text-[10px] font-mono-code text-[#d4b581]">
                                <span>{credit.release_year > 0 ? credit.release_year : 'Скоро'}</span>
                                {credit.rating_imdb > 0 && (
                                  <span className="flex items-center gap-1 text-amber-300 font-bold">
                                    ★ {credit.rating_imdb}
                                  </span>
                                )}
                              </div>
                              <h5 className="font-serif-display font-bold text-xs text-[#f5f3ef] line-clamp-1">
                                {credit.title}
                              </h5>
                              <p className="font-sans text-[11px] text-[#e6e3df]/85 line-clamp-3 leading-snug">
                                {credit.overview || (credit.character ? `Роль: ${credit.character}` : 'Краткая информация о проекте доступна при переходе.')}
                              </p>
                            </div>

                            <div className="w-full flex items-center justify-center gap-2 py-1.5 bg-[#d4b581] text-black rounded-lg font-bold text-xs shrink-0 shadow-lg">
                              <Play className="w-3.5 h-3.5 fill-black" />
                              Открыть
                            </div>
                          </div>
                        </div>

                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-serif-display text-sm font-bold text-[#f5f3ef] line-clamp-1 group-hover:text-[#d4b581] transition-colors">
                              {credit.title}
                            </h4>
                            {credit.character && (
                              <p className="font-mono-code text-[11px] text-[#f5f3ef]/60 truncate mt-0.5">
                                в роли: <span className="text-[#d4b581]">{credit.character}</span>
                              </p>
                            )}
                            {credit.job && !credit.character && (
                              <p className="font-mono-code text-[11px] text-[#d4b581] truncate mt-0.5">
                                {credit.job}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#f5f3ef]/5 font-mono-code text-[11px] text-[#f5f3ef]/40">
                            <span>{credit.release_year > 0 ? `${credit.release_year} г.` : 'Скоро'}</span>
                            <span className="text-[10px] uppercase text-[#d4b581]/70">4K UHD</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#f5f3ef]/40 font-mono-code">
                <Film className="w-12 h-12 text-[#f5f3ef]/20 mb-2" />
                <p>Фильмы по выбранным критериям не найдены.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
      </div>
    </div>,
    document.body
  );
};
