import { ContentItem } from '../types';

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBCast {
  id: number;
  name: string;
  original_name: string;
  character?: string;
  roles?: Array<{ character: string; episode_count: number }>;
  profile_path: string | null;
  order?: number;
  known_for_department?: string;
}

export interface TMDBCrew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBCredits {
  cast: TMDBCast[];
  crew: TMDBCrew[];
}

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  runtime?: number;
  genres?: TMDBGenre[];
  adult?: boolean;
  credits?: TMDBCredits;
  videos?: {
    results: Array<{
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
    }>;
  };
}

export interface TMDBSeasonSummary {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  air_date: string | null;
  episode_count: number;
}

export interface TMDBEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  vote_average: number;
  runtime?: number;
  crew?: TMDBCrew[];
  guest_stars?: TMDBCast[];
}

export interface TMDBSeasonDetails extends TMDBSeasonSummary {
  episodes: TMDBEpisode[];
}

export interface TMDBSeries {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date?: string;
  vote_average: number;
  vote_count: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  genres?: TMDBGenre[];
  seasons?: TMDBSeasonSummary[];
  credits?: TMDBCredits;
  aggregate_credits?: TMDBCredits;
  external_ids?: {
    imdb_id?: string;
    tvdb_id?: number;
    freebase_id?: string;
    instagram_id?: string;
    twitter_id?: string;
  };
}

export interface TMDBPerson {
  id: number;
  name: string;
  biography?: string;
  birthday?: string | null;
  deathday?: string | null;
  place_of_birth?: string | null;
  profile_path: string | null;
  known_for_department?: string;
  movie_credits?: { cast: TMDBMovie[]; crew: any[] };
  tv_credits?: { cast: TMDBSeries[]; crew: any[] };
}

export interface TMDBPaginatedResult<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export class TMDBApiError extends Error {
  constructor(
    public statusCode: number,
    public endpoint: string,
    message: string
  ) {
    super(`TMDB Error (${statusCode}) on ${endpoint}: ${message}`);
    this.name = 'TMDBApiError';
  }
}

/**
 * Retrieve TMDB API key from available environment sources
 */
export function getTMDBApiKey(): string {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_TMDB_API_KEY) {
    return (import.meta as any).env.VITE_TMDB_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env?.TMDB_API_KEY) {
    return process.env.TMDB_API_KEY;
  }
  return '';
}

/**
 * Format poster / backdrop / profile image URL with fallback image support
 */
export function getTMDBImageUrl(
  path: string | null | undefined,
  size: 'w300' | 'w500' | 'w780' | 'original' = 'w500'
): string {
  if (!path) {
    return 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&auto=format&fit=crop&q=80';
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `https://image.tmdb.org/t/p/${size}${path.startsWith('/') ? path : `/${path}`}`;
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Low-level TMDB fetch helper with error handling
 */
export async function fetchTMDB<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const apiKey = getTMDBApiKey();

  // If client-side API key is not set, attempt backend proxy fetch
  if (!apiKey) {
    try {
      const proxyRes = await fetch(
        `/api/v1/metadata/search?q=${encodeURIComponent(params.query || '')}&provider=tmdb`
      );
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData && proxyData.results) {
          return { results: proxyData.results } as unknown as T;
        }
      }
    } catch {
      // Fallback to error throwing below
    }
    throw new TMDBApiError(
      401,
      endpoint,
      'TMDB_API_KEY is missing. Please configure VITE_TMDB_API_KEY or TMDB_API_KEY in .env'
    );
  }

  const queryParams = new URLSearchParams({
    api_key: apiKey,
    language: params.language || 'ru-RU',
    ...params,
  });

  const url = `${TMDB_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorJson = await response.json();
        if (errorJson.status_message) {
          errorDetail = errorJson.status_message;
        }
      } catch {
        // Ignore json parse error
      }
      throw new TMDBApiError(response.status, endpoint, errorDetail);
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof TMDBApiError) {
      throw err;
    }
    throw new TMDBApiError(500, endpoint, (err as Error).message || 'Network request failed');
  }
}

// ==========================================
// MOVIE API FUNCTIONS
// ==========================================

export async function getMovieDetails(movieId: number | string): Promise<TMDBMovie> {
  return fetchTMDB<TMDBMovie>(`/movie/${movieId}`, {
    append_to_response: 'credits,videos',
  });
}

export async function getMovieCredits(movieId: number | string): Promise<TMDBCredits> {
  return fetchTMDB<TMDBCredits>(`/movie/${movieId}/credits`);
}

export async function searchMovies(
  query: string,
  page: number = 1
): Promise<TMDBPaginatedResult<TMDBMovie>> {
  if (!query.trim()) {
    return { page: 1, results: [], total_pages: 0, total_results: 0 };
  }
  return fetchTMDB<TMDBPaginatedResult<TMDBMovie>>('/search/movie', {
    query,
    page: page.toString(),
    include_adult: 'false',
  });
}

// ==========================================
// TV / SERIES API FUNCTIONS & ERROR HANDLING
// ==========================================

export async function getSeriesDetails(seriesId: number | string): Promise<TMDBSeries> {
  try {
    return await fetchTMDB<TMDBSeries>(`/tv/${seriesId}`, {
      append_to_response: 'credits,aggregate_credits,external_ids,videos',
    });
  } catch (err) {
    if (err instanceof TMDBApiError && err.statusCode === 404) {
      throw new TMDBApiError(404, `/tv/${seriesId}`, `TV series with ID ${seriesId} was not found on TMDB.`);
    }
    throw err;
  }
}

export async function getSeriesCredits(seriesId: number | string): Promise<TMDBCredits> {
  try {
    return await fetchTMDB<TMDBCredits>(`/tv/${seriesId}/credits`);
  } catch (err) {
    // Return empty fallback credits if series credits failed
    return { cast: [], crew: [] };
  }
}

export async function getSeriesAggregateCredits(seriesId: number | string): Promise<TMDBCredits> {
  try {
    return await fetchTMDB<TMDBCredits>(`/tv/${seriesId}/aggregate_credits`);
  } catch (err) {
    return { cast: [], crew: [] };
  }
}

export async function getSeriesSeasonDetails(
  seriesId: number | string,
  seasonNumber: number
): Promise<TMDBSeasonDetails> {
  try {
    return await fetchTMDB<TMDBSeasonDetails>(`/tv/${seriesId}/season/${seasonNumber}`);
  } catch (err) {
    if (err instanceof TMDBApiError && err.statusCode === 404) {
      throw new TMDBApiError(
        404,
        `/tv/${seriesId}/season/${seasonNumber}`,
        `Season ${seasonNumber} for TV Series ${seriesId} does not exist.`
      );
    }
    throw err;
  }
}

export async function getTVEpisodeDetails(
  seriesId: number | string,
  seasonNumber: number,
  episodeNumber: number
): Promise<TMDBEpisode> {
  try {
    return await fetchTMDB<TMDBEpisode>(
      `/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`
    );
  } catch (err) {
    if (err instanceof TMDBApiError && err.statusCode === 404) {
      throw new TMDBApiError(
        404,
        `/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`,
        `Episode ${episodeNumber} in Season ${seasonNumber} for TV series ${seriesId} was not found.`
      );
    }
    throw err;
  }
}

export async function getTVExternalIds(seriesId: number | string): Promise<Record<string, any>> {
  try {
    return await fetchTMDB<Record<string, any>>(`/tv/${seriesId}/external_ids`);
  } catch (err) {
    return {};
  }
}

export async function searchSeries(
  query: string,
  page: number = 1
): Promise<TMDBPaginatedResult<TMDBSeries>> {
  if (!query.trim()) {
    return { page: 1, results: [], total_pages: 0, total_results: 0 };
  }
  return fetchTMDB<TMDBPaginatedResult<TMDBSeries>>('/search/tv', {
    query,
    page: page.toString(),
    include_adult: 'false',
  });
}

// ==========================================
// PERSON / CAST API FUNCTIONS
// ==========================================

export async function getCastDetails(personId: number | string): Promise<TMDBPerson> {
  try {
    return await fetchTMDB<TMDBPerson>(`/person/${personId}`, {
      append_to_response: 'movie_credits,tv_credits',
    });
  } catch (err) {
    if (err instanceof TMDBApiError && err.statusCode === 404) {
      throw new TMDBApiError(404, `/person/${personId}`, `Cast/Person with ID ${personId} was not found.`);
    }
    throw err;
  }
}

// ==========================================
// SEARCH & TRENDING
// ==========================================

export async function searchMulti(
  query: string,
  page: number = 1
): Promise<TMDBPaginatedResult<TMDBMovie | TMDBSeries | TMDBPerson>> {
  if (!query.trim()) {
    return { page: 1, results: [], total_pages: 0, total_results: 0 };
  }
  return fetchTMDB<TMDBPaginatedResult<TMDBMovie | TMDBSeries | TMDBPerson>>('/search/multi', {
    query,
    page: page.toString(),
    include_adult: 'false',
  });
}

export async function getTrending(
  mediaType: 'all' | 'movie' | 'tv' | 'person' = 'all',
  timeWindow: 'day' | 'week' = 'day'
): Promise<TMDBPaginatedResult<any>> {
  return fetchTMDB<TMDBPaginatedResult<any>>(`/trending/${mediaType}/${timeWindow}`);
}

// ==========================================
// DATA FORMATTING CONVERTERS
// ==========================================

export function formatTMDBMovieToContent(movie: TMDBMovie): ContentItem {
  const releaseYear = movie.release_date
    ? parseInt(movie.release_date.split('-')[0], 10)
    : new Date().getFullYear();

  const directorObj = movie.credits?.crew?.find((c) => c.job === 'Director');

  return {
    id: `tmdb-movie-${movie.id}`,
    tmdb_id: movie.id,
    type: 'movie',
    title: movie.title || 'Untitled Movie',
    original_title: movie.original_title || movie.title || '',
    release_year: releaseYear,
    age_rating: movie.adult ? '18+' : '12+',
    rating_imdb: Math.round((movie.vote_average || 7.0) * 10) / 10,
    rating_tmdb: Math.round((movie.vote_average || 7.0) * 10) / 10,
    runtime_minutes: movie.runtime || 120,
    overview: movie.overview || 'No overview available.',
    poster_url: getTMDBImageUrl(movie.poster_path, 'w500'),
    backdrop_url: getTMDBImageUrl(movie.backdrop_path || movie.poster_path, 'w780'),
    is_4k: true,
    is_published: true,
    play_count: movie.vote_count || 100,
    genres: movie.genres?.map((g) => g.name) || ['Movie'],
    director: directorObj?.name || 'Unknown',
    cast: movie.credits?.cast?.slice(0, 6).map((c) => c.name) || [],
  };
}

export function formatTMDBSeriesToContent(series: TMDBSeries): ContentItem {
  const releaseYear = series.first_air_date
    ? parseInt(series.first_air_date.split('-')[0], 10)
    : new Date().getFullYear();

  const castList =
    series.aggregate_credits?.cast?.slice(0, 6).map((c) => c.name) ||
    series.credits?.cast?.slice(0, 6).map((c) => c.name) ||
    [];

  return {
    id: `tmdb-series-${series.id}`,
    tmdb_id: series.id,
    type: 'series',
    title: series.name || 'Untitled Series',
    original_title: series.original_name || series.name || '',
    release_year: releaseYear,
    age_rating: '16+',
    rating_imdb: Math.round((series.vote_average || 7.5) * 10) / 10,
    rating_tmdb: Math.round((series.vote_average || 7.5) * 10) / 10,
    runtime_minutes: series.episode_run_time?.[0] || 45,
    overview: series.overview || 'No overview available.',
    poster_url: getTMDBImageUrl(series.poster_path, 'w500'),
    backdrop_url: getTMDBImageUrl(series.backdrop_path || series.poster_path, 'w780'),
    is_4k: true,
    is_published: true,
    play_count: series.vote_count || 100,
    genres: series.genres?.map((g) => g.name) || ['Series'],
    director: 'TV Network',
    cast: castList,
  };
}
