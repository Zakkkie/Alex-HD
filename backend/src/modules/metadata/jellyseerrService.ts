import { config } from '../../config/env';
import { dbStore } from '../../db/store';
import { ContentItem, ContentType, CastMember, CrewMember } from '../../../../src/types';
import { TMDB_GENRE_MAP, TMDBClient } from './metadataService';

export interface JellyseerrMediaInfo {
  id?: number;
  tmdbId?: number;
  tvdbId?: number;
  status?: number; // 1: UNKNOWN, 2: PENDING, 3: PROCESSING, 4: PARTIALLY_AVAILABLE, 5: AVAILABLE
  status4k?: number;
  serviceUrl?: string;
  downloadStatus?: any[];
  requests?: any[];
}

export class JellyseerrService {
  private static customUrl: string | null = null;
  private static customApiKey: string | null = null;
  private static enabled: boolean = true;

  public static setConfig(url?: string, apiKey?: string, isEnabled: boolean = true) {
    if (url !== undefined) {
      this.customUrl = url.trim().replace(/\/+$/, '');
    }
    if (apiKey !== undefined) {
      this.customApiKey = apiKey.trim();
    }
    this.enabled = isEnabled;
  }

  public static get url(): string {
    return this.customUrl || config.jellyseerrUrl || 'http://127.0.0.1:5055';
  }

  public static get apiKey(): string {
    return this.customApiKey || config.jellyseerrApiKey || '';
  }

  public static isConfigured(): boolean {
    return Boolean(this.apiKey && this.url);
  }

  public static isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Helper to make authorized requests to Jellyseerr API with timeout
   */
  public static async fetchApi(endpoint: string, options: RequestInit = {}): Promise<any> {
    const baseUrl = this.url.replace(/\/+$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = `${baseUrl}/api/v1${cleanEndpoint}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError';
      const msg = isTimeout ? 'Превышено время ожидания ответа (2500ms)' : (err.message || 'Сетевой хост недоступен');
      throw new Error(`Jellyseerr (${fullUrl}): ${msg}`);
    }
  }

  /**
   * Check connection and get Jellyseerr system status
   */
  public static async getStatus(): Promise<{
    online: boolean;
    version?: string;
    commitTag?: string;
    url: string;
    totalRequests?: number;
    error?: string;
  }> {
    try {
      const data = await this.fetchApi('/status');
      if (data && (data.version || data.commitTag)) {
        return {
          online: true,
          version: data.version || '1.0.0',
          commitTag: data.commitTag || 'latest',
          url: this.url,
          totalRequests: data.totalRequests || 0,
        };
      }
      return {
        online: true,
        version: 'Jellyseerr Active',
        url: this.url,
      };
    } catch (err: any) {
      return {
        online: false,
        url: this.url,
        error: err.message,
      };
    }
  }

  /**
   * Search Movies, TV Series, People via Jellyseerr
   */
  public static async search(query: string, page = 1) {
    if (!query.trim()) return { results: [], totalResults: 0 };
    return await this.fetchApi(`/search?query=${encodeURIComponent(query)}&page=${page}&language=ru-RU`);
  }

  /**
   * Get Trending media from Jellyseerr
   */
  public static async getTrending(page = 1) {
    return await this.fetchApi(`/discover/trending?page=${page}&language=ru-RU`);
  }

  /**
   * Get Popular Movies from Jellyseerr
   */
  public static async getPopularMovies(page = 1) {
    return await this.fetchApi(`/discover/movies?sortBy=popularity.desc&page=${page}&language=ru-RU`);
  }

  /**
   * Get Popular TV Series from Jellyseerr
   */
  public static async getPopularTV(page = 1) {
    return await this.fetchApi(`/discover/tv?sortBy=popularity.desc&page=${page}&language=ru-RU`);
  }

  /**
   * Get Upcoming Movies from Jellyseerr
   */
  public static async getUpcomingMovies(page = 1) {
    return await this.fetchApi(`/discover/movies/upcoming?page=${page}&language=ru-RU`);
  }

  /**
   * Get Full Movie Details with Credits (Actors, Director), MediaInfo, Videos
   */
  public static async getMovieDetails(tmdbId: number | string): Promise<ContentItem | null> {
    try {
      const data = await this.fetchApi(`/movie/${tmdbId}?language=ru-RU`);
      if (!data) return null;
      return this.mapToContentItem(data, 'movie');
    } catch (err: any) {
      console.warn(`[JellyseerrService] Failed to get movie details for ${tmdbId}:`, err.message);
      return null;
    }
  }

  /**
   * Get Full TV Series Details with Credits, Seasons, Episodes, MediaInfo
   */
  public static async getTVDetails(tmdbId: number | string): Promise<ContentItem | null> {
    try {
      const data = await this.fetchApi(`/tv/${tmdbId}?language=ru-RU`);
      if (!data) return null;
      return this.mapToContentItem(data, 'series');
    } catch (err: any) {
      console.warn(`[JellyseerrService] Failed to get TV details for ${tmdbId}:`, err.message);
      return null;
    }
  }

  /**
   * Request media in Jellyseerr (sends to Radarr / Sonarr)
   */
  public static async requestMedia(params: {
    mediaType: 'movie' | 'tv';
    mediaId: number;
    seasons?: number[];
    is4k?: boolean;
  }) {
    return await this.fetchApi('/request', {
      method: 'POST',
      body: JSON.stringify({
        mediaType: params.mediaType,
        mediaId: params.mediaId,
        seasons: params.seasons || (params.mediaType === 'tv' ? 'all' : undefined),
        is4k: params.is4k || false,
      }),
    });
  }

  /**
   * Get all media items currently managed / available in Jellyseerr
   */
  public static async getMediaList(take = 50, skip = 0, filter = 'all') {
    return await this.fetchApi(`/media?take=${take}&skip=${skip}&filter=${filter}`);
  }

  /**
   * Map Jellyseerr payload into unified ContentItem with full cast, crew, and media status
   */
  public static mapToContentItem(data: any, defaultType: ContentType = 'movie'): ContentItem {
    const isMovie = defaultType === 'movie' || data.mediaType === 'movie' || !!data.title;
    const type: ContentType = isMovie ? 'movie' : 'series';
    const tmdbId = data.id || data.tmdbId;

    const title = data.title || data.name || 'Без названия';
    const originalTitle = data.originalTitle || data.originalName || title;

    const releaseDate = data.releaseDate || data.firstAirDate || '';
    const releaseYear = releaseDate ? parseInt(releaseDate.split('-')[0], 10) : new Date().getFullYear();

    const posterPath = data.posterPath || (data.poster_path ? `/t/p/w500${data.poster_path}` : '');
    const backdropPath = data.backdropPath || (data.backdrop_path ? `/t/p/original${data.backdrop_path}` : '');

    const posterUrl = posterPath
      ? (posterPath.startsWith('http') ? posterPath : `https://image.tmdb.org/t/p/w500${posterPath}`)
      : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&auto=format&fit=crop&q=80';

    const backdropUrl = backdropPath
      ? (backdropPath.startsWith('http') ? backdropPath : `https://image.tmdb.org/t/p/original${backdropPath}`)
      : posterUrl;

    // Genres mapping
    let genres: string[] = [];
    if (data.genres && Array.isArray(data.genres)) {
      genres = data.genres.map((g: any) => (typeof g === 'string' ? g : g.name)).filter(Boolean);
    } else if (data.genre_ids && Array.isArray(data.genre_ids)) {
      genres = data.genre_ids.map((id: number) => TMDB_GENRE_MAP[id]).filter(Boolean);
    }
    if (genres.length === 0) {
      genres = [isMovie ? 'Фильм' : 'Сериал'];
    }

    // Credits: Extract Director & Crew
    let director = 'Неизвестно';
    let directorPhoto: string | undefined = undefined;
    let directorId: number | string | undefined = undefined;
    const crew_members: CrewMember[] = [];

    if (data.credits && data.credits.crew && Array.isArray(data.credits.crew)) {
      const directorObj = data.credits.crew.find((c: any) => c.job === 'Director' || c.department === 'Directing');
      if (directorObj) {
        director = directorObj.name;
        directorId = directorObj.id;
        if (directorObj.profilePath || directorObj.profile_path) {
          const pPath = directorObj.profilePath || directorObj.profile_path;
          directorPhoto = pPath.startsWith('http') ? pPath : `https://image.tmdb.org/t/p/w500${pPath}`;
        }
      }

      data.credits.crew.slice(0, 10).forEach((c: any) => {
        const pPath = c.profilePath || c.profile_path;
        crew_members.push({
          id: c.id,
          name: c.name,
          job: c.job || 'Съемочная группа',
          department: c.department,
          profile_path: pPath ? (pPath.startsWith('http') ? pPath : `https://image.tmdb.org/t/p/w500${pPath}`) : null,
        });
      });
    } else if (data.created_by && Array.isArray(data.created_by) && data.created_by.length > 0) {
      director = data.created_by.map((c: any) => c.name).join(', ');
      directorId = data.created_by[0]?.id;
      if (data.created_by[0]?.profile_path) {
        directorPhoto = `https://image.tmdb.org/t/p/w500${data.created_by[0].profile_path}`;
      }
    }

    // Credits: Extract Cast Members (Actors with photos and character names)
    const cast: string[] = [];
    const cast_members: CastMember[] = [];

    if (data.credits && data.credits.cast && Array.isArray(data.credits.cast)) {
      data.credits.cast.slice(0, 15).forEach((c: any) => {
        cast.push(c.name);
        const pPath = c.profilePath || c.profile_path;
        cast_members.push({
          id: c.id,
          name: c.name,
          character: c.character || 'Роль',
          profile_path: pPath ? (pPath.startsWith('http') ? pPath : `https://image.tmdb.org/t/p/w500${pPath}`) : null,
          order: c.order || 0,
        });
      });
    }

    // Trailer Video
    let trailer_url: string | undefined = undefined;
    if (data.videos && Array.isArray(data.videos)) {
      const trailer = data.videos.find(
        (v: any) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
      );
      if (trailer && trailer.key) {
        trailer_url = `https://www.youtube.com/watch?v=${trailer.key}`;
      }
    }

    // Media Status from Jellyseerr / Radarr / Sonarr / Jellyfin
    const mediaInfo = data.mediaInfo || {};
    const mediaStatus = mediaInfo.status || 1; // 1: Unknown, 2: Pending, 3: Processing, 4: Partially Available, 5: Available

    return {
      id: `tmdb-${tmdbId}`,
      tmdb_id: Number(tmdbId),
      type,
      title,
      original_title: originalTitle,
      release_year: releaseYear,
      age_rating: data.adult ? '18+' : '16+',
      rating_imdb: Number((data.voteAverage || data.vote_average || 7.5).toFixed(1)),
      rating_tmdb: Number((data.voteAverage || data.vote_average || 7.5).toFixed(1)),
      runtime_minutes: data.runtime || (data.episodeRunTime && data.episodeRunTime[0]) || 110,
      overview: data.overview || 'Описание фильма или сериала формируется.',
      poster_url: posterUrl,
      backdrop_url: backdropUrl,
      is_4k: mediaInfo.status4k === 5 || releaseYear >= 2020,
      is_published: true,
      play_count: Math.floor((data.popularity || 100) * 15),
      genres,
      country: data.productionCountries && data.productionCountries[0]?.name ? data.productionCountries[0].name : 'США / Международный',
      countries: data.productionCountries?.map((c: any) => c.name) || [],
      director,
      directorPhoto,
      directorId,
      cast,
      cast_members,
      crew_members,
      stills: backdropUrl ? [backdropUrl] : [],
      trailer_url,
      stream_url: `http://127.0.0.1:8090/stream?tmdb=${tmdbId}`,
    };
  }

  /**
   * Synchronize trending and popular catalog from Jellyseerr directly into local database
   */
  public static async syncCatalog(): Promise<{
    success: boolean;
    syncedCount: number;
    totalCount: number;
    error?: string;
  }> {
    try {
      const isOnline = (await this.getStatus()).online;
      if (!isOnline) {
        throw new Error(`Jellyseerr по адресу ${this.url} недоступен. Проверьте запуск контейнера jellyseerr.`);
      }

      const [trending, popularMovies, popularTV] = await Promise.allSettled([
        this.getTrending(1),
        this.getPopularMovies(1),
        this.getPopularTV(1),
      ]);

      const itemsToUpsert: ContentItem[] = [];

      const processList = (rawList: any, type: ContentType) => {
        if (rawList && Array.isArray(rawList.results)) {
          for (const raw of rawList.results) {
            try {
              const item = this.mapToContentItem(raw, type);
              itemsToUpsert.push(item);
            } catch (err) {
              // skip invalid item
            }
          }
        }
      };

      if (trending.status === 'fulfilled' && trending.value) {
        processList(trending.value, 'movie');
      }
      if (popularMovies.status === 'fulfilled' && popularMovies.value) {
        processList(popularMovies.value, 'movie');
      }
      if (popularTV.status === 'fulfilled' && popularTV.value) {
        processList(popularTV.value, 'series');
      }

      let added = 0;
      for (const item of itemsToUpsert) {
        const existingIdx = dbStore.content.findIndex((c) => c.tmdb_id === item.tmdb_id);
        if (existingIdx >= 0) {
          // Merge rich details without losing custom stream urls
          dbStore.content[existingIdx] = {
            ...dbStore.content[existingIdx],
            ...item,
            stream_url: dbStore.content[existingIdx].stream_url || item.stream_url,
          };
        } else {
          dbStore.content.push(item);
          added++;
        }
      }

      return {
        success: true,
        syncedCount: itemsToUpsert.length,
        totalCount: dbStore.content.length,
      };
    } catch (err: any) {
      return {
        success: false,
        syncedCount: 0,
        totalCount: dbStore.content.length,
        error: err.message,
      };
    }
  }
}
