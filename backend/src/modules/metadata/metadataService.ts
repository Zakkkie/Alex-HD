import { dbStore } from '../../db/store';
import { ContentItem, Season, Episode } from '../../../../src/types';

/**
 * TMDB API Client (The Movie Database v3/v4 API)
 */
export class TMDBClient {
  private static get apiKey(): string {
    return process.env.TMDB_API_KEY || '15d2ea6d0dc1d476efbca3eba2b9bbf3';
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
   * Get Movie Details + Credits
   */
  static async getMovieDetails(tmdbId: number | string) {
    return await this.fetchTMDB(`/movie/${tmdbId}`, {
      append_to_response: 'credits,videos',
    });
  }

  /**
   * Get TV Series Details + Seasons
   */
  static async getTVDetails(tmdbId: number | string) {
    return await this.fetchTMDB(`/tv/${tmdbId}`, {
      append_to_response: 'credits,videos',
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
  static async getTrending(type: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'day') {
    return await this.fetchTMDB(`/trending/${type}/${timeWindow}`);
  }

  /**
   * Convert TMDB raw data to application ContentItem
   */
  static convertToContentItem(data: any, type: 'movie' | 'series'): ContentItem {
    const isMovie = type === 'movie';
    const releaseDate = isMovie ? data.release_date : data.first_air_date;
    const releaseYear = releaseDate ? parseInt(releaseDate.split('-')[0], 10) : new Date().getFullYear();

    const genres = data.genres ? data.genres.map((g: any) => g.name) : ['Кино'];

    let director = 'Неизвестно';
    const crew_members: any[] = [];
    if (data.credits && data.credits.crew) {
      const directorObj = data.credits.crew.find((c: any) => c.job === 'Director');
      if (directorObj) director = directorObj.name;
      
      data.credits.crew.slice(0, 8).forEach((c: any) => {
        crew_members.push({
          id: c.id,
          name: c.name,
          job: c.job,
          department: c.department,
          profile_path: c.profile_path ? this.getImageUrl(c.profile_path, 'w500') : null
        });
      });
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

    return {
      id: `tmdb-${type}-${data.id}`,
      tmdb_id: data.id,
      type,
      title: isMovie ? data.title : data.name,
      original_title: isMovie ? data.original_title : data.original_name,
      release_year: releaseYear,
      age_rating: data.adult ? '18+' : '12+',
      rating_imdb: Math.round((data.vote_average || 7.5) * 10) / 10,
      rating_tmdb: Math.round((data.vote_average || 7.5) * 10) / 10,
      runtime_minutes: isMovie ? (data.runtime || 120) : (data.episode_run_time?.[0] || 45),
      overview: data.overview || 'Описание недоступно.',
      poster_url: this.getImageUrl(data.poster_path, 'w500'),
      backdrop_url: this.getImageUrl(data.backdrop_path || data.poster_path, 'w780'),
      is_4k: true,
      is_published: true,
      play_count: Math.floor(Math.random() * 5000) + 100,
      genres,
      director,
      cast,
      cast_members,
      crew_members,
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
export class MetadataService {
  /**
   * Test API connections
   */
  static getStatus() {
    return {
      tmdb: {
        configured: Boolean(process.env.TMDB_API_KEY),
        key_preview: process.env.TMDB_API_KEY ? `${process.env.TMDB_API_KEY.substring(0, 4)}...` : null,
      },
      tvdb: {
        configured: Boolean(process.env.TVDB_API_KEY),
        key_preview: process.env.TVDB_API_KEY ? `${process.env.TVDB_API_KEY.substring(0, 4)}...` : null,
      },
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
      if (process.env.TMDB_API_KEY) {
        try {
          const [movies, tvShows] = await Promise.all([
            TMDBClient.searchMovies(query),
            TMDBClient.searchTVShows(query),
          ]);

          movies.results?.slice(0, 5).forEach((m: any) => {
            results.push({
              source: 'tmdb',
              type: 'movie',
              id: m.id,
              title: m.title,
              original_title: m.original_title,
              year: m.release_date ? m.release_date.split('-')[0] : 'N/A',
              rating: m.vote_average,
              poster_url: TMDBClient.getImageUrl(m.poster_path, 'w500'),
              overview: m.overview,
            });
          });

          tvShows.results?.slice(0, 5).forEach((s: any) => {
            results.push({
              source: 'tmdb',
              type: 'series',
              id: s.id,
              title: s.name,
              original_title: s.original_name,
              year: s.first_air_date ? s.first_air_date.split('-')[0] : 'N/A',
              rating: s.vote_average,
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
      } else {
        errors.push('TVDB_API_KEY не настроен в .env');
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
    let addedCount = 0;
    try {
      const [trending, popularMovies, popularTV] = await Promise.all([
        TMDBClient.getTrending('all', 'day').catch(() => ({ results: [] })),
        TMDBClient.fetchTMDB('/movie/popular').catch(() => ({ results: [] })),
        TMDBClient.fetchTMDB('/tv/popular').catch(() => ({ results: [] }))
      ]);

      const itemsToProcess: Array<{ raw: any; type: 'movie' | 'series' }> = [];

      if (trending.results) {
        trending.results.forEach((r: any) => {
          itemsToProcess.push({
            raw: r,
            type: r.media_type === 'tv' ? 'series' : 'movie'
          });
        });
      }
      if (popularMovies.results) {
        popularMovies.results.forEach((r: any) => {
          itemsToProcess.push({ raw: r, type: 'movie' });
        });
      }
      if (popularTV.results) {
        popularTV.results.forEach((r: any) => {
          itemsToProcess.push({ raw: r, type: 'series' });
        });
      }

      for (const item of itemsToProcess) {
        if (!item.raw || (!item.raw.title && !item.raw.name)) continue;
        const formatted = TMDBClient.convertToContentItem(item.raw, item.type);

        const exists = dbStore.content.some(
          (c) => c.id === formatted.id || (c.tmdb_id && c.tmdb_id === formatted.tmdb_id)
        );

        if (!exists) {
          dbStore.content.push(formatted);
          addedCount++;
        }
      }
      console.log(`[TMDB Auto-Sync] Automatically populated ${addedCount} content items from TMDB.`);
    } catch (err) {
      console.error('[TMDB Auto-Sync] Error auto-populating from TMDB:', err);
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
