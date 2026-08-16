import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, RotateCcw, Film, Tv, Calendar, Star, SlidersHorizontal, ChevronDown, ChevronUp, Check, Keyboard } from 'lucide-react';
import { ContentItem } from '../types';
import { OnScreenKeyboard } from '../components/search/OnScreenKeyboard';
import { ContentPoster } from '../components/catalog/ContentPoster';
import { api } from '../api/client';
import { useTVNavigation } from '../navigation/useTVNavigation';

interface SearchPageProps {
  onSelectContent: (item: ContentItem) => void;
}

const GENRE_OPTIONS = [
  'Все жанры',
  'Фантастика',
  'Боевик',
  'Драма',
  'Комедия',
  'Приключения',
  'Триллер',
  'Ужасы',
  'Аниме',
  'Мультфильм',
  'Криминал',
  'Биография'
];

const YEAR_OPTIONS = [
  { id: 'all', label: 'Все годы' },
  { id: '2026', label: '2026' },
  { id: '2025', label: '2025' },
  { id: '2024', label: '2024' },
  { id: '2023', label: '2023' },
  { id: '2020-2022', label: '2020 - 2022' },
  { id: '2010-2019', label: '2010 - 2019' },
  { id: 'classic', label: 'До 2010 (Классика)' }
];

const TYPE_OPTIONS = [
  { id: 'all', label: 'Все типы' },
  { id: 'movie', label: 'Фильмы' },
  { id: 'series', label: 'Сериалы' },
  { id: 'cartoon', label: 'Мультфильмы' },
  { id: '4k', label: '4K Ultra HD' }
];

const SORT_OPTIONS = [
  { id: 'popular', label: 'По популярности' },
  { id: 'rating', label: 'По рейтингу' },
  { id: 'year_desc', label: 'Сначала новые' },
  { id: 'title', label: 'По названию (А-Я)' }
];

export const SearchPage: React.FC<SearchPageProps> = ({ onSelectContent }) => {
  const [query, setQuery] = useState<string>('');
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('Все жанры');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('popular');
  const [activeDropdown, setActiveDropdown] = useState<'type' | 'genre' | 'year' | 'sort' | null>(null);

  const [rawResults, setRawResults] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch from API on query change or initial load
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      api.search(query)
        .then(res => setRawResults(res))
        .catch(err => console.error('Search API error:', err))
        .finally(() => setIsLoading(false));
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Client side category filtering & sorting
  const filteredResults = useMemo(() => {
    let list = [...rawResults];

    // Filter by Type
    if (selectedType !== 'all') {
      if (selectedType === '4k') {
        list = list.filter(item => item.is_4k);
      } else {
        list = list.filter(item => item.type === selectedType);
      }
    }

    // Filter by Genre
    if (selectedGenre !== 'Все жанры') {
      const gLower = selectedGenre.toLowerCase();
      list = list.filter(item =>
        item.genres && item.genres.some(g => g.toLowerCase().includes(gLower))
      );
    }

    // Filter by Year
    if (selectedYear !== 'all') {
      if (selectedYear === '2026') list = list.filter(item => item.release_year === 2026);
      else if (selectedYear === '2025') list = list.filter(item => item.release_year === 2025);
      else if (selectedYear === '2024') list = list.filter(item => item.release_year === 2024);
      else if (selectedYear === '2023') list = list.filter(item => item.release_year === 2023);
      else if (selectedYear === '2020-2022') list = list.filter(item => item.release_year >= 2020 && item.release_year <= 2022);
      else if (selectedYear === '2010-2019') list = list.filter(item => item.release_year >= 2010 && item.release_year <= 2019);
      else if (selectedYear === 'classic') list = list.filter(item => item.release_year < 2010);
    }

    // Sort
    if (selectedSort === 'popular') {
      list.sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
    } else if (selectedSort === 'rating') {
      list.sort((a, b) => (b.rating_imdb || b.rating_tmdb || 0) - (a.rating_imdb || a.rating_tmdb || 0));
    } else if (selectedSort === 'year_desc') {
      list.sort((a, b) => b.release_year - a.release_year);
    } else if (selectedSort === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    }

    return list;
  }, [rawResults, selectedType, selectedGenre, selectedYear, selectedSort]);

  const resetAllFilters = () => {
    setQuery('');
    setSelectedType('all');
    setSelectedGenre('Все жанры');
    setSelectedYear('all');
    setSelectedSort('popular');
  };

  const hasActiveFilters = query.trim().length > 0 || selectedType !== 'all' || selectedGenre !== 'Все жанры' || selectedYear !== 'all';

  const { ref: inputRef, isFocused: isInputFocused } = useTVNavigation({
    id: 'search-input-field',
    down: 'filter-header-type',
    left: 'sidebar-search'
  });

  return (
    <div className="pb-16 pt-2 text-[#e6e3df] space-y-6 animate-[fadeIn_0.2s_ease-out]">
      {/* Top Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e6e3df]/10 pb-4">
        <div>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold tracking-normal text-[#e6e3df] flex items-center gap-3">
            <Search className="w-8 h-8 text-[#d4b581]" />
            Поиск и Фильтры Категорий
          </h1>
          <p className="font-serif-body italic text-sm text-[#e6e3df]/50 mt-1">
            Ищите по названию или выбирайте контент по типу, жанрам и годам выпуска
          </p>
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetAllFilters}
            className="flex items-center gap-2 px-4 py-2 bg-[#d4b581]/10 text-[#d4b581] border border-[#d4b581]/30 hover:bg-[#d4b581]/20 transition rounded-full font-mono-code text-xs uppercase cursor-pointer self-start md:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Сбросить фильтры
          </button>
        )}
      </div>

      {/* 1. SEARCH INPUT FIELD (Elevated to top) */}
      <div
        ref={inputRef}
        tabIndex={0}
        className={`flex items-center gap-4 px-5 py-4 bg-[#0f0e0d] border transition-all duration-200 outline-none ${
          isInputFocused
            ? 'border-[#d4b581] shadow-[0_0_20px_rgba(212,181,129,0.3)] bg-[#d4b581]/5'
            : 'border-[#e6e3df]/10'
        }`}
      >
        <Search className={`w-6 h-6 transition-colors ${isInputFocused ? 'text-[#d4b581]' : 'text-[#e6e3df]/40'}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="Введите название фильма, сериала или аниме для мгновенного поиска..."
          className="w-full bg-transparent font-serif-body text-xl text-[#e6e3df] placeholder-[#e6e3df]/30 outline-none"
        />
        <button
          onClick={() => setShowVirtualKeyboard(!showVirtualKeyboard)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider border transition-colors outline-none focus:ring-2 focus:ring-[#d4b581]/50 ${
            showVirtualKeyboard ? 'bg-[#d4b581] text-black border-[#d4b581]' : 'bg-transparent text-[#e6e3df]/60 border-[#e6e3df]/20 hover:text-[#e6e3df] hover:border-[#e6e3df]/60'
          }`}
          title="Экранная клавиатура для пульта ТВ"
        >
          <Keyboard className="w-4 h-4" /> Клавиатура ТВ
        </button>
        {query.length > 0 && (
          <button
            onClick={() => setQuery('')}
            className="p-2 bg-white/5 hover:bg-white/10 text-[#e6e3df]/60 hover:text-[#e6e3df] rounded-xl transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Virtual On-Screen Keyboard for TV / Remote Control */}
      {showVirtualKeyboard && (
        <div className="flex justify-center p-4 bg-[#121110] border border-[#d4b581]/30 rounded-3xl shadow-2xl animate-[fadeIn_0.15s_ease-out]">
          <OnScreenKeyboard
            value={query}
            onChange={(val) => setQuery(val)}
            onClear={() => setQuery('')}
          />
        </div>
      )}

      {/* 2. CATEGORY FILTERS PANEL (Sleek Collapsible Dropdowns with scrollable options) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="font-mono-code text-xs uppercase tracking-widest text-[#d4b581] font-semibold flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#d4b581]" />
            Фильтры Категорий
          </span>
          <span className="font-mono-code text-[11px] text-[#e6e3df]/40">
            Найдено релизов: <strong className="text-[#d4b581]">{filteredResults.length}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 z-40 relative">
          {/* Dropdown 1: TYPE */}
          <div className="relative">
            <button
              id="filter-header-type"
              onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
              className={`w-full flex items-center justify-between px-4 py-3 bg-[#0f0e0d] border transition-all duration-200 outline-none cursor-pointer ${
                activeDropdown === 'type' ? 'border-[#d4b581] bg-[#d4b581]/5 text-[#d4b581]' : 'border-[#e6e3df]/10 text-[#e6e3df]/80 hover:border-[#e6e3df]/30'
              }`}
            >
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] uppercase font-mono-code text-[#e6e3df]/40 tracking-wider">1. Тип контента</span>
                <span className="font-serif-body text-sm font-semibold text-[#e6e3df]">{TYPE_OPTIONS.find(o => o.id === selectedType)?.label}</span>
              </div>
              {activeDropdown === 'type' ? <ChevronUp className="w-4 h-4 text-[#d4b581]" /> : <ChevronDown className="w-4 h-4 text-[#e6e3df]/40" />}
            </button>
            
            {activeDropdown === 'type' && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0e0d] border border-[#d4b581]/30 shadow-2xl z-50 max-h-56 overflow-y-auto no-scrollbar py-1">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSelectedType(opt.id);
                      setActiveDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs font-mono-code transition hover:bg-[#d4b581]/10 ${
                      selectedType === opt.id ? 'text-[#d4b581] bg-[#d4b581]/5 font-bold' : 'text-[#e6e3df]/70 hover:text-[#e6e3df]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedType === opt.id && <Check className="w-3.5 h-3.5 text-[#d4b581]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown 2: GENRE */}
          <div className="relative">
            <button
              id="filter-header-genre"
              onClick={() => setActiveDropdown(activeDropdown === 'genre' ? null : 'genre')}
              className={`w-full flex items-center justify-between px-4 py-3 bg-[#0f0e0d] border transition-all duration-200 outline-none cursor-pointer ${
                activeDropdown === 'genre' ? 'border-[#d4b581] bg-[#d4b581]/5 text-[#d4b581]' : 'border-[#e6e3df]/10 text-[#e6e3df]/80 hover:border-[#e6e3df]/30'
              }`}
            >
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] uppercase font-mono-code text-[#e6e3df]/40 tracking-wider">2. Выберите жанр</span>
                <span className="font-serif-body text-sm font-semibold text-[#e6e3df]">{selectedGenre}</span>
              </div>
              {activeDropdown === 'genre' ? <ChevronUp className="w-4 h-4 text-[#d4b581]" /> : <ChevronDown className="w-4 h-4 text-[#e6e3df]/40" />}
            </button>
            
            {activeDropdown === 'genre' && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0e0d] border border-[#d4b581]/30 shadow-2xl z-50 max-h-56 overflow-y-auto no-scrollbar py-1">
                {GENRE_OPTIONS.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => {
                      setSelectedGenre(genre);
                      setActiveDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs font-mono-code transition hover:bg-[#d4b581]/10 ${
                      selectedGenre === genre ? 'text-[#d4b581] bg-[#d4b581]/5 font-bold' : 'text-[#e6e3df]/70 hover:text-[#e6e3df]'
                    }`}
                  >
                    <span>{genre}</span>
                    {selectedGenre === genre && <Check className="w-3.5 h-3.5 text-[#d4b581]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown 3: YEAR */}
          <div className="relative">
            <button
              id="filter-header-year"
              onClick={() => setActiveDropdown(activeDropdown === 'year' ? null : 'year')}
              className={`w-full flex items-center justify-between px-4 py-3 bg-[#0f0e0d] border transition-all duration-200 outline-none cursor-pointer ${
                activeDropdown === 'year' ? 'border-[#d4b581] bg-[#d4b581]/5 text-[#d4b581]' : 'border-[#e6e3df]/10 text-[#e6e3df]/80 hover:border-[#e6e3df]/30'
              }`}
            >
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] uppercase font-mono-code text-[#e6e3df]/40 tracking-wider">3. Год выпуска</span>
                <span className="font-serif-body text-sm font-semibold text-[#e6e3df]">{YEAR_OPTIONS.find(o => o.id === selectedYear)?.label}</span>
              </div>
              {activeDropdown === 'year' ? <ChevronUp className="w-4 h-4 text-[#d4b581]" /> : <ChevronDown className="w-4 h-4 text-[#e6e3df]/40" />}
            </button>
            
            {activeDropdown === 'year' && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0e0d] border border-[#d4b581]/30 shadow-2xl z-50 max-h-56 overflow-y-auto no-scrollbar py-1">
                {YEAR_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSelectedYear(opt.id);
                      setActiveDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs font-mono-code transition hover:bg-[#d4b581]/10 ${
                      selectedYear === opt.id ? 'text-[#d4b581] bg-[#d4b581]/5 font-bold' : 'text-[#e6e3df]/70 hover:text-[#e6e3df]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedYear === opt.id && <Check className="w-3.5 h-3.5 text-[#d4b581]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown 4: SORT */}
          <div className="relative">
            <button
              id="filter-header-sort"
              onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
              className={`w-full flex items-center justify-between px-4 py-3 bg-[#0f0e0d] border transition-all duration-200 outline-none cursor-pointer ${
                activeDropdown === 'sort' ? 'border-[#d4b581] bg-[#d4b581]/5 text-[#d4b581]' : 'border-[#e6e3df]/10 text-[#e6e3df]/80 hover:border-[#e6e3df]/30'
              }`}
            >
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] uppercase font-mono-code text-[#e6e3df]/40 tracking-wider">4. Сортировка</span>
                <span className="font-serif-body text-sm font-semibold text-[#e6e3df]">{SORT_OPTIONS.find(o => o.id === selectedSort)?.label}</span>
              </div>
              {activeDropdown === 'sort' ? <ChevronUp className="w-4 h-4 text-[#d4b581]" /> : <ChevronDown className="w-4 h-4 text-[#e6e3df]/40" />}
            </button>
            
            {activeDropdown === 'sort' && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0e0d] border border-[#d4b581]/30 shadow-2xl z-50 max-h-56 overflow-y-auto no-scrollbar py-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSelectedSort(opt.id);
                      setActiveDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs font-mono-code transition hover:bg-[#d4b581]/10 ${
                      selectedSort === opt.id ? 'text-[#d4b581] bg-[#d4b581]/5 font-bold' : 'text-[#e6e3df]/70 hover:text-[#e6e3df]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedSort === opt.id && <Check className="w-3.5 h-3.5 text-[#d4b581]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. RESULTS GRID (Even lower) */}
      <div className="pt-2">
        {isLoading && (
          <div className="p-12 text-center text-[#d4b581] font-mono-code text-sm uppercase tracking-widest animate-pulse">
            Поиск фильмов и сериалов...
          </div>
        )}

        {!isLoading && filteredResults.length === 0 && (
          <div className="p-12 bg-[#0f0e0d] border border-[#e6e3df]/10 text-center space-y-3">
            <p className="font-serif-body italic text-[#e6e3df]/60 text-lg">
              По выбранным критериям и запросу ничего не найдено.
            </p>
            <p className="font-mono-code text-xs text-[#e6e3df]/40">
              Попробуйте изменить название или сбросить фильтры категории.
            </p>
            <button
              onClick={resetAllFilters}
              className="px-6 py-2 bg-[#d4b581] text-black font-mono-code text-xs font-semibold uppercase tracking-wider transition hover:bg-[#e2c694]"
            >
              Сбросить параметры
            </button>
          </div>
        )}

        {!isLoading && filteredResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-9">
            {filteredResults.map((item, idx) => {
              const cardId = `search-card-${idx}`;
              const cols = 4;
              const col = idx % cols;
              const row = Math.floor(idx / cols);

              const isFirstCol = col === 0;
              const isLastCol = col === cols - 1;

              return (
                <ContentPoster
                  key={item.id + '-' + idx}
                  id={cardId}
                  item={item}
                  onSelect={onSelectContent}
                  widthClass="w-full"
                  alignOrigin={isFirstCol ? 'left' : isLastCol ? 'right' : 'center'}
                  leftTarget={col === 0 ? 'sidebar-search' : `search-card-${idx - 1}`}
                  rightTarget={col < cols - 1 && idx < filteredResults.length - 1 ? `search-card-${idx + 1}` : undefined}
                  upTarget={row > 0 ? `search-card-${idx - cols}` : 'filter-header-type'}
                  downTarget={`search-card-${idx + cols}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const FilterChip: React.FC<{
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ id, label, isActive, onClick }) => {
  const { ref, isFocused } = useTVNavigation({
    id,
    onEnter: onClick
  });

  return (
    <button
      ref={ref}
      tabIndex={0}
      onClick={onClick}
      className={`px-4 py-2 rounded-2xl font-mono-code text-xs sm:text-sm uppercase tracking-wider transition-all outline-none border cursor-pointer select-none ${
        isFocused
          ? 'bg-[#d4b581] text-black scale-105 shadow-[0_0_15px_rgba(212,181,129,0.5)] border-[#d4b581] font-bold z-10'
          : isActive
          ? 'bg-[#d4b581]/25 text-[#d4b581] border-[#d4b581]/60 font-semibold'
          : 'bg-[#e6e3df]/5 text-[#e6e3df]/70 border-[#e6e3df]/15 hover:bg-[#e6e3df]/10'
      }`}
    >
      {label}
    </button>
  );
};
