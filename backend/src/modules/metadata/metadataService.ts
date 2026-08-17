import { dbStore } from '../../db/store';
import { ContentItem, Season, Episode } from '../../../../src/types';

export const TMDB_GENRE_MAP: Record<number, string> = {
  28: 'Боевик',
  12: 'Приключения',
  16: 'Мультфильм',
  35: 'Комедия',
  80: 'Криминал',
  99: 'Документальный',
  18: 'Драма',
  10751: 'Семейный',
  14: 'Фэнтези',
  36: 'История',
  27: 'Ужасы',
  10402: 'Музыка',
  9648: 'Детектив',
  10749: 'Мелодрама',
  878: 'Фантастика',
  10770: 'Телефильм',
  53: 'Триллер',
  10752: 'Военный',
  37: 'Вестерн',
  10759: 'Боевик и Приключения',
  10762: 'Детский',
  10763: 'Новости',
  10764: 'Реалити-шоу',
  10765: 'Фантастика и Фэнтези',
  10766: 'Мыльная опера',
  10767: 'Ток-шоу',
  10768: 'Война и Политика'
};

/**
 * TMDB API Client (The Movie Database v3/v4 API)
 */
export class TMDBClient {
  public static get apiKey(): string {
    return process.env.TMDB_API_KEY || '4e44d9029b1270a757cddc766a1bcb63';
  }

  private static get baseUrl(): string {
    return 'https://api.themoviedb.org/3';
  }

  private static get imageBaseUrl(): string {
    return 'https://image.tmdb.org/t/p';
  }

  public static getImageUrl(path: string | null, size: 'w500' | 'w780' | 'original' = 'w500'): string {
    if (!path) {
      return 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&auto=format&fit=crop&q=80';
    }
    return `${this.imageBaseUrl}/${size}${path}`;
  }

  public static async fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
    const key = this.apiKey;
    if (!key) {
      throw new Error('TMDB_API_KEY_MISSING: Укажите TMDB_API_KEY в .env');
    }

    const queryParams = new URLSearchParams({
      api_key: key,
      language: 'ru-RU',
      ...params,
    });

    const url = `${this.baseUrl}${endpoint}?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`TMDB_API_ERROR: HTTP ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Search Movies on TMDB
   */
  static async searchMovies(query: string, page = 1) {
    if (!query.trim()) return { results: [], total_results: 0 };
    return await this.fetchTMDB('/search/movie', {
      query,
      page: page.toString(),
      include_adult: 'false',
    });
  }

  /**
   * Search TV Shows on TMDB
   */
  static async searchTVShows(query: string, page = 1) {
    if (!query.trim()) return { results: [], total_results: 0 };
    return await this.fetchTMDB('/search/tv', {
      query,
      page: page.toString(),
      include_adult: 'false',
    });
  }

  /**
   * Get Movie Details + Credits + Videos + Similar
   */
  static async getMovieDetails(tmdbId: number | string) {
    return await this.fetchTMDB(`/movie/${tmdbId}`, {
      append_to_response: 'credits,videos,similar,recommendations',
    });
  }

  /**
   * Get TV Series Details + Seasons + Credits + Videos
   */
  static async getTVDetails(tmdbId: number | string) {
    return await this.fetchTMDB(`/tv/${tmdbId}`, {
      append_to_response: 'credits,videos,similar,recommendations',
    });
  }

  /**
   * Get TV Season Episodes
   */
  static async getTVSeason(tmdbId: number | string, seasonNumber: number) {
    return await this.fetchTMDB(`/tv/${tmdbId}/season/${seasonNumber}`);
  }

  /**
   * Get Person Details + Combined Movie/TV Credits
   */
  static async getPersonDetails(personId: number | string) {
    return await this.fetchTMDB(`/person/${personId}`, {
      append_to_response: 'combined_credits',
    });
  }

  /**
   * Search Person on TMDB by Name
   */
  static async searchPerson(query: string) {
    if (!query.trim()) return { results: [] };
    return await this.fetchTMDB('/search/person', {
      query,
      include_adult: 'false',
    });
  }

  /**
   * Get Trending Movies/TV
   */
  static async getTrending(type: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'day', page = 1) {
    return await this.fetchTMDB(`/trending/${type}/${timeWindow}`, {
      page: page.toString()
    });
  }

  /**
   * Get Popular Movies
   */
  static async getPopularMovies(page = 1) {
    return await this.fetchTMDB('/movie/popular', { page: page.toString() });
  }

  /**
   * Get Top Rated Movies
   */
  static async getTopRatedMovies(page = 1) {
    return await this.fetchTMDB('/movie/top_rated', { page: page.toString() });
  }

  /**
   * Get Now Playing Movies
   */
  static async getNowPlayingMovies(page = 1) {
    return await this.fetchTMDB('/movie/now_playing', { page: page.toString() });
  }

  /**
   * Get Upcoming Movies
   */
  static async getUpcomingMovies(page = 1) {
    return await this.fetchTMDB('/movie/upcoming', { page: page.toString() });
  }

  /**
   * Get Popular TV Shows
   */
  static async getPopularTV(page = 1) {
    return await this.fetchTMDB('/tv/popular', { page: page.toString() });
  }

  /**
   * Get Top Rated TV Shows
   */
  static async getTopRatedTV(page = 1) {
    return await this.fetchTMDB('/tv/top_rated', { page: page.toString() });
  }

  /**
   * Discover movies or series by genre
   */
  static async discover(type: 'movie' | 'tv', genreId?: number, sortBy: string = 'popularity.desc', page = 1) {
    const params: Record<string, string> = {
      sort_by: sortBy,
      page: page.toString(),
      include_adult: 'false'
    };
    if (genreId) {
      params.with_genres = genreId.toString();
    }
    return await this.fetchTMDB(`/discover/${type}`, params);
  }

  /**
   * Convert TMDB raw data to application ContentItem
   */
  static convertToContentItem(data: any, type: 'movie' | 'series'): ContentItem {
    const isMovie = type === 'movie';
    const releaseDate = isMovie ? data.release_date : data.first_air_date;
    const releaseYear = releaseDate ? parseInt(releaseDate.split('-')[0], 10) : new Date().getFullYear();

    let genres: string[] = [];
    if (data.genres && Array.isArray(data.genres)) {
      genres = data.genres.map((g: any) => typeof g === 'string' ? g : g.name).filter(Boolean);
    } else if (data.genre_ids && Array.isArray(data.genre_ids)) {
      genres = data.genre_ids.map((id: number) => TMDB_GENRE_MAP[id]).filter(Boolean);
    }
    if (genres.length === 0) {
      genres = [isMovie ? 'Кино' : 'Сериал'];
    }

    let director = 'Неизвестно';
    let directorPhoto: string | undefined = undefined;
    let directorId: number | string | undefined = undefined;
    const crew_members: any[] = [];
    if (data.credits && data.credits.crew) {
      const directorObj = data.credits.crew.find((c: any) => c.job === 'Director');
      if (directorObj) {
        director = directorObj.name;
        directorId = directorObj.id;
        if (directorObj.profile_path) {
          directorPhoto = this.getImageUrl(directorObj.profile_path, 'w500');
        }
      }
      
      data.credits.crew.slice(0, 8).forEach((c: any) => {
        crew_members.push({
          id: c.id,
          name: c.name,
          job: c.job,
          department: c.department,
          profile_path: c.profile_path ? this.getImageUrl(c.profile_path, 'w500') : null
        });
      });
    } else if (data.created_by && Array.isArray(data.created_by) && data.created_by.length > 0) {
      director = data.created_by.map((c: any) => c.name).join(', ');
      directorId = data.created_by[0]?.id;
      if (data.created_by[0]?.profile_path) {
        directorPhoto = this.getImageUrl(data.created_by[0].profile_path, 'w500');
      }
    }

    const cast = data.credits && data.credits.cast
      ? data.credits.cast.slice(0, 10).map((c: any) => c.name)
      : [];

    const cast_members = data.credits && data.credits.cast
      ? data.credits.cast.slice(0, 15).map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character || 'Роль',
          profile_path: c.profile_path ? this.getImageUrl(c.profile_path, 'w500') : null,
          order: c.order
        }))
      : [];

    let stills: string[] = [];
    if (data.images && data.images.backdrops && Array.isArray(data.images.backdrops) && data.images.backdrops.length > 0) {
      stills = data.images.backdrops.slice(0, 10).map((b: any) => this.getImageUrl(b.file_path, 'w780'));
    } else if (data.backdrop_path) {
      stills = [this.getImageUrl(data.backdrop_path, 'w780')];
    }

    let trailer_url: string | undefined = undefined;
    if (data.videos && data.videos.results && Array.isArray(data.videos.results)) {
      const trailerObj = data.videos.results.find((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
      if (trailerObj?.key) {
        trailer_url = `https://www.youtube.com/embed/${trailerObj.key}?autoplay=1`;
      }
    }

    let similar: ContentItem[] = [];
    if (data.similar && data.similar.results && Array.isArray(data.similar.results)) {
      similar = data.similar.results.slice(0, 8).map((sim: any) => this.convertToContentItem(sim, type));
    } else if (data.recommendations && data.recommendations.results && Array.isArray(data.recommendations.results)) {
      similar = data.recommendations.results.slice(0, 8).map((rec: any) => this.convertToContentItem(rec, type));
    }

    const rawRating = data.vote_average || 7.5;
    const cleanRating = Math.round(rawRating * 10) / 10;

    return {
      id: `tmdb-${type}-${data.id}`,
      tmdb_id: data.id,
      type,
      title: (isMovie ? data.title : data.name) || 'Без названия',
      original_title: (isMovie ? data.original_title : data.original_name) || '',
      release_year: releaseYear,
      age_rating: data.adult ? '18+' : '12+',
      rating_imdb: cleanRating,
      rating_tmdb: cleanRating,
      runtime_minutes: isMovie ? (data.runtime || 120) : (data.episode_run_time?.[0] || 45),
      overview: data.overview || 'Описание фильма загружено из базы TMDB.',
      poster_url: this.getImageUrl(data.poster_path, 'w500'),
      backdrop_url: this.getImageUrl(data.backdrop_path || data.poster_path, 'w780'),
      is_4k: true,
      is_published: true,
      play_count: Math.floor(Math.random() * 8000) + 500,
      genres,
      director,
      directorPhoto,
      directorId,
      cast,
      cast_members,
      crew_members,
      stills: stills.length > 0 ? stills : undefined,
      trailer_url,
      similar: similar.length > 0 ? similar : undefined,
    };
  }
}

/**
 * TVDB API Client (TheTVDB v4 API)
 */
export class TVDBClient {
  private static token: string | null = null;
  private static tokenExpiresAt: number = 0;

  private static get apiKey(): string {
    return process.env.TVDB_API_KEY || '';
  }

  private static get baseUrl(): string {
    return 'https://api4.thetvdb.com/v4';
  }

  /**
   * Authenticate with TVDB API v4
   */
  private static async authenticate(): Promise<string> {
    const key = this.apiKey;
    if (!key) {
      throw new Error('TVDB_API_KEY_MISSING: Укажите TVDB_API_KEY в .env');
    }

    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey: key,
        pin: process.env.TVDB_PIN || undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`TVDB_AUTH_ERROR: HTTP ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.data?.token) {
      throw new Error('TVDB_AUTH_FAILED: Не удалось получить токен авторизации');
    }

    this.token = data.data.token;
    // Expire in 23 hours
    this.tokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000;
    return this.token;
  }

  private static async fetchTVDB(endpoint: string, params: Record<string, string> = {}) {
    const authToken = await this.authenticate();
    const queryParams = new URLSearchParams(params);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    const response = await fetch(`${this.baseUrl}${endpoint}${queryString}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`TVDB_API_ERROR: HTTP ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Search movies or series on TVDB
   */
  static async search(query: string, type?: 'movie' | 'series') {
    if (!query.trim()) return { data: [] };
    const params: Record<string, string> = { query };
    if (type) params.type = type;
    return await this.fetchTVDB('/search', params);
  }

  /**
   * Get Series Details
   */
  static async getSeriesDetails(tvdbId: number | string) {
    return await this.fetchTVDB(`/series/${tvdbId}/extended`);
  }

  /**
   * Get Movie Details
   */
  static async getMovieDetails(tvdbId: number | string) {
    return await this.fetchTVDB(`/movies/${tvdbId}/extended`);
  }

  /**
   * Convert TVDB raw data to ContentItem
   */
  static convertToContentItem(data: any, type: 'movie' | 'series'): ContentItem {
    const isMovie = type === 'movie';
    const releaseYear = data.year ? parseInt(data.year, 10) : new Date().getFullYear();

    return {
      id: `tvdb-${type}-${data.id}`,
      tmdb_id: 0,
      type,
      title: data.name || data.title || 'Без названия',
      original_title: data.originalName || data.name || 'Untitled',
      release_year: releaseYear,
      age_rating: '16+',
      rating_imdb: Math.round(((data.score || 75) / 10) * 10) / 10,
      rating_tmdb: Math.round(((data.score || 75) / 10) * 10) / 10,
      runtime_minutes: isMovie ? (data.runtime || 110) : (data.averageRuntime || 45),
      overview: data.overview || data.description || 'Описание из TVDB.',
      poster_url: data.image || data.poster || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&auto=format&fit=crop&q=80',
      backdrop_url: data.artworks?.find((a: any) => a.type === 2)?.image || data.image || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&auto=format&fit=crop&q=80',
      is_4k: true,
      is_published: true,
      play_count: Math.floor(Math.random() * 3000) + 50,
      genres: data.genres ? data.genres.map((g: any) => g.name || g) : ['TVDB'],
      director: 'TVDB Network',
      cast: [],
    };
  }
}

/**
 * Unified Metadata Manager Service
 */
export interface ApiHealthReport {
  name: string;
  service: 'TMDB' | 'TVDB' | 'Gemini' | 'TorrServer';
  status: 'ok' | 'error';
  pingMs?: number;
  error?: string;
  details?: string;
}

export interface MetadataSyncProgress {
  isSyncing: boolean;
  progressPercent: number;
  currentStep: string;
  itemsAdded: number;
  totalCatalogCount: number;
  error: string | null;
  lastSyncTimestamp: string | null;
  apiReports?: ApiHealthReport[];
}

export class MetadataService {
  private static syncState: MetadataSyncProgress = {
    isSyncing: false,
    progressPercent: 0,
    currentStep: 'Готов к синхронизации',
    itemsAdded: 0,
    totalCatalogCount: 0,
    error: null,
    lastSyncTimestamp: null,
    apiReports: []
  };

  static getSyncProgress(): MetadataSyncProgress {
    return {
      ...this.syncState,
      totalCatalogCount: dbStore.content.length
    };
  }

  /**
   * Diagnostic check for all external and internal APIs
   */
  static async checkAllAPIs(): Promise<ApiHealthReport[]> {
    const reports: ApiHealthReport[] = [];

    // 1. Check TMDB API
    const tmdbStart = Date.now();
    try {
      const key = TMDBClient.apiKey;
      if (!key) {
        reports.push({
          name: 'TMDB Metadata API (api.themoviedb.org)',
          service: 'TMDB',
          status: 'error',
          error: 'TMDB_API_KEY отсутствует в .env'
        });
      } else {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`https://api.themoviedb.org/3/configuration?api_key=${key}`, { signal: controller.signal });
        clearTimeout(timeout);
        const ms = Date.now() - tmdbStart;
        if (res.ok) {
          reports.push({
            name: 'TMDB Metadata API (api.themoviedb.org)',
            service: 'TMDB',
            status: 'ok',
            pingMs: ms
          });
        } else {
          reports.push({
            name: 'TMDB Metadata API (api.themoviedb.org)',
            service: 'TMDB',
            status: 'error',
            pingMs: ms,
            error: `HTTP ${res.status} ${res.statusText || 'Unauthorized'} — Ошибка API ключа или лимитов TMDB`
          });
        }
      }
    } catch (err: any) {
      const ms = Date.now() - tmdbStart;
      const msg = err.name === 'AbortError' ? 'Таймаут ответа (3500ms)' : (err.message || 'Ошибка подключения');
      reports.push({
        name: 'TMDB Metadata API (api.themoviedb.org)',
        service: 'TMDB',
        status: 'error',
        pingMs: ms,
        error: msg
      });
    }

    // 2. Check TVDB API
    const tvdbStart = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('https://api4.thetvdb.com/v4/official/series', { signal: controller.signal }).catch(() => null);
      clearTimeout(timeout);
      const ms = Date.now() - tvdbStart;
      if (res && res.ok) {
        reports.push({
          name: 'TVDB V4 Series API (api4.thetvdb.com)',
          service: 'TVDB',
          status: 'ok',
          pingMs: ms
        });
      } else if (res) {
        reports.push({
          name: 'TVDB V4 Series API (api4.thetvdb.com)',
          service: 'TVDB',
          status: 'error',
          pingMs: ms,
          error: `HTTP ${res.status} — Не настроен TVDB_API_KEY / Токен недействителен`
        });
      } else {
        reports.push({
          name: 'TVDB V4 Series API (api4.thetvdb.com)',
          service: 'TVDB',
          status: 'error',
          pingMs: ms,
          error: 'Сервер api4.thetvdb.com не ответил (Таймаут / Сеть)'
        });
      }
    } catch (err: any) {
      const ms = Date.now() - tvdbStart;
      reports.push({
        name: 'TVDB V4 Series API (api4.thetvdb.com)',
        service: 'TVDB',
        status: 'error',
        pingMs: ms,
        error: err.name === 'AbortError' ? 'Таймаут соединения (3500ms)' : (err.message || 'Ошибка сети')
      });
    }

    // 3. Check Gemini AI API
    const geminiStart = Date.now();
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      reports.push({
        name: 'Google Gemini AI API (generativelanguage.googleapis.com)',
        service: 'Gemini',
        status: 'error',
        error: 'GEMINI_API_KEY не установлен в .env'
      });
    } else {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`, { signal: controller.signal });
        clearTimeout(timeout);
        const ms = Date.now() - geminiStart;
        if (res.ok) {
          reports.push({
            name: 'Google Gemini AI API (generativelanguage.googleapis.com)',
            service: 'Gemini',
            status: 'ok',
            pingMs: ms
          });
        } else {
          reports.push({
            name: 'Google Gemini AI API (generativelanguage.googleapis.com)',
            service: 'Gemini',
            status: 'error',
            pingMs: ms,
            error: `HTTP ${res.status} — Недействительный GEMINI_API_KEY или лимит запросов`
          });
        }
      } catch (err: any) {
        const ms = Date.now() - geminiStart;
        reports.push({
          name: 'Google Gemini AI API (generativelanguage.googleapis.com)',
          service: 'Gemini',
          status: 'error',
          pingMs: ms,
          error: err.name === 'AbortError' ? 'Таймаут соединения (3500ms)' : (err.message || 'Ошибка сети')
        });
      }
    }

    // 4. Check TorrServer Cluster Nodes
    if (dbStore.nodes && dbStore.nodes.length > 0) {
      for (const node of dbStore.nodes) {
        const nodeStart = Date.now();
        const targetUrl = node.hostname.startsWith('http') ? node.hostname : `http://${node.hostname}`;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 2500);
          const res = await fetch(`${targetUrl}/echo`, { signal: controller.signal }).catch(async () => {
            return await fetch(`${targetUrl}/`, { signal: controller.signal }).catch(() => null);
          });
          clearTimeout(timeout);
          const ms = Date.now() - nodeStart;
          if (res && (res.ok || res.status < 500)) {
            node.isOnline = true;
            reports.push({
              name: `TorrServer Нода ${node.nodeId} (${(node as any).location || node.region || 'Local Node'})`,
              service: 'TorrServer',
              status: 'ok',
              pingMs: ms,
              details: targetUrl
            });
          } else {
            node.isOnline = false;
            const errMsg = res ? `HTTP ${res.status}` : 'Нет ответа (ECONNREFUSED / Офлайн)';
            reports.push({
              name: `TorrServer Нода ${node.nodeId} (${(node as any).location || node.region || 'Edge Node'})`,
              service: 'TorrServer',
              status: 'error',
              pingMs: ms,
              error: errMsg,
              details: targetUrl
            });
          }
        } catch (err: any) {
          node.isOnline = false;
          const errMsg = err.name === 'AbortError' ? 'Таймаут соединения (2500ms)' : (err.message || 'ECONNREFUSED / Сервер недоступен');
          reports.push({
            name: `TorrServer Нода ${node.nodeId} (${(node as any).location || node.region || 'Edge Node'})`,
            service: 'TorrServer',
            status: 'error',
            pingMs: -1,
            error: errMsg,
            details: targetUrl
          });
        }
      }
    }

    return reports;
  }

  /**
   * Test API connections
   */
  static getStatus() {
    const tmdbKey = TMDBClient.apiKey;
    return {
      tmdb: {
        configured: Boolean(tmdbKey),
        key_preview: tmdbKey ? `${tmdbKey.substring(0, 4)}...` : null,
      },
      tvdb: {
        configured: Boolean(process.env.TVDB_API_KEY),
        key_preview: process.env.TVDB_API_KEY ? `${process.env.TVDB_API_KEY.substring(0, 4)}...` : null,
      },
      syncState: this.getSyncProgress()
    };
  }

  /**
   * Search combined metadata across TMDB and TVDB
   */
  static async searchCombined(query: string, provider: 'tmdb' | 'tvdb' | 'all' = 'all') {
    const results: any[] = [];
    const errors: string[] = [];

    // Search TMDB
    if (provider === 'tmdb' || provider === 'all') {
      const tmdbKey = TMDBClient.apiKey;
      if (tmdbKey) {
        try {
          const [movies, tvShows] = await Promise.all([
            TMDBClient.searchMovies(query).catch(e => ({ results: [] })),
            TMDBClient.searchTVShows(query).catch(e => ({ results: [] })),
          ]);

          movies.results?.slice(0, 8).forEach((m: any) => {
            results.push({
              source: 'tmdb',
              type: 'movie',
              id: m.id,
              title: m.title,
              original_title: m.original_title,
              year: m.release_date ? m.release_date.split('-')[0] : 'N/A',
              rating: Math.round((m.vote_average || 7.0) * 10) / 10,
              poster_url: TMDBClient.getImageUrl(m.poster_path, 'w500'),
              overview: m.overview,
            });
          });

          tvShows.results?.slice(0, 8).forEach((s: any) => {
            results.push({
              source: 'tmdb',
              type: 'series',
              id: s.id,
              title: s.name,
              original_title: s.original_name,
              year: s.first_air_date ? s.first_air_date.split('-')[0] : 'N/A',
              rating: Math.round((s.vote_average || 7.0) * 10) / 10,
              poster_url: TMDBClient.getImageUrl(s.poster_path, 'w500'),
              overview: s.overview,
            });
          });
        } catch (err: any) {
          errors.push(`TMDB: ${err.message}`);
        }
      } else {
        errors.push('TMDB_API_KEY не настроен в .env');
      }
    }

    // Search TVDB
    if (provider === 'tvdb' || provider === 'all') {
      if (process.env.TVDB_API_KEY) {
        try {
          const tvdbRes = await TVDBClient.search(query);
          tvdbRes.data?.slice(0, 5).forEach((item: any) => {
            results.push({
              source: 'tvdb',
              type: item.type === 'movie' ? 'movie' : 'series',
              id: item.tvdb_id || item.id,
              title: item.name,
              original_title: item.name,
              year: item.year || 'N/A',
              rating: item.score || 0,
              poster_url: item.image_url || item.thumbnail || '',
              overview: item.overview || item.description || '',
            });
          });
        } catch (err: any) {
          errors.push(`TVDB: ${err.message}`);
        }
      } else if (provider === 'tvdb') {
        errors.push('TVDB_API_KEY не настроен в .env (используйте TMDB поиск)');
      }
    }

    return { results, errors };
  }

  /**
   * Import item directly into the application catalog
   */
  static async importToCatalog(externalId: number | string, source: 'tmdb' | 'tvdb', type: 'movie' | 'series') {
    let contentItem: ContentItem;

    if (source === 'tmdb') {
      if (type === 'movie') {
        const details = await TMDBClient.getMovieDetails(externalId);
        contentItem = TMDBClient.convertToContentItem(details, 'movie');
      } else {
        const details = await TMDBClient.getTVDetails(externalId);
        contentItem = TMDBClient.convertToContentItem(details, 'series');

        // Import seasons and episodes if available
        if (details.seasons && Array.isArray(details.seasons)) {
          for (const seasonData of details.seasons) {
            if (seasonData.season_number === 0) continue; // Skip specials

            const seasonId = `s-${contentItem.id}-${seasonData.season_number}`;
            const newSeason: Season = {
              id: seasonId,
              content_id: contentItem.id,
              season_number: seasonData.season_number,
              title: seasonData.name || `Сезон ${seasonData.season_number}`,
              overview: seasonData.overview || `Сезон ${seasonData.season_number}`,
              poster_url: TMDBClient.getImageUrl(seasonData.poster_path, 'w500'),
            };

            // Avoid duplicate seasons
            if (!dbStore.seasons.some((s) => s.id === seasonId)) {
              dbStore.seasons.push(newSeason);
            }

            // Fetch actual season episodes
            try {
              const fullSeason = await TMDBClient.getTVSeason(externalId, seasonData.season_number);
              if (fullSeason.episodes) {
                fullSeason.episodes.forEach((ep: any) => {
                  const epId = `ep-${seasonId}-${ep.episode_number}`;
                  const newEp: Episode = {
                    id: epId,
                    season_id: seasonId,
                    episode_number: ep.episode_number,
                    title: ep.name || `Эпизод ${ep.episode_number}`,
                    overview: ep.overview || 'Описание серии отсутствует.',
                    runtime_minutes: ep.runtime || 45,
                    still_url: TMDBClient.getImageUrl(ep.still_path, 'w500'),
                    air_date: ep.air_date,
                  };

                  if (!dbStore.episodes.some((e) => e.id === epId)) {
                    dbStore.episodes.push(newEp);
                  }
                });
              }
            } catch (epErr) {
              // Non-blocking fallback if episode fetch fails
              console.warn(`Could not fetch TMDB episodes for season ${seasonData.season_number}`, epErr);
            }
          }
        }
      }
    } else {
      // TVDB
      if (type === 'movie') {
        const details = await TVDBClient.getMovieDetails(externalId);
        contentItem = TVDBClient.convertToContentItem(details.data || details, 'movie');
      } else {
        const details = await TVDBClient.getSeriesDetails(externalId);
        contentItem = TVDBClient.convertToContentItem(details.data || details, 'series');
      }
    }

    // Add or update item in store
    const existingIdx = dbStore.content.findIndex((c) => c.id === contentItem.id || (c.tmdb_id && c.tmdb_id === contentItem.tmdb_id));
    if (existingIdx >= 0) {
      dbStore.content[existingIdx] = { ...dbStore.content[existingIdx], ...contentItem };
    } else {
      dbStore.content.unshift(contentItem);
    }

    return contentItem;
  }

  /**
   * Automatically fetch popular and trending filmography from TMDB to populate catalog
   */
  static async autoPopulateFromTMDB(): Promise<number> {
    if (this.syncState.isSyncing) {
      console.log('[TMDB Auto-Sync] Sync already in progress...');
      return 0;
    }

    let addedCount = 0;
    this.syncState = {
      isSyncing: true,
      progressPercent: 5,
      currentStep: 'Проверка и диагностика работоспособности всех API...',
      itemsAdded: 0,
      totalCatalogCount: dbStore.content.length,
      error: null,
      lastSyncTimestamp: new Date().toISOString(),
      apiReports: []
    };

    try {
      // Run diagnostic health check on TMDB, TVDB, Gemini, TorrServer
      const apiReports = await this.checkAllAPIs();
      this.syncState.apiReports = apiReports;

      const failingApis = apiReports.filter(r => r.status === 'error');
      if (failingApis.length > 0) {
        console.warn(`[API Diagnostics] Found ${failingApis.length} failing API(s):`, failingApis.map(f => `${f.name}: ${f.error}`));
      }

      console.log('[TMDB Auto-Sync] Starting global catalog prefetch from TMDB API...');

      this.syncState.progressPercent = 20;
      this.syncState.currentStep = failingApis.length > 0
        ? `Загрузка каталога (Обнаружено неработающих API: ${failingApis.length})...`
        : 'Загрузка трендов дня, новинок проката и популярного кино...';

      const [
        trendingDay,
        trendingWeek,
        popularMovies1,
        popularMovies2,
        topRatedMovies,
        nowPlaying,
        upcomingMovies,
        popularTV1,
        popularTV2,
        topRatedTV,
        sciFiMovies,
        animeMovies
      ] = await Promise.all([
        TMDBClient.getTrending('all', 'day', 1).catch(() => ({ results: [] })),
        TMDBClient.getTrending('all', 'week', 1).catch(() => ({ results: [] })),
        TMDBClient.getPopularMovies(1).catch(() => ({ results: [] })),
        TMDBClient.getPopularMovies(2).catch(() => ({ results: [] })),
        TMDBClient.getTopRatedMovies(1).catch(() => ({ results: [] })),
        TMDBClient.getNowPlayingMovies(1).catch(() => ({ results: [] })),
        TMDBClient.getUpcomingMovies(1).catch(() => ({ results: [] })),
        TMDBClient.getPopularTV(1).catch(() => ({ results: [] })),
        TMDBClient.getPopularTV(2).catch(() => ({ results: [] })),
        TMDBClient.getTopRatedTV(1).catch(() => ({ results: [] })),
        TMDBClient.discover('movie', 878, 'popularity.desc', 1).catch(() => ({ results: [] })),
        TMDBClient.discover('movie', 16, 'vote_average.desc', 1).catch(() => ({ results: [] })),
      ]);

      this.syncState.progressPercent = 60;
      this.syncState.currentStep = 'Обработка и связывание метаданных, постеров и жанров...';

      const itemsToProcess: Array<{ raw: any; type: 'movie' | 'series' }> = [];

      const addGroup = (results: any[], defaultType: 'movie' | 'series') => {
        if (!Array.isArray(results)) return;
        results.forEach((r: any) => {
          if (!r || (!r.title && !r.name)) return;
          const mediaType = r.media_type ? (r.media_type === 'tv' ? 'series' : 'movie') : defaultType;
          itemsToProcess.push({ raw: r, type: mediaType });
        });
      };

      addGroup(trendingDay.results, 'movie');
      addGroup(trendingWeek.results, 'movie');
      addGroup(popularMovies1.results, 'movie');
      addGroup(popularMovies2.results, 'movie');
      addGroup(topRatedMovies.results, 'movie');
      addGroup(nowPlaying.results, 'movie');
      addGroup(upcomingMovies.results, 'movie');
      addGroup(popularTV1.results, 'series');
      addGroup(popularTV2.results, 'series');
      addGroup(topRatedTV.results, 'series');
      addGroup(sciFiMovies.results, 'movie');
      addGroup(animeMovies.results, 'movie');

      const seenIds = new Set<string>();
      const totalCount = itemsToProcess.length || 1;
      let processed = 0;

      for (const item of itemsToProcess) {
        processed++;
        if (!item.raw || (!item.raw.title && !item.raw.name)) continue;
        const key = `${item.type}-${item.raw.id}`;
        if (seenIds.has(key)) continue;
        seenIds.add(key);

        const formatted = TMDBClient.convertToContentItem(item.raw, item.type);

        const existingIdx = dbStore.content.findIndex(
          (c) => c.id === formatted.id || (c.tmdb_id && c.tmdb_id === formatted.tmdb_id)
        );

        if (existingIdx >= 0) {
          // Merge missing properties (e.g. genre tags, backdrop)
          dbStore.content[existingIdx] = {
            ...formatted,
            ...dbStore.content[existingIdx],
            genres: formatted.genres && formatted.genres.length > 0 ? formatted.genres : dbStore.content[existingIdx].genres,
            poster_url: formatted.poster_url || dbStore.content[existingIdx].poster_url,
            backdrop_url: formatted.backdrop_url || dbStore.content[existingIdx].backdrop_url
          };
        } else {
          dbStore.content.push(formatted);
          addedCount++;
        }

        const pct = Math.min(99, 60 + Math.round((processed / totalCount) * 39));
        this.syncState.progressPercent = pct;
        this.syncState.itemsAdded = addedCount;
        this.syncState.currentStep = `Сохранение в базу: "${formatted.title}" (${processed}/${totalCount})`;
      }

      const failingApisCount = (this.syncState.apiReports || []).filter(r => r.status === 'error').length;
      const statusSuffix = failingApisCount > 0
        ? ` (Обнаружены проблемы с ${failingApisCount} API)`
        : '';

      this.syncState = {
        isSyncing: false,
        progressPercent: 100,
        currentStep: `Синхронизация завершена! Добавлено ${addedCount} элементов${statusSuffix}. Всего в каталоге: ${dbStore.content.length}`,
        itemsAdded: addedCount,
        totalCatalogCount: dbStore.content.length,
        error: failingApisCount > 0 ? `Недоступно API: ${failingApisCount}. См. диагностические карточки ниже.` : null,
        lastSyncTimestamp: new Date().toISOString(),
        apiReports: this.syncState.apiReports
      };

      console.log(`[TMDB Auto-Sync] Successfully populated catalog. DB total: ${dbStore.content.length}`);
    } catch (err: any) {
      console.error('[TMDB Auto-Sync] Error auto-populating from TMDB:', err);
      this.syncState = {
        isSyncing: false,
        progressPercent: 0,
        currentStep: 'Ошибка при синхронизации TMDB',
        itemsAdded: addedCount,
        totalCatalogCount: dbStore.content.length,
        error: err.message || 'Ошибка запроса к TMDB',
        lastSyncTimestamp: new Date().toISOString(),
        apiReports: this.syncState.apiReports
      };
    }
    return addedCount;
  }

  /**
   * Get full Person details, biography, photo and filmography credits from TMDB
   */
  static async getPerson(personIdOrName: string | number): Promise<any> {
    try {
      let personTmdbId: number | string = personIdOrName;

      // If passed as name string and not numeric ID, search first
      if (typeof personIdOrName === 'string' && isNaN(Number(personIdOrName))) {
        const searchRes = await TMDBClient.searchPerson(personIdOrName);
        if (searchRes.results && searchRes.results.length > 0) {
          personTmdbId = searchRes.results[0].id;
        } else {
          throw new Error('Персона не найдена в базе данных TMDB');
        }
      }

      const rawPerson = await TMDBClient.getPersonDetails(personTmdbId);
      
      const credits: any[] = [];
      const seenIds = new Set<string>();

      if (rawPerson.combined_credits) {
        const allCredits = [
          ...(rawPerson.combined_credits.cast || []),
          ...(rawPerson.combined_credits.crew || [])
        ];

        for (const c of allCredits) {
          const mediaType = c.media_type === 'tv' ? 'series' : 'movie';
          const creditKey = `${mediaType}-${c.id}`;
          if (seenIds.has(creditKey)) continue;
          seenIds.add(creditKey);

          const releaseDate = c.release_date || c.first_air_date;
          const releaseYear = releaseDate ? parseInt(releaseDate.split('-')[0], 10) : 0;

          credits.push({
            id: `tmdb-${mediaType}-${c.id}`,
            tmdb_id: c.id,
            type: mediaType,
            title: c.title || c.name || 'Без названия',
            original_title: c.original_title || c.original_name || '',
            release_year: releaseYear,
            rating_imdb: Math.round((c.vote_average || 7.0) * 10) / 10,
            poster_url: TMDBClient.getImageUrl(c.poster_path, 'w500'),
            backdrop_url: TMDBClient.getImageUrl(c.backdrop_path || c.poster_path, 'w780'),
            character: c.character || undefined,
            job: c.job || (c.department === 'Directing' ? 'Режиссер' : undefined),
            overview: c.overview || '',
            is_4k: true
          });
        }
      }

      return {
        id: rawPerson.id,
        name: rawPerson.name,
        original_name: rawPerson.also_known_as?.[0] || rawPerson.name,
        biography: rawPerson.biography || 'Биография пока не заполнена в глобальной фильмотеке.',
        birthday: rawPerson.birthday || null,
        deathday: rawPerson.deathday || null,
        place_of_birth: rawPerson.place_of_birth || null,
        profile_url: TMDBClient.getImageUrl(rawPerson.profile_path, 'w500'),
        known_for_department: rawPerson.known_for_department || 'Актерское искусство',
        popularity: rawPerson.popularity || 0,
        credits: credits
      };
    } catch (err: any) {
      console.error('[MetadataService.getPerson] Error:', err.message);
      throw err;
    }
  }
}
