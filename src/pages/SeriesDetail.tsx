import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Heart,
  Bookmark,
  Star,
  ArrowLeft,
  Tv,
  Film,
  Users,
  Image as ImageIcon,
  X,
  Volume2,
  CheckCircle2,
  Check,
  Eye,
  Settings,
  Radio,
  Download,
  Server,
  Zap,
  Layers,
  Globe,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { ContentItem, Season, Episode, PersonDetails } from '../types';
import { useTVNavigation } from '../navigation/useTVNavigation';
import { normalizeKey } from '../navigation/keycodes';
import { api } from '../api/client';
import { ContentPoster } from '../components/catalog/ContentPoster';
import { PersonModal } from '../components/catalog/PersonModal';
import { CastCarousel } from '../components/catalog/CastCarousel';
import { StillsCarousel } from '../components/catalog/StillsCarousel';

interface SeriesDetailProps {
  content: any;
  onPlayEpisode: (content: ContentItem, episode: Episode, season: Season, extraOpts?: { voiceover?: string; streamUrl?: string }) => void;
  onBack: () => void;
  onToggleFavorite: (id: string) => void;
  onToggleWatchlist: (id: string) => void;
  onSelectContent?: (item: ContentItem) => void;
}

const getStillsForContent = (item: any) => {
  if (item.stills && Array.isArray(item.stills) && item.stills.length > 0) {
    return item.stills;
  }
  const defaultStills = [
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1478720143022-9099477e643b?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80"
  ];
  const title = (item.title || "").toLowerCase();
  if (title.includes("титанов") || title.includes("titan")) {
    return [
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?auto=format&fit=crop&w=600&q=80"
    ];
  }
  if (title.includes("во все тяжкие") || title.includes("breaking bad")) {
    return [
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80"
    ];
  }
  if (title.includes("аркейн") || title.includes("arcane")) {
    return [
      "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"
    ];
  }
  return defaultStills;
};

const getCastForContent = (item: any) => {
  const defaultCast = [
    { name: "Леонардо Ди Каприо", role: "Главная роль", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" },
    { name: "Скарлетт Йоханссон", role: "Второстепенная роль", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" },
    { name: "Брэд Питт", role: "Главная роль", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" },
    { name: "Энн Хэтэуэй", role: "Главная роль", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80" }
  ];

  const title = (item.title || "").toLowerCase();
  if (title.includes("титанов") || title.includes("titan")) {
    return [
      { name: "Эрен Йегер", role: "Сейю: Юки Кадзи", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" },
      { name: "Микаса Аккерман", role: "Сейю: Юи Исикава", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" },
      { name: "Армин Арлерт", role: "Сейю: Марина Иноуэ", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80" },
      { name: "Леви Аккерман", role: "Сейю: Хироси Камия", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" }
    ];
  }
  if (title.includes("тяжкие") || title.includes("breaking bad")) {
    return [
      { name: "Брайан Крэнстон", role: "Уолтер Уайт", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" },
      { name: "Аарон Пол", role: "Джесси Пинкман", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" },
      { name: "Анна Ганн", role: "Скайлер Уайт", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" },
      { name: "Боб Оденкёрк", role: "Сол Гудман", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80" }
    ];
  }
  if (title.includes("аркейн") || title.includes("arcane")) {
    return [
      { name: "Вай (Vi)", role: "Сейю: Хейли Стайнфелд", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" },
      { name: "Джинкс (Jinx)", role: "Сейю: Элла Пернелл", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80" },
      { name: "Джейс (Jayce)", role: "Сейю: Кевин Алехандро", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" },
      { name: "Виктор (Viktor)", role: "Сейю: Гарри Ллойд", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" }
    ];
  }
  return defaultCast;
};

export const SeriesDetail: React.FC<SeriesDetailProps> = ({
  content: initialContent,
  onPlayEpisode,
  onBack,
  onToggleFavorite,
  onToggleWatchlist,
  onSelectContent
}) => {
  const [content, setFullContent] = useState<any>(initialContent);

  useEffect(() => {
    setFullContent(initialContent);
    api.getContentDetail(initialContent.id).then((enriched) => {
      if (enriched) {
        setFullContent((prev: any) => ({ ...prev, ...enriched }));
      }
    }).catch(err => {
      console.warn('Series detail hydration warning:', err);
    });
  }, [initialContent.id]);

  const seasons: Season[] = content.seasons || [];
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'episodes' | 'voiceovers' | 'torrserver'>('episodes');
  const [expandedEpisodeId, setExpandedEpisodeId] = useState<string | null>(null);
  const [showTorrServerSettings, setShowTorrServerSettings] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [expandedStill, setExpandedStill] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PersonDetails | null>(null);
  const [isPersonLoading, setIsPersonLoading] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(() => {
    const saved = localStorage.getItem(`user_rating_${content.id}`);
    return saved ? Number(saved) : null;
  });
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);

  // Watched episode status
  const [watchedEpisodes, setWatchedEpisodes] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (!content.id || !content.seasons) return initial;
    content.seasons.forEach((s: Season) => {
      s.episodes?.forEach((ep: Episode) => {
        const key = `watched_ep_${content.id}_s${s.season_number}_e${ep.episode_number}`;
        if (localStorage.getItem(key) === 'true') {
          initial[key] = true;
        }
      });
    });
    return initial;
  });

  const toggleEpisodeWatched = (seasonNum: number, epNum: number) => {
    const key = `watched_ep_${content.id}_s${seasonNum}_e${epNum}`;
    const nextVal = !watchedEpisodes[key];
    setWatchedEpisodes(prev => ({ ...prev, [key]: nextVal }));
    if (nextVal) {
      localStorage.setItem(key, 'true');
    } else {
      localStorage.removeItem(key);
    }
  };

  const markSeasonAllWatched = (seasonNum: number, episodesList: Episode[]) => {
    const next = { ...watchedEpisodes };
    episodesList.forEach(ep => {
      const key = `watched_ep_${content.id}_s${seasonNum}_e${ep.episode_number}`;
      next[key] = true;
      localStorage.setItem(key, 'true');
    });
    setWatchedEpisodes(next);
  };

  // Voiceover state
  const voiceoverOptions = [
    { id: 'hdrezka', name: 'HDRezka Studio', quality: '4K Ultra HD HDR10+', lang: 'Дублированный' },
    { id: 'lostfilm', name: 'LostFilm', quality: '1080p 60fps / Dolby 5.1', lang: 'Многоголосый' },
    { id: 'kubik', name: 'Кубик в Кубе', quality: '1080p Web-DL', lang: 'Профессиональный' },
    { id: 'alexfilm', name: 'AlexFilm', quality: '1080p 60fps', lang: 'Авторский' },
    { id: 'kinopoisk', name: 'Дубляж (Кинопоиск)', quality: '4K UHD Atmos', lang: 'Официальный дубляж' },
    { id: 'original', name: 'Оригинал + Субтитры', quality: '4K Uncompressed', lang: 'Английский + Ру Сбт' }
  ];

  const [selectedVoiceover, setSelectedVoiceover] = useState<string>(() => {
    return localStorage.getItem(`pref_voiceover_${content.id}`) || 'hdrezka';
  });

  const handleSelectVoiceover = (id: string) => {
    setSelectedVoiceover(id);
    localStorage.setItem(`pref_voiceover_${content.id}`, id);
  };

  // TorrServer state
  const [torrServerUrl, setTorrServerUrl] = useState<string>(() => {
    return localStorage.getItem('torrserver_host') || 'http://178.236.240.100:8090';
  });
  const [torrServerStatus, setTorrServerStatus] = useState<'online' | 'offline'>('online');

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
      setSelectedPerson({
        id: 0,
        name: personInfo.name,
        profile_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&q=80',
        biography: `Информация о кинематографисте ${personInfo.name} загружена из локального каталога сериалов.`,
        known_for_department: 'Актерское мастерство / Создание',
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

  // Find first unwatched episode, or fallback to first episode of first season
  const getNextEpisodeToWatch = () => {
    for (const s of seasons) {
      if (s.episodes) {
        for (const ep of s.episodes) {
          const key = `watched_ep_${content.id}_s${s.season_number}_e${ep.episode_number}`;
          if (!watchedEpisodes[key]) {
            return { episode: ep, season: s };
          }
        }
      }
    }
    const firstSeason = seasons[0];
    const firstEp = firstSeason?.episodes?.[0];
    return firstEp ? { episode: firstEp, season: firstSeason } : null;
  };

  const nextToWatch = getNextEpisodeToWatch();

  const handlePlayFirstEpisode = () => {
    const target = getNextEpisodeToWatch();
    if (!target) return;
    
    const { episode, season } = target;
    const defaultMagnet = `magnet:?xt=urn:btih:series_${content.id}_s${season.season_number}_e${episode.episode_number}_4k`;
    const streamUrl = `${torrServerUrl}/stream?link=${encodeURIComponent(defaultMagnet)}&index=${episode.episode_number}&play=true`;
    
    onPlayEpisode(content, episode, season, { voiceover: 'hdrezka', streamUrl });
  };

  const backNav = useTVNavigation({
    id: 'series-back-btn',
    right: 'series-play-btn',
    down: 'season-tab-0',
    onEnter: onBack,
    onBack: onBack
  });

  const playNav = useTVNavigation({
    id: 'series-play-btn',
    left: 'series-back-btn',
    right: 'series-trailer-btn',
    down: 'season-tab-0',
    onEnter: () => handlePlayFirstEpisode(),
    onBack: onBack
  });

  const trailerNav = useTVNavigation({
    id: 'series-trailer-btn',
    left: 'series-play-btn',
    right: 'series-fav-btn',
    down: 'season-tab-0',
    onEnter: () => setShowTrailer(true),
    onBack: onBack
  });

  const favNav = useTVNavigation({
    id: 'series-fav-btn',
    left: 'series-trailer-btn',
    down: 'season-tab-0',
    onEnter: () => onToggleFavorite(content.id),
    onBack: onBack
  });

  const activeSeason = seasons[selectedSeasonIdx] || seasons[0];
  const episodes = activeSeason?.episodes || [];

  const stills = getStillsForContent(content);
  const cast = getCastForContent(content);

  return (
    <div className="relative min-h-screen pb-16 pt-4 text-[#e6e3df]">
      {/* Back Button */}
      <button
        ref={backNav.ref}
        tabIndex={0}
        onClick={onBack}
        className={`flex items-center gap-2 px-6 py-3 font-mono-code text-xs uppercase tracking-widest mb-6 transition-all duration-200 outline-none select-none cursor-pointer border ${
          backNav.isFocused
            ? 'bg-[#d4b581] text-black scale-105 shadow-[0_0_15px_rgba(212,181,129,0.4)] border-[#d4b581] font-semibold'
            : 'bg-[#e6e3df]/5 text-[#e6e3df]/80 border-[#e6e3df]/20 hover:bg-[#e6e3df]/10'
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
        Назад в каталог
      </button>

      {/* Series Hero Section */}
      <div className="relative overflow-hidden bg-[#0c0b0a] border border-[#f5f3ef]/15 rounded-3xl p-8 sm:p-10 mb-12 flex flex-col md:flex-row gap-10 shadow-2xl">
        <img
          src={content.poster_url || content.backdrop_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80'}
          alt={content.title}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80';
          }}
          className="w-full max-w-[16rem] md:w-[17rem] object-cover shrink-0 shadow-2xl rounded-2xl border border-[#f5f3ef]/25 mx-auto md:mx-0"
        />
        <div className="space-y-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 font-mono-code mb-4 flex-wrap">
              <span className="px-3 py-1 bg-[#d4b581] text-black font-bold text-xs sm:text-sm uppercase tracking-wider rounded-lg">
                СЕРИАЛ 4K
              </span>
              <span className="flex items-center gap-1.5 text-amber-300 font-bold text-xs sm:text-sm bg-amber-500/15 px-3 py-1 rounded-lg border border-amber-500/30">
                <Star className="w-4 h-4 fill-amber-300" /> IMDb {content.rating_imdb || '8.5'}
              </span>
              <button
                onClick={() => setShowRatingModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#d4b581]/15 hover:bg-[#d4b581]/25 text-[#d4b581] font-bold text-xs sm:text-sm rounded-lg border border-[#d4b581]/40 transition cursor-pointer"
              >
                <Star className={`w-4 h-4 ${userRating ? 'fill-[#d4b581]' : ''}`} />
                {userRating ? `Моя оценка: ${userRating}/10` : 'Оценить'}
              </button>
              <span className="text-[#f5f3ef]/70 text-xs sm:text-sm font-semibold">{content.release_year} ГОД</span>
              <span className="text-[#d4b581] font-bold text-xs sm:text-sm bg-[#d4b581]/15 px-3 py-1 rounded-lg border border-[#d4b581]/30 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#d4b581]" />
                СТРАНА: {content.country || 'США / Франция'}
              </span>
              <span className="text-[#f5f3ef]/70 text-xs sm:text-sm font-semibold">• {seasons.length} СЕЗОНОВ</span>
            </div>

            <h1 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#f5f3ef]">{content.title}</h1>
            <p className="font-sans text-base sm:text-lg text-[#f5f3ef]/85 leading-relaxed max-w-3xl mt-4">{content.overview}</p>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-4 pt-5 border-t border-[#f5f3ef]/15 flex-wrap">
            <button
              ref={playNav.ref}
              onClick={handlePlayFirstEpisode}
              className={`flex items-center gap-2.5 px-8 py-3.5 bg-[#d4b581] text-black font-sans text-xs sm:text-sm font-bold uppercase tracking-wider rounded-2xl outline-none select-none border border-[#e5c999] cursor-pointer transition-[transform,background-color,border-color,box-shadow] duration-200 active:scale-95 active:translate-y-0.5 shadow-lg ${
                playNav.isFocused
                  ? 'scale-105 shadow-[0_0_25px_rgba(212,181,129,0.7)] bg-[#e5c999]'
                  : 'hover:bg-[#e2c694]'
              }`}
            >
              <Play className="w-5 h-5 fill-black" />
              {nextToWatch 
                ? (nextToWatch.episode.episode_number === 1 && nextToWatch.season.season_number === 1)
                  ? 'Смотреть' 
                  : `Продолжить S${nextToWatch.season.season_number}:E${nextToWatch.episode.episode_number}`
                : 'Смотреть'}
            </button>

            <button
              ref={trailerNav.ref}
              onClick={() => setShowTrailer(true)}
              className={`flex items-center gap-2.5 px-8 py-3.5 font-sans text-xs sm:text-sm font-bold uppercase tracking-wider rounded-2xl outline-none select-none border cursor-pointer transition-[transform,background-color,border-color,box-shadow] duration-200 active:scale-95 active:translate-y-0.5 ${
                trailerNav.isFocused
                  ? 'bg-[#d4b581]/20 text-[#d4b581] scale-105 border-[#d4b581] shadow-[0_0_20px_rgba(212,181,129,0.35)]'
                  : 'bg-[#f5f3ef]/5 text-[#f5f3ef] border-[#f5f3ef]/20 hover:bg-[#f5f3ef]/10'
              }`}
            >
              <Film className="w-5 h-5" />
              Трейлер
            </button>

            <button
              ref={favNav.ref}
              onClick={() => onToggleFavorite(content.id)}
              className={`flex items-center gap-2.5 px-6 py-3.5 font-sans text-xs sm:text-sm font-semibold uppercase tracking-wider rounded-2xl outline-none select-none border cursor-pointer transition-[transform,background-color,border-color,box-shadow] duration-200 active:scale-95 active:translate-y-0.5 ${
                favNav.isFocused
                  ? 'bg-[#d4b581]/25 text-[#d4b581] scale-105 border-[#d4b581] shadow-[0_0_20px_rgba(212,181,129,0.35)] font-bold'
                  : content.isFavorite
                  ? 'bg-[#d4b581]/20 text-[#d4b581] border-[#d4b581]/50 shadow-[0_0_15px_rgba(212,181,129,0.15)] font-semibold'
                  : 'bg-[#f5f3ef]/5 text-[#f5f3ef] border-[#f5f3ef]/20 hover:bg-[#f5f3ef]/10 hover:border-[#f5f3ef]/30'
              }`}
            >
              <Heart className={`w-5 h-5 transition-transform duration-300 ${content.isFavorite ? 'fill-[#d4b581] text-[#d4b581] scale-110 animate-pulse' : 'text-[#f5f3ef]/70'}`} />
              {content.isFavorite ? 'В избранном' : 'Буду смотреть'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Feature Navigation Tabs (Status / Control Indicators) */}
      <div className="mb-10 border-b border-[#f5f3ef]/15 pb-6">
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar">
          <div
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl font-mono-code text-xs sm:text-sm font-bold uppercase tracking-wider border bg-[#d4b581] text-black border-[#d4b581] shadow-[0_0_20px_rgba(212,181,129,0.4)] select-none"
          >
            <Tv className="w-4 h-4" />
            Сезоны и серии
          </div>

          <button
            onClick={() => {
              const currentIdx = voiceoverOptions.findIndex(v => v.id === selectedVoiceover);
              const nextIdx = (currentIdx + 1) % voiceoverOptions.length;
              setSelectedVoiceover(voiceoverOptions[nextIdx].id);
            }}
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl font-mono-code text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border bg-[#f5f3ef]/5 text-[#f5f3ef]/80 border-[#f5f3ef]/15 hover:bg-[#f5f3ef]/10 hover:text-white cursor-pointer active:scale-95"
          >
            <Volume2 className="w-4 h-4" />
            Варианты озвучек
            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] border border-amber-500/30">
              {voiceoverOptions.find(v => v.id === selectedVoiceover)?.name || 'HDRezka'}
            </span>
          </button>

          <button
            onClick={() => setShowTorrServerSettings(!showTorrServerSettings)}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-mono-code text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border cursor-pointer active:scale-95 ${
              showTorrServerSettings
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-[#f5f3ef]/5 text-[#f5f3ef]/80 border-[#f5f3ef]/15 hover:bg-[#f5f3ef]/10 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            TorrServer & Настройки
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>

        {/* Toggled TorrServer Host Settings Configuration Row */}
        {showTorrServerSettings && (
          <div className="mt-5 bg-[#141312] border border-[#f5f3ef]/10 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4 animate-[fadeIn_0.15s_ease-out]">
            <div className="flex items-center gap-3 font-mono-code text-xs text-[#f5f3ef]/80 flex-wrap">
              <Settings className="w-4 h-4 text-[#d4b581]" />
              <span>Адрес сервера TorrServer:</span>
              <input
                type="text"
                value={torrServerUrl}
                onChange={(e) => {
                  setTorrServerUrl(e.target.value);
                  localStorage.setItem('torrserver_host', e.target.value);
                }}
                className="bg-black/60 border border-[#f5f3ef]/25 rounded-xl px-4 py-2 text-[#d4b581] font-bold focus:outline-none focus:border-[#d4b581] min-w-[200px]"
                placeholder="http://localhost:8090"
              />
            </div>
            <div className="font-mono-code text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Авто-подключение TorrServer активно
            </div>
          </div>
        )}
      </div>

      {/* UNIFIED EPISODES SECTION */}
      <div className="space-y-8">
        {/* Season Selector Tabs */}
        {seasons.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#e6e3df]">Выбор сезона:</h3>
              <button
                onClick={() => markSeasonAllWatched(activeSeason.season_number, episodes)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-mono-code text-xs uppercase font-bold rounded-xl border border-emerald-500/30 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Отметить весь сезон как просмотренный
              </button>
            </div>

            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-3">
              {seasons.map((s, idx) => {
                const tabId = `season-tab-${idx}`;
                return (
                  <SeasonTab
                    key={tabId}
                    id={tabId}
                    seasonNumber={s.season_number}
                    isSelected={idx === selectedSeasonIdx}
                    onSelect={() => setSelectedSeasonIdx(idx)}
                    left={idx > 0 ? `season-tab-${idx - 1}` : 'series-back-btn'}
                    right={idx < seasons.length - 1 ? `season-tab-${idx + 1}` : undefined}
                    down={`ep-card-${idx}-0`}
                    up="series-back-btn"
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Episodes List Container */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#e6e3df] flex items-center gap-3">
              <Tv className="w-6 h-6 text-[#d4b581]" />
              Список серий ({episodes.length}):
            </h3>
            <span className="font-mono-code text-xs text-[#d4b581]">
              Текущая озвучка по умолчанию: {voiceoverOptions.find(v => v.id === selectedVoiceover)?.name}
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {episodes.map((ep, epIdx) => {
              const epId = `ep-card-${selectedSeasonIdx}-${epIdx}`;
              const watchedKey = `watched_ep_${content.id}_s${activeSeason.season_number}_e${ep.episode_number}`;
              const isWatched = !!watchedEpisodes[watchedKey];

              return (
                <EpisodeCard
                  key={epId}
                  id={epId}
                  episode={ep}
                  isWatched={isWatched}
                  activeVoiceover={voiceoverOptions.find(v => v.id === selectedVoiceover)?.name}
                  onToggleWatched={() => toggleEpisodeWatched(activeSeason.season_number, ep.episode_number)}
                  isExpanded={expandedEpisodeId === ep.id}
                  onToggleExpand={() => setExpandedEpisodeId(expandedEpisodeId === ep.id ? null : ep.id)}
                  torrServerUrl={torrServerUrl}
                  onPlayStream={(voiceoverId, streamUrl) => onPlayEpisode(content, ep, activeSeason, { voiceover: voiceoverId, streamUrl })}
                  up={epIdx === 0 ? `season-tab-${selectedSeasonIdx}` : `ep-card-${selectedSeasonIdx}-${epIdx - 1}`}
                  down={`ep-card-${selectedSeasonIdx}-${epIdx + 1}`}
                  left="sidebar-home"
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Horizontal Carousels for Cast and Stills */}
      <CastCarousel
        cast={cast}
        onPersonClick={handlePersonClick}
        title="Актеры и Сейю"
      />

      <StillsCarousel
        stills={stills}
        title="Кадры из сериала"
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
                <span>1:04 / 2:30</span>
              </div>
              
              <div className="w-full h-1 bg-white/20 relative cursor-pointer group rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 bg-[#d4b581]" style={{ width: '42%' }} />
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
                  Оцените сериал
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

      {/* Global Person Profile & Filmography Modal (Actors / Directors / Seiyuu) */}
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

const SeasonTab: React.FC<{
  id: string;
  seasonNumber: number;
  isSelected: boolean;
  onSelect: () => void;
  left?: string;
  right?: string;
  up?: string;
  down?: string;
}> = ({ id, seasonNumber, isSelected, onSelect, left, right, up, down }) => {
  const { ref, isFocused } = useTVNavigation({
    id,
    left,
    right,
    up,
    down,
    onEnter: onSelect
  });

  return (
    <button
      ref={ref}
      tabIndex={0}
      onClick={onSelect}
      className={`px-8 py-3 rounded-2xl font-mono-code text-xs sm:text-sm uppercase tracking-wider transition-all duration-150 outline-none cursor-pointer border select-none font-bold ${
        isFocused
          ? 'bg-[#d4b581] text-black scale-105 shadow-[0_0_20px_rgba(212,181,129,0.5)] border-[#d4b581]'
          : isSelected
          ? 'bg-[#d4b581]/25 text-[#d4b581] border-[#d4b581]/60'
          : 'bg-[#e6e3df]/5 text-[#e6e3df]/60 border-[#e6e3df]/15 hover:bg-[#e6e3df]/10'
      }`}
    >
      Сезон {seasonNumber}
    </button>
  );
};

const EpisodeCard: React.FC<{
  id: string;
  episode: Episode;
  isWatched?: boolean;
  activeVoiceover?: string;
  onToggleWatched?: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  torrServerUrl: string;
  onPlayStream: (voiceoverId: string, streamUrl: string) => void;
  up?: string;
  down?: string;
  left?: string;
  right?: string;
}> = ({
  id,
  episode,
  isWatched,
  activeVoiceover,
  onToggleWatched,
  isExpanded,
  onToggleExpand,
  torrServerUrl,
  onPlayStream,
  up,
  down,
  left,
  right
}) => {
  const { ref, isFocused } = useTVNavigation({
    id,
    up,
    down: isExpanded ? `stream-${episode.id}-0` : down,
    left,
    right,
    onEnter: onToggleExpand
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Дата выхода неизвестна';
    try {
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          return `${parts[2]}.${parts[1]}.${parts[0]}`;
        }
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  const streamOptions = [
    {
      voiceover: 'HDRezka Studio',
      voiceoverId: 'hdrezka',
      quality: '4K Ultra HD • HEVC HDR10+',
      size: '2.4 ГБ',
      seeders: 140,
      leechers: 3,
      magnet: `magnet:?xt=urn:btih:series_ep_${episode.id}_4k`
    },
    {
      voiceover: 'LostFilm',
      voiceoverId: 'lostfilm',
      quality: '1080p Full HD • Dolby 5.1',
      size: '1.2 ГБ',
      seeders: 285,
      leechers: 8,
      magnet: `magnet:?xt=urn:btih:series_ep_${episode.id}_1080p`
    },
    {
      voiceover: 'Кубик в Кубе',
      voiceoverId: 'kubik',
      quality: '1080p WEB-DL • Stereo',
      size: '900 МБ',
      seeders: 195,
      leechers: 4,
      magnet: `magnet:?xt=urn:btih:series_ep_${episode.id}_kubik`
    },
    {
      voiceover: 'Дубляж Кинопоиск',
      voiceoverId: 'kinopoisk',
      quality: '4K UHD • Atmos 7.1',
      size: '2.6 ГБ',
      seeders: 98,
      leechers: 2,
      magnet: `magnet:?xt=urn:btih:series_ep_${episode.id}_kp`
    },
    {
      voiceover: 'Original + Subs',
      voiceoverId: 'original',
      quality: '4K Uncompressed • AC3',
      size: '3.5 ГБ',
      seeders: 110,
      leechers: 1,
      magnet: `magnet:?xt=urn:btih:series_ep_${episode.id}_orig`
    }
  ];

  return (
    <div
      ref={ref}
      tabIndex={0}
      onClick={onToggleExpand}
      className={`relative w-full bg-[#121110] border rounded-3xl p-6 cursor-pointer transition-all duration-200 outline-none flex flex-col select-none ${
        isFocused
          ? 'scale-[1.01] z-10 border-[#d4b581] shadow-[0_0_30px_rgba(212,181,129,0.3)] bg-[#d4b581]/10 ring-1 ring-[#d4b581]/40'
          : isWatched
          ? 'border-emerald-500/20 bg-[#0e1612]'
          : 'border-[#e6e3df]/10 hover:border-[#d4b581]/30 hover:bg-[#181715]'
      }`}
    >
      <div className="flex gap-6 items-start">
        {/* Thumbnail preview */}
        <div className="relative w-48 sm:w-56 aspect-video overflow-hidden rounded-2xl bg-black shrink-0 border border-[#e6e3df]/15 shadow-md">
          <img
            src={episode.still_url}
            alt={episode.title}
            className={`w-full h-full object-cover transition-all ${
              isWatched ? 'brightness-75 opacity-80' : 'brightness-90'
            }`}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-[#d4b581] flex items-center justify-center text-black shadow-lg transform hover:scale-105 transition-transform">
              <Play className="w-6 h-6 fill-black ml-0.5" />
            </div>
          </div>

          {/* Watched Badge overlay */}
          {isWatched && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-emerald-500/90 text-white font-mono-code font-bold text-[10px] uppercase flex items-center gap-1 shadow-md">
              <CheckCircle2 className="w-3 h-3" />
              Просмотрено
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-2.5 min-w-0">
                <span className="font-mono-code text-xs sm:text-sm text-[#d4b581] font-bold">
                  Серия {episode.episode_number}
                </span>
                <h4 className="font-serif-display font-bold text-lg sm:text-xl text-[#f5f3ef] line-clamp-1">
                  {episode.title}
                </h4>
              </div>

              {/* Watched & Expand Toggles */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleWatched) onToggleWatched();
                  }}
                  title={isWatched ? 'Отметить как непросмотренное' : 'Отметить как просмотренное'}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    isWatched
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <Check className={`w-4 h-4 ${isWatched ? 'stroke-[3]' : ''}`} />
                </button>

                <div
                  className={`p-2 rounded-xl border border-white/10 bg-white/5 text-white/70 transition-transform duration-300 ${
                    isExpanded ? 'rotate-180 text-[#d4b581] border-[#d4b581]/30' : ''
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Release Date & Runtime Metadata */}
            <div className="flex items-center gap-3 mt-1.5 font-mono-code text-[11px] sm:text-xs text-[#f5f3ef]/50">
              <span className="flex items-center gap-1 text-[#d4b581] font-medium">
                <Calendar className="w-3.5 h-3.5" />
                Выход: {formatDate(episode.air_date)}
              </span>
              <span>•</span>
              <span>{episode.runtime_minutes} мин</span>
              <span>•</span>
              <span className="px-1.5 py-0.2 bg-white/10 rounded uppercase tracking-wider text-[9px] font-bold">4K UHD</span>
            </div>

            <p className="font-serif-body text-xs sm:text-sm text-[#e6e3df]/70 line-clamp-2 mt-2 leading-relaxed">
              {episode.overview || 'Описание серии временно отсутствует.'}
            </p>
          </div>
        </div>
      </div>

      {/* STREAM CHOICE ACCORDION TRAY */}
      {isExpanded && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="mt-6 pt-5 border-t border-white/10 space-y-4 animate-[fadeIn_0.2s_ease-out]"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono-code text-xs uppercase tracking-wider text-[#d4b581] font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#d4b581] animate-pulse" />
              Выберите озвучку и поток для воспроизведения (TorrServer):
            </span>
            <span className="text-[10px] text-emerald-400 font-mono-code bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              TorrServer: Online
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {streamOptions.map((stream, sIdx) => {
              return (
                <StreamOptionButton
                  key={sIdx}
                  id={`stream-${episode.id}-${sIdx}`}
                  stream={stream}
                  episode={episode}
                  torrServerUrl={torrServerUrl}
                  onPlayStream={onPlayStream}
                  up={sIdx === 0 ? id : sIdx > 0 ? `stream-${episode.id}-${sIdx - 1}` : undefined}
                  down={sIdx < streamOptions.length - 1 ? `stream-${episode.id}-${sIdx + 1}` : down}
                  left={left}
                  right={right}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const StreamOptionButton: React.FC<{
  id: string;
  stream: any;
  episode: Episode;
  torrServerUrl: string;
  onPlayStream: (voiceoverId: string, streamUrl: string) => void;
  up?: string;
  down?: string;
  left?: string;
  right?: string;
}> = ({ id, stream, episode, torrServerUrl, onPlayStream, up, down, left, right }) => {
  const streamUrl = `${torrServerUrl}/stream?link=${encodeURIComponent(stream.magnet)}&index=${episode.episode_number}&play=true`;
  const { ref, isFocused } = useTVNavigation({
    id,
    up,
    down,
    left,
    right,
    onEnter: () => onPlayStream(stream.voiceoverId, streamUrl)
  });

  return (
    <button
      ref={ref}
      tabIndex={0}
      onClick={() => onPlayStream(stream.voiceoverId, streamUrl)}
      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 outline-none cursor-pointer gap-2 ${
        isFocused
          ? 'bg-[#d4b581] text-black scale-105 border-[#e5c999] shadow-[0_0_15px_rgba(212,181,129,0.55)]'
          : 'bg-[#181715] border-[#f5f3ef]/10 hover:border-[#d4b581]/50 hover:bg-[#201f1c]'
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <span className={`font-serif-display font-bold text-sm ${isFocused ? 'text-black' : 'text-[#f5f3ef]'}`}>
          {stream.voiceover}
        </span>
        <span className={`font-mono-code text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
          isFocused ? 'bg-black/10 text-black border border-black/20' : 'bg-[#d4b581]/10 text-[#d4b581] border border-[#d4b581]/20'
        }`}>
          {stream.size}
        </span>
      </div>

      <div className="flex items-center justify-between w-full text-[11px] font-mono-code opacity-80">
        <span>{stream.quality}</span>
        <span className="flex items-center gap-1">
          🔥 {stream.seeders} сид.
        </span>
      </div>
    </button>
  );
};
