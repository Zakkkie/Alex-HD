import { config } from '../../config/env.js';
import { fileLogger } from '../../logger/fileLogger.js';

export interface ProwlarrIndexer {
  id: number;
  name: string;
  enable: boolean;
  protocol: 'torrent' | 'usenet';
  privacy: 'public' | 'semi-private' | 'private';
  capabilities?: {
    categories?: Array<{ id: number; name: string }>;
  };
}

export interface ProwlarrSearchResult {
  guid: string;
  title: string;
  size: number;
  formattedSize: string;
  downloadUrl?: string;
  magnetUrl?: string;
  infoHash?: string;
  indexer: string;
  indexerId?: number;
  seeders: number;
  leechers: number;
  publishDate?: string;
  quality: '4k' | '1080p' | '720p' | 'sd';
  resolution: string;
  codec: 'hevc' | 'h264' | 'av1';
  hdr: boolean;
  hdrFormat?: string; // HDR10+, Dolby Vision, HDR
  audioTracks: string[]; // Дубляж, МВО, LostFilm, Original Atmos, etc.
  isRepack?: boolean;
}

export class ProwlarrService {
  private static getBaseUrl(): string {
    return (config.prowlarrUrl || 'http://172.19.0.5:9696').replace(/\/+$/, '');
  }

  private static getApiKey(): string {
    return config.prowlarrKey || '';
  }

  /**
   * Tests Prowlarr health and returns active indexers
   */
  static async getStatus(): Promise<{
    online: boolean;
    version?: string;
    url: string;
    indexersCount?: number;
    indexers?: string[];
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

      const res = await fetch(`${url}/api/v1/system/status`, {
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (res.ok) {
        const data = await res.json();
        let indexers: string[] = [];

        try {
          const idxRes = await fetch(`${url}/api/v1/indexer`, {
            headers,
            signal: AbortSignal.timeout(3000)
          });
          if (idxRes.ok) {
            const idxList: ProwlarrIndexer[] = await idxRes.json();
            if (Array.isArray(idxList)) {
              indexers = idxList.filter(i => i.enable).map(i => i.name);
            }
          }
        } catch {
          // ignore
        }

        fileLogger.info('ProwlarrService', 'STATUS_OK', `Prowlarr подключен (${url})`, { version: data.version, indexersCount: indexers.length, latencyMs });
        return {
          online: true,
          version: data.version || 'v1',
          url,
          indexersCount: indexers.length,
          indexers,
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
        error: e.name === 'AbortError' ? 'Таймаут соединения (4000ms)' : (e.message || 'Prowlarr недоступен')
      };
    }
  }

  /**
   * Search torrent indexers through Prowlarr
   */
  static async search(opts: {
    query: string;
    type?: 'movie' | 'tv';
    imdbId?: string;
    tmdbId?: number;
    season?: number;
    episode?: number;
    limit?: number;
  }): Promise<ProwlarrSearchResult[]> {
    const url = this.getBaseUrl();
    const apiKey = this.getApiKey();

    if (!apiKey) {
      fileLogger.warn('ProwlarrService', 'NO_API_KEY', 'Prowlarr API ключ не настроен');
      return [];
    }

    try {
      let searchQuery = opts.query.trim();
      if (opts.season !== undefined && opts.season > 0) {
        const sStr = opts.season < 10 ? `S0${opts.season}` : `S${opts.season}`;
        if (opts.episode !== undefined && opts.episode > 0) {
          const eStr = opts.episode < 10 ? `E0${opts.episode}` : `E${opts.episode}`;
          searchQuery = `${searchQuery} ${sStr}${eStr}`;
        } else {
          searchQuery = `${searchQuery} ${sStr}`;
        }
      }

      const categories = opts.type === 'tv' ? '5000' : opts.type === 'movie' ? '2000' : '2000,5000';
      const endpoint = `${url}/api/v1/search?query=${encodeURIComponent(searchQuery)}&categories=${categories}&type=search&limit=${opts.limit || 40}`;

      const headers: Record<string, string> = { 'Accept': 'application/json' };
      headers['X-Api-Key'] = apiKey;

      const res = await fetch(endpoint, {
        headers,
        signal: AbortSignal.timeout(9000)
      });

      if (!res.ok) {
        throw new Error(`Prowlarr HTTP ${res.status}`);
      }

      const rawResults = await res.json();
      if (!Array.isArray(rawResults)) return [];

      const parsed: ProwlarrSearchResult[] = rawResults.map(item => {
        const title = item.title || '';
        const sizeBytes = item.size || 0;
        const seeders = item.seeders || 0;
        const leechers = item.leechers || 0;

        let quality: '4k' | '1080p' | '720p' | 'sd' = '1080p';
        let resolution = '1080p';
        if (/2160p|4k|uhd/i.test(title)) {
          quality = '4k';
          resolution = '2160p (4K)';
        } else if (/720p|hd/i.test(title) && !/1080p/i.test(title)) {
          quality = '720p';
          resolution = '720p (HD)';
        } else if (/sd|dvdrip|hdtv/i.test(title) && !/1080|720|2160/i.test(title)) {
          quality = 'sd';
          resolution = 'SD (576p)';
        }

        const codec: 'hevc' | 'h264' | 'av1' = /av1/i.test(title) ? 'av1' : /x265|hevc|h265/i.test(title) ? 'hevc' : 'h264';
        const hdr = /hdr|dovi|dolby\s*vision|hdr10/i.test(title);
        let hdrFormat: string | undefined;
        if (/dolby\s*vision|dovi/i.test(title)) hdrFormat = 'Dolby Vision';
        else if (/hdr10\+/i.test(title)) hdrFormat = 'HDR10+';
        else if (/hdr/i.test(title)) hdrFormat = 'HDR';

        // Extract audio dubbing / audio tracks info
        const audioTracks: string[] = [];
        if (/дубляж|dub/i.test(title)) audioTracks.push('Дубляж');
        if (/mvo|мво|многоголосый/i.test(title)) audioTracks.push('Многоголосый');
        if (/red\s*head\s*sound|rhs/i.test(title)) audioTracks.push('Red Head Sound');
        if (/lostfilm/i.test(title)) audioTracks.push('LostFilm');
        if (/hdrezka|rezka/i.test(title)) audioTracks.push('HDRezka');
        if (/кубик\s*в\s*кубе|kubik/i.test(title)) audioTracks.push('Кубик в Кубе');
        if (/alexfilm/i.test(title)) audioTracks.push('AlexFilm');
        if (/atmos|dolby\s*atmos/i.test(title)) audioTracks.push('Dolby Atmos');
        if (/dts|5\.1|7\.1/i.test(title)) audioTracks.push('5.1 Surround');
        if (audioTracks.length === 0) {
          audioTracks.push(/rus|рус/i.test(title) ? 'Русский' : 'Оригинал / Multi');
        }

        const sizeGb = (sizeBytes / (1024 * 1024 * 1024)).toFixed(1);
        const formattedSize = sizeBytes > 1024 * 1024 * 1024 ? `${sizeGb} ГБ` : `${(sizeBytes / (1024 * 1024)).toFixed(0)} МБ`;

        const magnetUrl = item.magnetUrl || item.guid || item.downloadUrl;

        return {
          guid: item.guid || item.infoHash || Math.random().toString(36).substring(2, 10),
          title,
          size: sizeBytes,
          formattedSize,
          downloadUrl: item.downloadUrl,
          magnetUrl,
          infoHash: item.infoHash,
          indexer: item.indexer || 'Prowlarr',
          indexerId: item.indexerId,
          seeders,
          leechers,
          publishDate: item.publishDate,
          quality,
          resolution,
          codec,
          hdr,
          hdrFormat,
          audioTracks,
          isRepack: /repack|proper/i.test(title)
        };
      });

      // Sort by seeders descending, then size
      parsed.sort((a, b) => b.seeders - a.seeders);

      return parsed;
    } catch (err: any) {
      fileLogger.warn('ProwlarrService', 'SEARCH_ERROR', `Ошибка поиска Prowlarr: ${err.message}`);
      return [];
    }
  }
}
