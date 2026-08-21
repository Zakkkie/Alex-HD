import { config } from '../../config/env.js';
import { fileLogger } from '../../logger/fileLogger.js';
import { ContentItem, Season, Episode } from '../../../../src/types.js';

export interface SonarrSeries {
  id: number;
  title: string;
  originalTitle?: string;
  sortTitle?: string;
  seasonCount: number;
  status: string;
  overview?: string;
  network?: string;
  airTime?: string;
  images?: Array<{
    coverType: 'poster' | 'fanart' | 'banner' | 'screenshot' | 'clearlogo';
    url?: string;
    remoteUrl?: string;
  }>;
  seasons?: Array<{
    seasonNumber: number;
    monitored: boolean;
    statistics?: {
      episodeFileCount: number;
      episodeCount: number;
      totalEpisodeCount: number;
      sizeOnDisk: number;
    };
  }>;
  year: number;
  tvdbId: number;
  tvRageId?: number;
  tvMazeId?: number;
  tmdbId?: number;
  genres?: string[];
  ratings?: {
    imdb?: { value: number };
    tmdb?: { value: number };
  };
  statistics?: {
    seasonCount: number;
    episodeFileCount: number;
    episodeCount: number;
    totalEpisodeCount: number;
    sizeOnDisk: number;
  };
}

export interface SonarrEpisode {
  id: number;
  seriesId: number;
  tvdbId?: number;
  episodeFileId?: number;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  airDate?: string;
  airDateUtc?: string;
  overview?: string;
  hasFile: boolean;
  monitored: boolean;
  runtime?: number;
  images?: Array<{
    coverType: 'screenshot';
    url?: string;
    remoteUrl?: string;
  }>;
  episodeFile?: {
    id: number;
    relativePath: string;
    size: number;
    quality: {
      quality: { name: string; resolution: number };
    };
  };
}

export interface SonarrRelease {
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
  };
  customFormats?: Array<{ name: string }>;
  ageHours?: number;
}

export class SonarrService {
  private static getBaseUrl(): string {
    return (config.sonarrUrl || 'http://172.19.0.9:8989').replace(/\/+$/, '');
  }

  private static getApiKey(): string {
    return config.sonarrApiKey || '';
  }

  /**
   * Tests connection to Sonarr instance
   */
  static async getStatus(): Promise<{
    online: boolean;
    version?: string;
    url: string;
    seriesCount?: number;
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
        let seriesCount = 0;

        try {
          const seriesRes = await fetch(`${url}/api/v3/series`, {
            headers,
            signal: AbortSignal.timeout(3000)
          });
          if (seriesRes.ok) {
            const seriesList = await seriesRes.json();
            if (Array.isArray(seriesList)) {
              seriesCount = seriesList.length;
            }
          }
        } catch {
          // ignore
        }

        fileLogger.info('SonarrService', 'STATUS_OK', `Sonarr подключен (${url})`, { version: data.version, seriesCount, latencyMs });
        return {
          online: true,
          version: data.version || 'v4',
          url,
          seriesCount,
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
        error: e.name === 'AbortError' ? 'Таймаут соединения (4000ms)' : (e.message || 'Sonarr недоступен')
      };
    }
  }

  /**
   * Fetches all series from Sonarr library
   */
  static async getSeries(): Promise<ContentItem[]> {
    const url = this.getBaseUrl();
    const apiKey = this.getApiKey();

    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (apiKey) headers['X-Api-Key'] = apiKey;

      const res = await fetch(`${url}/api/v3/series`, {
        headers,
        signal: AbortSignal.timeout(5000)
      });

      if (!res.ok) {
        throw new Error(`Sonarr HTTP ${res.status}`);
      }

      const list: SonarrSeries[] = await res.json();
      if (!Array.isArray(list)) return [];

      return list.map(s => this.convertToContentItem(s));
    } catch (err: any) {
      fileLogger.warn('SonarrService', 'GET_SERIES_ERROR', `Не удалось получить сериалы из Sonarr: ${err.message}`);
      return [];
    }
  }

  /**
   * Look up series by title/TVDB in Sonarr
   */
  static async lookup(term: string): Promise<ContentItem[]> {
    const url = this.getBaseUrl();
    const apiKey = this.getApiKey();

    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (apiKey) headers['X-Api-Key'] = apiKey;

      const res = await fetch(`${url}/api/v3/series/lookup?term=${encodeURIComponent(term)}`, {
        headers,
        signal: AbortSignal.timeout(5000)
      });

      if (!res.ok) {
        throw new Error(`Sonarr HTTP ${res.status}`);
      }

      const results: SonarrSeries[] = await res.json();
      if (!Array.isArray(results)) return [];

      return results.map(s => this.convertToContentItem(s));
    } catch (err: any) {
      fileLogger.warn('SonarrService', 'LOOKUP_ERROR', `Ошибка поиска сериалов в Sonarr: ${err.message}`);
      return [];
    }
  }

  /**
   * Get all episodes for a series from Sonarr
   */
  static async getEpisodes(seriesId: number | string): Promise<SonarrEpisode[]> {
    const url = this.getBaseUrl();
    const apiKey = this.getApiKey();

    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (apiKey) headers['X-Api-Key'] = apiKey;

      const res = await fetch(`${url}/api/v3/episode?seriesId=${seriesId}`, {
        headers,
        signal: AbortSignal.timeout(6000)
      });

      if (!res.ok) return [];

      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err: any) {
      fileLogger.warn('SonarrService', 'GET_EPISODES_ERROR', `Ошибка получения серий из Sonarr: ${err.message}`);
      return [];
    }
  }

  /**
   * Fetch available releases (torrents) for a series or episode from Sonarr indexers
   */
  static async getReleases(seriesId: number | string, episodeId?: number | string): Promise<SonarrRelease[]> {
    const url = this.getBaseUrl();
    const apiKey = this.getApiKey();

    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (apiKey) headers['X-Api-Key'] = apiKey;

      let endpoint = `${url}/api/v3/release?seriesId=${seriesId}`;
      if (episodeId) {
        endpoint += `&episodeId=${episodeId}`;
      }

      const res = await fetch(endpoint, {
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
          indexer: r.indexer || 'Prowlarr / Sonarr',
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
      fileLogger.warn('SonarrService', 'RELEASES_ERROR', `Ошибка получения раздач Sonarr: ${err.message}`);
      return [];
    }
  }

  /**
   * Convert Sonarr Series to standard ContentItem with built-in seasons and episodes
   */
  static convertToContentItem(s: SonarrSeries, episodes: SonarrEpisode[] = []): ContentItem {
    const poster = s.images?.find(img => img.coverType === 'poster')?.remoteUrl ||
                   s.images?.find(img => img.coverType === 'poster')?.url ||
                   'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';

    const backdrop = s.images?.find(img => img.coverType === 'fanart')?.remoteUrl ||
                     s.images?.find(img => img.coverType === 'fanart')?.url ||
                     poster;

    const imdbRating = s.ratings?.imdb?.value || 8.0;
    const tmdbRating = s.ratings?.tmdb?.value || imdbRating;

    // Group episodes by season number
    const seasonMap = new Map<number, Episode[]>();
    for (const ep of episodes) {
      if (ep.seasonNumber === 0) continue; // skip specials if preferred
      if (!seasonMap.has(ep.seasonNumber)) {
        seasonMap.set(ep.seasonNumber, []);
      }

      const epStill = ep.images?.find(i => i.coverType === 'screenshot')?.remoteUrl ||
                      ep.images?.find(i => i.coverType === 'screenshot')?.url ||
                      backdrop;

      seasonMap.get(ep.seasonNumber)!.push({
        id: `sonarr-ep-${ep.id}`,
        season_id: `sonarr-s-${s.id}-${ep.seasonNumber}`,
        episode_number: ep.episodeNumber,
        title: ep.title || `Серия ${ep.episodeNumber}`,
        overview: ep.overview || 'Смотрите продолжение сюжетной линии в этой серии.',
        runtime_minutes: ep.runtime || 45,
        still_url: epStill,
        air_date: ep.airDate
      });
    }

    const seasons: Season[] = [];
    const validSeasons = s.seasons?.filter(sea => sea.seasonNumber > 0) || [];
    
    if (validSeasons.length > 0) {
      for (const sea of validSeasons) {
        const eps = seasonMap.get(sea.seasonNumber) || [];
        seasons.push({
          id: `sonarr-s-${s.id}-${sea.seasonNumber}`,
          content_id: `sonarr-${s.id || s.tvdbId}`,
          season_number: sea.seasonNumber,
          title: `Сезон ${sea.seasonNumber}`,
          overview: `Все серии ${sea.seasonNumber}-го сезона телесериала ${s.title}.`,
          poster_url: poster,
          episodes: eps
        });
      }
    } else if (seasonMap.size > 0) {
      for (const [seasonNum, eps] of seasonMap.entries()) {
        seasons.push({
          id: `sonarr-s-${s.id}-${seasonNum}`,
          content_id: `sonarr-${s.id || s.tvdbId}`,
          season_number: seasonNum,
          title: `Сезон ${seasonNum}`,
          overview: `Сезон ${seasonNum} сериала ${s.title}`,
          poster_url: poster,
          episodes: eps
        });
      }
    }

    return {
      id: `sonarr-${s.id || s.tvdbId}`,
      tmdb_id: s.tmdbId || s.tvdbId,
      type: 'series',
      title: s.title,
      original_title: s.originalTitle || s.title,
      release_year: s.year || new Date().getFullYear(),
      age_rating: '16+',
      rating_imdb: imdbRating,
      rating_tmdb: tmdbRating,
      runtime_minutes: 48,
      overview: s.overview || 'Описание сериала из Sonarr медиатеки.',
      poster_url: poster,
      backdrop_url: backdrop,
      is_4k: (s.title || '').includes('4K') || (s.title || '').includes('2160p'),
      is_published: true,
      play_count: 80,
      genres: s.genres || ['Сериал'],
      country: s.network || 'США',
      seasons: seasons.length > 0 ? seasons : undefined,
      subtitles: [
        { id: 'sub-ru', language: 'Русский', label: 'Русские субтитры', url: '' },
        { id: 'sub-en', language: 'English', label: 'English Subtitles', url: '' }
      ]
    };
  }

  /**
   * Syncs series from Sonarr into catalog
   */
  static async syncWithStore(): Promise<number> {
    try {
      const series = await this.getSeries();
      return series.length;
    } catch (e: any) {
      fileLogger.warn('SonarrService', 'SYNC_ERROR', e.message);
      return 0;
    }
  }
}
