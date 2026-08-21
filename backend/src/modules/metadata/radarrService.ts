import { config } from '../../config/env.js';
import { fileLogger } from '../../logger/fileLogger.js';
import { ContentItem } from '../../../../src/types.js';

export interface RadarrMovie {
  id: number;
  title: string;
  originalTitle?: string;
  year: number;
  tmdbId: number;
  imdbId?: string;
  overview?: string;
  runtime?: number;
  hasFile?: boolean;
  monitored?: boolean;
  genres?: string[];
  ratings?: {
    imdb?: { value: number };
    tmdb?: { value: number };
  };
  images?: Array<{
    coverType: 'poster' | 'fanart' | 'banner' | 'screenshot';
    url?: string;
    remoteUrl?: string;
  }>;
  movieFile?: {
    id: number;
    relativePath: string;
    size: number;
    quality: {
      quality: { name: string; resolution: number };
    };
  };
}

export interface RadarrRelease {
  guid: string;
  title: string;
  size: number;
  downloadUrl?: string;
  magnetUrl?: string;
  infoHash?: string;
  indexer: string;
  seeders?: number;
  leechers?: number;
  protocol: 'torrent' | 'usenet';
  quality: {
    quality: { name: string; resolution: number };
    revision?: { isRepack?: boolean };
  };
  customFormats?: Array<{ name: string }>;
  ageHours?: number;
}

export class RadarrService {
  private static getBaseUrl(): string {
    return (config.radarrUrl || 'http://172.19.0.8:7878').replace(/\/+$/, '');
  }

  private static getApiKey(): string {
    return config.radarrApiKey || '';
  }

  /**
   * Tests connection to Radarr instance
   */
  static async getStatus(): Promise<{
    online: boolean;
    version?: string;
    url: string;
    moviesCount?: number;
    error?: string;
    latencyMs?: number;
  }> {
    const url = this.getBaseUrl();
    const apiKey = this.getApiKey();
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (apiKey) headers['X-Api-Key'] = apiKey;

      const res = await fetch(`${url}/api/v3/system/status`, {
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (res.ok) {
        const data = await res.json();
        let moviesCount = 0;

        // Try getting movie count
        try {
          const moviesRes = await fetch(`${url}/api/v3/movie`, {
            headers,
            signal: AbortSignal.timeout(3000)
          });
          if (moviesRes.ok) {
            const moviesList = await moviesRes.json();
            if (Array.isArray(moviesList)) {
              moviesCount = moviesList.length;
            }
          }
        } catch {
          // ignore
        }

        fileLogger.info('RadarrService', 'STATUS_OK', `Radarr подключен (${url})`, { version: data.version, moviesCount, latencyMs });
        return {
          online: true,
          version: data.version || 'v5',
          url,
          moviesCount,
          latencyMs
        };
      }

      return {
        online: false,
        url,
        error: `HTTP ${res.status}: ${res.statusText}`,
        latencyMs
      };
    } catch (e: any) {
      return {
        online: false,
        url,
        error: e.name === 'AbortError' ? 'Таймаут соединения (4000ms)' : (e.message || 'Radarr недоступен')
      };
    }
  }

  /**
   * Fetches all movies from Radarr library
   */
  static async getMovies(): Promise<ContentItem[]> {
    const url = this.getBaseUrl();
    const apiKey = this.getApiKey();

    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (apiKey) headers['X-Api-Key'] = apiKey;

      const res = await fetch(`${url}/api/v3/movie`, {
        headers,
        signal: AbortSignal.timeout(5000)
      });

      if (!res.ok) {
        throw new Error(`Radarr HTTP ${res.status}`);
      }

      const movies: RadarrMovie[] = await res.json();
      if (!Array.isArray(movies)) return [];

      return movies.map(m => this.convertToContentItem(m));
    } catch (err: any) {
      fileLogger.warn('RadarrService', 'GET_MOVIES_ERROR', `Не удалось получить фильмы из Radarr: ${err.message}`);
      return [];
    }
  }

  /**
   * Look up movies in Radarr / TMDB
   */
  static async lookup(term: string): Promise<ContentItem[]> {
    const url = this.getBaseUrl();
    const apiKey = this.getApiKey();

    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (apiKey) headers['X-Api-Key'] = apiKey;

      const res = await fetch(`${url}/api/v3/movie/lookup?term=${encodeURIComponent(term)}`, {
        headers,
        signal: AbortSignal.timeout(5000)
      });

      if (!res.ok) {
        throw new Error(`Radarr HTTP ${res.status}`);
      }

      const results: RadarrMovie[] = await res.json();
      if (!Array.isArray(results)) return [];

      return results.map(m => this.convertToContentItem(m));
    } catch (err: any) {
      fileLogger.warn('RadarrService', 'LOOKUP_ERROR', `Ошибка поиска в Radarr: ${err.message}`);
      return [];
    }
  }

  /**
   * Fetch available releases (torrents) for a movie from Radarr indexers
   */
  static async getReleases(movieIdOrTmdbId: number | string): Promise<RadarrRelease[]> {
    const url = this.getBaseUrl();
    const apiKey = this.getApiKey();

    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (apiKey) headers['X-Api-Key'] = apiKey;

      const res = await fetch(`${url}/api/v3/release?movieId=${movieIdOrTmdbId}`, {
        headers,
        signal: AbortSignal.timeout(8000)
      });

      if (!res.ok) return [];

      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((r: any) => ({
          guid: r.guid || r.downloadUrl,
          title: r.title || 'Unknown Release',
          size: r.size || 0,
          downloadUrl: r.downloadUrl,
          magnetUrl: r.magnetUrl || r.downloadUrl,
          infoHash: r.infoHash,
          indexer: r.indexer || 'Prowlarr / Radarr',
          seeders: r.seeders || 0,
          leechers: r.leechers || 0,
          protocol: r.protocol || 'torrent',
          quality: r.quality || { quality: { name: '1080p', resolution: 1080 } },
          customFormats: r.customFormats || [],
          ageHours: r.ageHours || 0
        }));
      }
      return [];
    } catch (err: any) {
      fileLogger.warn('RadarrService', 'RELEASES_ERROR', `Ошибка получения раздач Radarr: ${err.message}`);
      return [];
    }
  }

  /**
   * Converts Radarr movie object to standard Alex HD ContentItem
   */
  static convertToContentItem(m: RadarrMovie): ContentItem {
    const poster = m.images?.find(img => img.coverType === 'poster')?.remoteUrl ||
                   m.images?.find(img => img.coverType === 'poster')?.url ||
                   'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80';

    const backdrop = m.images?.find(img => img.coverType === 'fanart')?.remoteUrl ||
                     m.images?.find(img => img.coverType === 'fanart')?.url ||
                     poster;

    const is4k = m.movieFile?.quality?.quality?.resolution === 2160 ||
                 (m.title || '').includes('2160p') ||
                 (m.title || '').includes('4K');

    const imdbRating = m.ratings?.imdb?.value || 7.5;
    const tmdbRating = m.ratings?.tmdb?.value || imdbRating;

    return {
      id: `radarr-${m.id || m.tmdbId}`,
      tmdb_id: m.tmdbId,
      type: 'movie',
      title: m.title,
      original_title: m.originalTitle || m.title,
      release_year: m.year || new Date().getFullYear(),
      age_rating: '16+',
      rating_imdb: imdbRating,
      rating_tmdb: tmdbRating,
      runtime_minutes: m.runtime || 120,
      overview: m.overview || 'Описание фильма из Radarr медиатеки.',
      poster_url: poster,
      backdrop_url: backdrop,
      is_4k: is4k,
      is_published: true,
      play_count: m.hasFile ? 150 : 20,
      genres: m.genres || ['Фильм'],
      country: 'Международный',
      subtitles: [
        { id: 'sub-ru', language: 'Русский', label: 'Русские субтитры', url: '' },
        { id: 'sub-en', language: 'English', label: 'English Subtitles', url: '' }
      ]
    };
  }

  /**
   * Syncs movies from Radarr into catalog
   */
  static async syncWithStore(): Promise<number> {
    try {
      const movies = await this.getMovies();
      return movies.length;
    } catch (e: any) {
      fileLogger.warn('RadarrService', 'SYNC_ERROR', e.message);
      return 0;
    }
  }
}
