import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, Heart, Bookmark, Star, ArrowLeft, Clock, ShieldCheck, Film, Users, Tv, Image as ImageIcon, X, Volume2, Clapperboard, Sparkles } from 'lucide-react';
import { ContentItem, PersonDetails } from '../types';
import { useTVNavigation } from '../navigation/useTVNavigation';
import { normalizeKey } from '../navigation/keycodes';
import { api } from '../api/client';
import { ContentPoster } from '../components/catalog/ContentPoster';
import { PersonModal } from '../components/catalog/PersonModal';
import { CastCarousel } from '../components/catalog/CastCarousel';
import { StillsCarousel } from '../components/catalog/StillsCarousel';

interface MovieDetailProps {
  content: any;
  onPlay: (item: ContentItem) => void;
  onBack: () => void;
  onToggleFavorite: (id: string) => void;
  onToggleWatchlist: (id: string) => void;
  onSelectContent?: (item: ContentItem) => void;
}

const getStillsForContent = (item: any) => {
  const defaultStills = [
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1478720143022-9099477e643b?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80"
  ];
  const title = (item.title || "").toLowerCase();
  if (title.includes("дюна") || title.includes("dune")) {
    return [
      "https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1509316975850-ff9c5edd0cd9?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=600&q=80"
    ];
  }
  if (title.includes("интерстеллар") || title.includes("interstellar")) {
    return [
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=600&q=80"
    ];
  }
  if (title.includes("киберпанк") || title.includes("cyberpunk") || title.includes("аркейн") || title.includes("arcane")) {
    return [
      "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"
    ];
  }
  if (title.includes("тяжкие") || title.includes("breaking bad") || title.includes("криминал") || title.includes("pulp fiction")) {
    return [
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80"
    ];
  }
  if (title.includes("матрица") || title.includes("matrix") || title.includes("оппенгеймер") || title.includes("oppenheimer")) {
    return [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80"
    ];
  }
  return defaultStills;
};

const getCastForContent = (item: any) => {
  // If item already has structured cast_members from TMDB
  if (item.cast_members && item.cast_members.length > 0) {
    return item.cast_members.map((c: any) => ({
      id: c.id,
      name: c.name,
      role: c.character || 'В ролях',
      avatar: c.profile_path || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    }));
  }

  const defaultCast = [
    { name: "Леонардо Ди Каприо", role: "Главная роль", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" },
    { name: "Скарлетт Йоханссон", role: "Второстепенная роль", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" },
    { name: "Брэд Питт", role: "Детектив", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" },
    { name: "Энн Хэтэуэй", role: "Главная роль", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80" }
  ];

  const title = (item.title || "").toLowerCase();
  if (title.includes("дюна") || title.includes("dune")) {
    return [
      { name: "Тимоти Шаламе", role: "Пол Атрейдес", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80" },
      { name: "Зендея", role: "Чани", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80" },
      { name: "Ребекка Фергюсон", role: "Леди Джессика", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" },
      { name: "Хавьер Бардем", role: "Стилгар", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" }
    ];
  }
  if (title.includes("интерстеллар") || title.includes("interstellar")) {
    return [
      { name: "Мэттью Макконахи", role: "Купер", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" },
      { name: "Энн Хэтэуэй", role: "Брэнд", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80" },
      { name: "Джессика Честейн", role: "Мёрф", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" },
      { name: "Майкл Кейн", role: "Профессор Брэнд", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" }
    ];
  }
  if (title.includes("оппенгеймер") || title.includes("oppenheimer")) {
    return [
      { name: "Киллиан Мерфи", role: "Роберт Оппенгеймер", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
      { name: "Эмили Блант", role: "Китти Оппенгеймер", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" },
      { name: "Роберт Дауни мл.", role: "Льюис Штраусс", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" },
      { name: "Флоренс Пью", role: "Джин Тэтлок", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" }
    ];
  }
  if (title.includes("унесённые") || title.includes("призраками")) {
    return [
      { name: "Тихиро", role: "Сейю: Руми Хираги", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" },
      { name: "Хаку", role: "Сейю: Мию Ирино", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80" },
      { name: "Безликий", role: "Сейю: Тацуя Гасюин", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
      { name: "Юбаба", role: "Сейю: Мари Нацуки", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" }
    ];
  }

  // If item has plain cast array of strings
  if (item.cast && item.cast.length > 0) {
    return item.cast.map((actorName: string, i: number) => ({
      name: actorName,
      role: 'В ролях',
      avatar: defaultCast[i % defaultCast.length].avatar
    }));
  }

  return defaultCast;
};

export const MovieDetail: React.FC<MovieDetailProps> = ({
  content,
  onPlay,
  onBack,
  onToggleFavorite,
  onToggleWatchlist,
  onSelectContent
}) => {
  const [showTrailer, setShowTrailer] = useState(false);
  const [expandedStill, setExpandedStill] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PersonDetails | null>(null);
  const [isPersonLoading, setIsPersonLoading] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(() => {
    const saved = localStorage.getItem(`user_rating_${content.id}`);
    return saved ? Number(saved) : null;
  });
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);

  useEffect(() => {
    if (!showTrailer && !showRatingModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const action = normalizeKey(e.keyCode, e.key);
      if (action === 'ACT_BACK' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (showRatingModal) setShowRatingModal(false);
        else if (showTrailer) setShowTrailer(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showTrailer, showRatingModal]);

  const handleSetRating = (score: number) => {
    setUserRating(score);
    localStorage.setItem(`user_rating_${content.id}`, score.toString());
    setShowRatingModal(false);
  };

  const handlePersonClick = async (personInfo: { id?: number | string; name: string }) => {
    setIsPersonLoading(true);
    setSelectedPerson(null);
    try {
      const data = await api.getPerson(personInfo.id || personInfo.name);
      setSelectedPerson(data);
    } catch (e) {
      console.error('Failed to load TMDB person details', e);
      // Fallback person object
      setSelectedPerson({
        id: 0,
        name: personInfo.name,
        profile_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&q=80',
        biography: `Информация о кинематографисте ${personInfo.name} загружена из локального каталога.`,
        known_for_department: 'Кинематограф',
        credits: [
          {
            id: content.id,
            tmdb_id: content.tmdb_id || 0,
            type: content.type,
            title: content.title,
            original_title: content.original_title,
            release_year: content.release_year,
            rating_imdb: content.rating_imdb,
            poster_url: content.poster_url,
            backdrop_url: content.backdrop_url,
            character: 'Участие в проекте',
            is_4k: true
          }
        ]
      });
    } finally {
      setIsPersonLoading(false);
    }
  };

  const backNav = useTVNavigation({
    id: 'detail-back-btn',
    right: 'detail-play-btn',
    down: 'detail-play-btn',
    onEnter: onBack,
    onBack: onBack
  });

  const playNav = useTVNavigation({
    id: 'detail-play-btn',
    left: 'detail-back-btn',
    right: 'detail-trailer-btn',
    up: 'detail-back-btn',
    onEnter: () => onPlay(content),
    onBack: onBack
  });

  const trailerNav = useTVNavigation({
    id: 'detail-trailer-btn',
    left: 'detail-play-btn',
    right: 'detail-fav-btn',
    up: 'detail-back-btn',
    onEnter: () => setShowTrailer(true),
    onBack: onBack
  });

  const favNav = useTVNavigation({
    id: 'detail-fav-btn',
    left: 'detail-trailer-btn',
    up: 'detail-back-btn',
    onEnter: () => onToggleFavorite(content.id),
    onBack: onBack
  });

  const hasResume = content.resume && content.resume.position_seconds > 10;
  const resumeMinutes = hasResume ? Math.floor(content.resume.position_seconds / 60) : 0;

  const stills = getStillsForContent(content);
  const cast = getCastForContent(content);

  return (
    <div className="relative min-h-screen pb-16 pt-4 text-slate-100">
      {/* Back button */}
      <button
        ref={backNav.ref}
        tabIndex={0}
        onClick={onBack}
        className={`flex items-center gap-2 px-6 py-3 font-mono-code text-xs uppercase tracking-widest mb-6 rounded-xl transition-all duration-200 outline-none select-none cursor-pointer border ${
          backNav.isFocused
            ? 'bg-[#d4b581] text-black scale-105 shadow-[0_0_15px_rgba(212,181,129,0.4)] border-[#d4b581] font-semibold'
            : 'bg-[#f5f3ef]/5 text-[#f5f3ef]/80 border-[#f5f3ef]/15 hover:bg-[#f5f3ef]/10'
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
        Назад в каталог
      </button>

      {/* Main Content Hero Card */}
      <div className="relative overflow-hidden bg-[#0f0e0d] border border-[#f5f3ef]/10 rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row gap-10 mb-8 shadow-2xl">
        {/* Backdrop overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={content.backdrop_url || content.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80'}
            alt={content.title}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80';
            }}
            className="w-full h-full object-cover opacity-20 filter sepia-[30%] blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0e0d] via-[#0f0e0d]/80 to-[#0f0e0d]/60" />
        </div>

        {/* Poster */}
        <div className="relative z-10 w-[18rem] shrink-0 overflow-hidden rounded-xl border border-[#f5f3ef]/20 shadow-2xl">
          <img
            src={content.poster_url || content.backdrop_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80'}
            alt={content.title}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80';
            }}
            className="w-full h-auto object-cover"
          />
          {hasResume && (
            <div className="p-3 bg-[#0f0e0d] border-t border-[#f5f3ef]/10 font-mono-code">
              <div className="flex justify-between text-[0.7rem] text-[#d4b581] font-medium mb-1">
                <span>ПРОГРЕСС</span>
                <span>{content.resume.percentage}%</span>
              </div>
              <div className="w-full h-[2px] bg-[#f5f3ef]/20 overflow-hidden">
                <div className="h-full bg-[#d4b581]" style={{ width: `${content.resume.percentage}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="relative z-10 flex-1 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2.5 mb-4 font-mono-code flex-wrap">
              {content.is_4k && (
                <span className="px-2.5 py-1 bg-[#d4b581] text-black font-bold text-xs rounded uppercase tracking-wider">
                  4K ULTRA HDR
                </span>
              )}
              <span className="px-2.5 py-1 bg-[#f5f3ef]/10 text-[#f5f3ef]/90 text-xs rounded border border-[#f5f3ef]/15 font-semibold">
                {content.age_rating || '16+'}
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 text-amber-300 font-bold text-xs rounded border border-amber-500/30">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                IMDb {content.rating_imdb || '8.2'}
              </span>
              <button
                onClick={() => setShowRatingModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#d4b581]/15 hover:bg-[#d4b581]/25 text-[#d4b581] font-bold text-xs rounded border border-[#d4b581]/40 transition cursor-pointer"
              >
                <Star className={`w-3.5 h-3.5 ${userRating ? 'fill-[#d4b581]' : ''}`} />
                {userRating ? `Моя оценка: ${userRating}/10` : 'Оценить'}
              </button>
              <span className="text-[#f5f3ef]/60 text-xs font-medium">
                {content.release_year} ГОД
              </span>
              <span className="text-[#d4b581] text-xs font-bold px-2 py-0.5 bg-[#d4b581]/15 rounded border border-[#d4b581]/30">
                • {content.country || 'США'}
              </span>
              {content.runtime_minutes && (
                <span className="text-[#f5f3ef]/60 text-xs font-medium">
                  • {content.runtime_minutes} МИН
                </span>
              )}
            </div>

            <h1 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-2 text-[#f5f3ef]">
              {content.title}
            </h1>
            {content.original_title && (
              <p className="font-serif-display italic text-lg sm:text-xl text-[#d4b581]/80 mb-4 font-normal">
                {content.original_title}
              </p>
            )}

            <p className="font-sans text-base sm:text-lg text-[#f5f3ef]/80 leading-relaxed mb-6 max-w-3xl">
              {content.overview}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#f5f3ef]/60 border-t border-[#f5f3ef]/10 pt-4 font-mono-code">
              <div>
                <span className="text-[#d4b581] font-semibold">РЕЖИССЕР: </span>
                {content.director && content.director !== 'Неизвестно' ? (
                  <button
                    onClick={() => handlePersonClick({ name: content.director })}
                    className="text-[#f5f3ef] hover:text-[#d4b581] underline underline-offset-4 cursor-pointer font-bold transition"
                  >
                    {content.director} ↗
                  </button>
                ) : (
                  'Не указан'
                )}
              </div>
              <div><span className="text-[#d4b581] font-semibold">ЖАНРЫ:</span> {content.genres ? content.genres.join(', ') : 'Не указаны'}</div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-4 flex-wrap pt-2">
            <button
              ref={playNav.ref}
              tabIndex={0}
              onClick={() => onPlay(content)}
              className={`flex items-center gap-2.5 px-8 py-3.5 bg-[#d4b581] text-black font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 outline-none select-none cursor-pointer border border-[#e5c999] shadow-lg ${
                playNav.isFocused
                  ? 'scale-105 shadow-[0_0_25px_rgba(212,181,129,0.7)] bg-[#e5c999]'
                  : 'hover:bg-[#e2c694]'
              }`}
            >
              <Play className="w-4 h-4 fill-black" />
              {hasResume ? `Продолжить (${resumeMinutes} мин)` : 'Смотреть в 4K'}
            </button>

            <button
              ref={trailerNav.ref}
              tabIndex={0}
              onClick={() => setShowTrailer(true)}
              className={`flex items-center gap-2 px-6 py-3.5 font-sans text-xs font-semibold uppercase tracking-wider rounded-xl transition-all duration-200 outline-none select-none cursor-pointer border ${
                trailerNav.isFocused
                  ? 'bg-[#d4b581] text-black scale-105 border-[#d4b581] shadow-[0_0_15px_rgba(212,181,129,0.3)] font-bold'
                  : 'bg-[#f5f3ef]/5 text-[#f5f3ef] border-[#f5f3ef]/15 hover:bg-[#f5f3ef]/10'
              }`}
            >
              <Film className="w-4 h-4" />
              Трейлер
            </button>

            <button
              ref={favNav.ref}
              tabIndex={0}
              onClick={() => onToggleFavorite(content.id)}
              className={`flex items-center gap-2.5 px-6 py-3.5 font-sans text-xs font-semibold uppercase tracking-wider rounded-xl outline-none select-none cursor-pointer border transition-[transform,background-color,border-color,box-shadow] duration-200 active:scale-95 active:translate-y-0.5 ${
                favNav.isFocused
                  ? 'bg-[#d4b581]/25 text-[#d4b581] scale-105 border-[#d4b581] shadow-[0_0_20px_rgba(212,181,129,0.35)] font-bold'
                  : content.isFavorite
                  ? 'bg-[#d4b581]/20 text-[#d4b581] border-[#d4b581]/50 shadow-[0_0_15px_rgba(212,181,129,0.15)] font-semibold'
                  : 'bg-[#f5f3ef]/5 text-[#f5f3ef] border-[#f5f3ef]/15 hover:bg-[#f5f3ef]/10 hover:border-[#f5f3ef]/25'
              }`}
            >
              <Heart className={`w-4 h-4 transition-transform duration-300 ${content.isFavorite ? 'fill-[#d4b581] text-[#d4b581] scale-110 animate-pulse' : 'text-[#f5f3ef]/70'}`} />
              {content.isFavorite ? 'В избранном' : 'Буду смотреть'}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Horizontal Carousels for Cast and Stills */}
      <CastCarousel
        director={content.director}
        cast={cast}
        onPersonClick={handlePersonClick}
        title="Актеры и создатели"
      />

      <StillsCarousel
        stills={stills}
        title="Кадры из фильма"
      />

      {/* Cinematic Full Screen Trailer Player Modal via Portal */}
      {showTrailer &&
        createPortal(
          <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[9999] flex flex-col justify-between p-4 sm:p-8 animate-[fadeIn_0.15s_ease-out]">
            {/* Top Bar controls */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="font-mono-code text-xs uppercase tracking-widest text-[#d4b581]">Официальный Трейлер в 4K Ultra HD</span>
                <h2 className="font-serif-display text-xl sm:text-2xl text-white mt-1">{content.title}</h2>
              </div>
              <button
                onClick={() => setShowTrailer(false)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-[#d4b581] hover:text-black text-white border border-white/15 rounded-xl transition font-mono-code text-xs uppercase cursor-pointer"
              >
                <X className="w-4 h-4" />
                Закрыть плеер
              </button>
            </div>

            {/* Simulated cinematic ambient video play with poster backdrop */}
            <div className="relative flex-1 my-6 bg-neutral-900 border border-white/5 rounded-2xl flex items-center justify-center overflow-hidden">
              <img
                src={content.backdrop_url || content.poster_url}
                alt="Backdrop"
                className="absolute inset-0 w-full h-full object-cover opacity-35 filter blur-xs"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              
              <div className="relative text-center z-10 space-y-4">
                <div className="inline-flex p-5 rounded-full bg-[#d4b581] text-black shadow-2xl animate-pulse">
                  <Play className="w-8 h-8 fill-black" />
                </div>
                <p className="font-mono-code text-xs tracking-widest text-white/60 uppercase">Запуск промо-трейлера...</p>
              </div>
            </div>

            {/* Bottom interactive progress and controller buttons */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 font-mono-code space-y-3">
              <div className="flex justify-between text-xs text-[#d4b581]">
                <span>ВОСПРОИЗВЕДЕНИЕ ТРЕЙЛЕРА</span>
                <span>0:45 / 2:18</span>
              </div>
              
              <div className="w-full h-1 bg-white/20 relative cursor-pointer group rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 bg-[#d4b581]" style={{ width: '32%' }} />
              </div>

              <div className="flex items-center justify-between text-xs text-white/50 pt-2">
                <div className="flex items-center gap-4">
                  <span className="text-[#d4b581]">● ДУБЛЯЖ [РУС]</span>
                  <span>DOLBY ATMOS 7.1</span>
                </div>
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#d4b581]" />
                  <span>ГРОМКОСТЬ: 80%</span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Interactive User Rating Modal */}
      {showRatingModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-[fadeIn_0.15s_ease-out]">
            <div className="bg-[#121110] border border-[#d4b581]/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="font-serif-display text-2xl font-bold text-white flex items-center gap-2">
                  <Star className="w-6 h-6 fill-[#d4b581] text-[#d4b581]" />
                  Оцените фильм
                </h3>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="font-sans text-sm text-[#e6e3df]/80">
                Ваша оценка помогает подбирать персональные рекомендации для вашего TV
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    onClick={() => handleSetRating(score)}
                    className={`w-11 h-11 rounded-2xl font-mono text-sm font-bold border transition-all cursor-pointer flex items-center justify-center ${
                      userRating === score
                        ? 'bg-[#d4b581] text-black border-[#d4b581] scale-110 shadow-[0_0_15px_rgba(212,181,129,0.5)]'
                        : 'bg-white/5 text-white border-white/15 hover:bg-[#d4b581]/20 hover:border-[#d4b581]'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>

              {userRating && (
                <p className="font-mono text-xs text-[#d4b581]">
                  Текущая сохраненная оценка: <strong className="text-white">{userRating}/10</strong>
                </p>
              )}

              <div className="pt-2">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-mono text-xs uppercase font-bold tracking-wider rounded-xl transition cursor-pointer"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Global Person Profile & Filmography Modal (Actors / Directors) */}
      {(selectedPerson || isPersonLoading) && (
        <PersonModal
          person={selectedPerson}
          isLoading={isPersonLoading}
          onClose={() => setSelectedPerson(null)}
          onSelectCredit={(credit) => {
            setSelectedPerson(null);
            if (onSelectContent) {
              onSelectContent(credit as ContentItem);
            }
          }}
        />
      )}
    </div>
  );
};
