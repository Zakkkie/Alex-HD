import { dbStore } from '../../db/store';
import { HomePayload, ContentItem, Collection, WatchHistoryItem, Season, Episode } from '../../../../src/types';
import { TMDBClient, MetadataService } from '../metadata/metadataService';
import { JellyseerrService } from '../metadata/jellyseerrService';

export class CatalogService {
  static getHomePayload(userId: string): HomePayload {
    const published = dbStore.content.filter(c => c.is_published);
    const hero = published.length > 0 ? published[0] : (undefined as any);

    const continueWatching = dbStore.history
      .filter(h => h.user_id === userId && !h.is_finished && h.position_seconds > 10)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10);

    const trending24h = [...published].sort((a, b) => b.play_count - a.play_count).slice(0, 10);
    const popular = [...published].sort((a, b) => (b.rating_imdb * 2000 + b.play_count) - (a.rating_imdb * 2000 + a.play_count)).slice(0, 12);
    const newReleases = [...published].sort((a, b) => b.release_year - a.release_year).slice(0, 12);
    const timelessClassics = [...published]
      .filter(c => (c.rating_imdb >= 8.2 || c.rating_tmdb >= 8.0))
      .sort((a, b) => b.rating_imdb - a.rating_imdb)
      .slice(0, 12);
    const fourKCollection = published.filter(c => c.is_4k);

    // Latest top movies (sorted by year and play count)
    const topMovies = [...published]
      .filter(c => c.type === 'movie')
      .sort((a, b) => b.release_year - a.release_year || b.play_count - a.play_count)
      .slice(0, 12);

    // Latest top series (sorted by year and play count)
    const topSeries = [...published]
      .filter(c => c.type === 'series')
      .sort((a, b) => b.release_year - a.release_year || b.play_count - a.play_count)
      .slice(0, 12);

    // Anime & Animation collection
    const anime = [...published]
      .filter(c => c.genres?.some(g => g === 'Аниме' || g === 'Мультфильм'))
      .sort((a, b) => b.rating_imdb - a.rating_imdb)
      .slice(0, 12);

    const collectionsWithItems = dbStore.collections.map(col => {
      let items = published;
      if (col.slug.includes('4k')) {
        items = published.filter(c => c.is_4k);
      } else if (col.slug.includes('sci-fi')) {
        items = published.filter(c => c.genres?.some(g => g.includes('Фантастика') || g.includes('Киберпанк')));
      }
      return { ...col, items };
    });

    const heroItems = published.filter(c => c.is_hero === true);

    const totalMoviesCount = published.filter(c => c.type === 'movie').length;
    const totalSeriesCount = published.filter(c => c.type === 'series').length;
    const totalCatalogCount = published.length;

    return {
      hero,
      heroItems,
      continueWatching,
      trending24h,
      popular,
      newReleases,
      timelessClassics,
      fourKCollection,
      collections: collectionsWithItems,
      anime,
      topMovies,
      topSeries,
      totalMoviesCount,
      totalSeriesCount,
      totalCatalogCount
    };
  }

  static async getCatalogItems(opts: {
    page?: number;
    limit?: number;
    type?: string;
    genre?: string;
    search?: string;
    sortBy?: string;
  }) {
    const page = Math.max(1, Number(opts.page) || 1);
    const limit = Math.max(10, Math.min(100, Number(opts.limit) || 50));
    const type = opts.type || 'all';

    if (dbStore.content.length < 1000) {
      MetadataService.autoPopulateFromTMDB().catch((err) => {
        console.error('Background catalog items population failed:', err);
      });
    }

    let items = dbStore.content.filter(c => c.is_published);

    if (type === 'movie' || type === 'movies') {
      items = items.filter(c => c.type === 'movie');
    } else if (type === 'series' || type === 'tv') {
      items = items.filter(c => c.type === 'series');
    } else if (type === 'anime') {
      items = items.filter(c => c.genres?.some(g => g.toLowerCase().includes('аниме') || g.toLowerCase().includes('мультфильм')));
    } else if (type === '4k') {
      items = items.filter(c => c.is_4k);
    } else if (type === 'new') {
      items = [...items].sort((a, b) => b.release_year - a.release_year);
    } else if (type === 'trending') {
      items = [...items].sort((a, b) => b.play_count - a.play_count);
    }

    if (opts.genre && opts.genre !== 'all') {
      const gLower = opts.genre.toLowerCase();
      items = items.filter(c => c.genres?.some(g => g.toLowerCase().includes(gLower)));
    }

    if (opts.search && opts.search.trim()) {
      const sLower = opts.search.toLowerCase().trim();
      items = items.filter(c =>
        c.title.toLowerCase().includes(sLower) ||
        (c.original_title && c.original_title.toLowerCase().includes(sLower)) ||
        (c.overview && c.overview.toLowerCase().includes(sLower))
      );
    }

    if (opts.sortBy === 'rating') {
      items = [...items].sort((a, b) => b.rating_imdb - a.rating_imdb);
    } else if (opts.sortBy === 'year') {
      items = [...items].sort((a, b) => b.release_year - a.release_year);
    } else if (opts.sortBy === 'popularity') {
      items = [...items].sort((a, b) => (b.play_count + b.rating_imdb * 1000) - (a.play_count + a.rating_imdb * 1000));
    }

    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);
    const hasMore = page < totalPages;

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages,
      hasMore
    };
  }

  static async getContentDetail(id: string, userId?: string) {
    let item = dbStore.content.find(c => c.id === id || (c.tmdb_id && String(c.tmdb_id) === String(id)));

    // If not found in memory, try fetching directly from Jellyseerr or TMDB
    if (!item) {
      try {
        let tmdbId: number | null = null;
        let type: 'movie' | 'series' = 'movie';

        if (id.startsWith('tmdb-movie-')) {
          tmdbId = parseInt(id.replace('tmdb-movie-', ''), 10);
          type = 'movie';
        } else if (id.startsWith('tmdb-tv-') || id.startsWith('tmdb-series-')) {
          tmdbId = parseInt(id.replace(/tmdb-(tv|series)-/, ''), 10);
          type = 'series';
        } else if (!isNaN(Number(id))) {
          tmdbId = Number(id);
          type = 'movie';
        }

        if (tmdbId) {
          // First attempt to fetch from Jellyseerr if enabled
          if (JellyseerrService.isEnabled()) {
            try {
              if (type === 'movie') {
                item = await JellyseerrService.getMovieDetails(tmdbId);
              } else {
                item = await JellyseerrService.getTVDetails(tmdbId);
              }
            } catch (seerrErr) {
              console.warn(`Jellyseerr lookup failed for ${tmdbId}, falling back to TMDB:`, seerrErr);
            }
          }

          // Fallback to TMDB directly if Jellyseerr didn't return item
          if (!item) {
            if (type === 'movie') {
              const raw = await TMDBClient.getMovieDetails(tmdbId);
              item = TMDBClient.convertToContentItem(raw, 'movie');
            } else {
              const raw = await TMDBClient.getTVDetails(tmdbId);
              item = TMDBClient.convertToContentItem(raw, 'series');
            }
          }

          if (item) {
            dbStore.content.push(item);
          }
        }
      } catch (err) {
        console.warn(`Could not dynamically fetch item ${id}:`, err);
      }
    }

    if (!item) return null;

    // Check if we need on-demand lazy enrichment of cast/crew/stills details from Jellyseerr or TMDB
    const needsDetailHydration = item.tmdb_id && (!item.cast_members || item.cast_members.length === 0 || !item.stills || item.stills.length === 0);
    if (needsDetailHydration) {
      try {
        let enriched: ContentItem | null = null;

        // Try Jellyseerr first
        if (JellyseerrService.isEnabled()) {
          try {
            enriched = item.type === 'movie'
              ? await JellyseerrService.getMovieDetails(item.tmdb_id)
              : await JellyseerrService.getTVDetails(item.tmdb_id);
          } catch (seerrHydrateErr) {
            // fallback
          }
        }

        // Fallback to TMDB
        if (!enriched) {
          if (item.type === 'movie') {
            const raw = await TMDBClient.getMovieDetails(item.tmdb_id);
            enriched = TMDBClient.convertToContentItem(raw, 'movie');
          } else {
            const raw = await TMDBClient.getTVDetails(item.tmdb_id);
            enriched = TMDBClient.convertToContentItem(raw, 'series');
          }
        }

        if (enriched) {
          const idx = dbStore.content.findIndex(c => c.id === item!.id);
          if (idx >= 0) {
            dbStore.content[idx] = {
              ...dbStore.content[idx],
              ...enriched,
              genres: enriched.genres && enriched.genres.length > 0 ? enriched.genres : dbStore.content[idx].genres,
              overview: enriched.overview || dbStore.content[idx].overview,
              director: (enriched.director && enriched.director !== 'Неизвестно') ? enriched.director : dbStore.content[idx].director,
              directorPhoto: enriched.directorPhoto || dbStore.content[idx].directorPhoto,
              directorId: enriched.directorId || dbStore.content[idx].directorId,
              cast: enriched.cast && enriched.cast.length > 0 ? enriched.cast : dbStore.content[idx].cast,
              cast_members: enriched.cast_members,
              crew_members: enriched.crew_members,
              stills: enriched.stills || dbStore.content[idx].stills,
              trailer_url: enriched.trailer_url || dbStore.content[idx].trailer_url,
              similar: enriched.similar || dbStore.content[idx].similar
            };
            item = dbStore.content[idx];
          }
        }
      } catch (err) {
        console.warn('Lazy credits hydration skipped:', err);
      }
    }

    // Increment play count
    item.play_count += 1;

    let seasons = undefined;
    if (item.type === 'series') {
      let existingSeasons = dbStore.seasons.filter(s => s.content_id === item!.id);

      // If no seasons generated yet and it has tmdb_id, generate rich seasons and fetch real episode data
      if (existingSeasons.length === 0 && item.tmdb_id) {
        try {
          const tvDetails = await TMDBClient.getTVDetails(item.tmdb_id);
          if (tvDetails.seasons && Array.isArray(tvDetails.seasons)) {
            for (const sData of tvDetails.seasons) {
              if (sData.season_number === 0) continue;
              const seasonId = `s-${item.id}-${sData.season_number}`;
              const newSeason: Season = {
                id: seasonId,
                content_id: item.id,
                season_number: sData.season_number,
                title: sData.name || `Сезон ${sData.season_number}`,
                overview: sData.overview || `Сезон ${sData.season_number} сериала ${item.title}`,
                poster_url: TMDBClient.getImageUrl(sData.poster_path, 'w500')
              };
              dbStore.seasons.push(newSeason);

              // Try fetching exact episodes for this season from TMDB
              let fetchedEpisodes = false;
              try {
                const seasonEpisodesRes = await TMDBClient.getTVSeason(item.tmdb_id, sData.season_number);
                if (seasonEpisodesRes.episodes && Array.isArray(seasonEpisodesRes.episodes) && seasonEpisodesRes.episodes.length > 0) {
                  seasonEpisodesRes.episodes.forEach((ep: any) => {
                    const epId = `ep-${seasonId}-${ep.episode_number}`;
                    dbStore.episodes.push({
                      id: epId,
                      season_id: seasonId,
                      episode_number: ep.episode_number,
                      title: ep.name || `Серия ${ep.episode_number}`,
                      overview: ep.overview || `Эпизод ${ep.episode_number} сезона ${sData.season_number}.`,
                      runtime_minutes: ep.runtime || 45,
                      still_url: TMDBClient.getImageUrl(ep.still_path, 'w500') || item!.backdrop_url || item!.poster_url,
                      air_date: ep.air_date || (item!.release_year ? `${item!.release_year}-01-01` : '2024-01-01')
                    });
                  });
                  fetchedEpisodes = true;
                }
              } catch (e) {
                console.warn(`Could not fetch episodes for season ${sData.season_number}, fallback to stubs`, e);
              }

              // Fallback if episode endpoint failed or empty
              if (!fetchedEpisodes) {
                const epCount = sData.episode_count || 8;
                for (let epNum = 1; epNum <= epCount; epNum++) {
                  const epId = `ep-${seasonId}-${epNum}`;
                  dbStore.episodes.push({
                    id: epId,
                    season_id: seasonId,
                    episode_number: epNum,
                    title: `Серия ${epNum}`,
                    overview: `Эпизод ${epNum} захватывающего сезона ${sData.season_number}.`,
                    runtime_minutes: 45,
                    still_url: item.backdrop_url || item.poster_url,
                    air_date: item.release_year ? `${item.release_year}-01-01` : '2024-01-01'
                  });
                }
              }
            }
          }
        } catch (e) {
          console.warn('Failed to load TMDB seasons', e);
        }
      }

      seasons = dbStore.seasons
        .filter(s => s.content_id === item!.id)
        .map(season => {
          const episodes = dbStore.episodes.filter(e => e.season_id === season.id);
          return { ...season, episodes };
        });
    }

    const isFavorite = userId ? Boolean(dbStore.favorites.get(userId)?.has(item.id)) : false;
    const isWatchlist = userId ? Boolean(dbStore.watchlist.get(userId)?.has(item.id)) : false;

    // Check watch history for resume state
    const historyEntry = userId ? dbStore.history.find(h => h.user_id === userId && h.content_id === item!.id) : null;

    return {
      ...item,
      seasons,
      isFavorite,
      isWatchlist,
      resume: historyEntry ? {
        position_seconds: historyEntry.position_seconds,
        duration_seconds: historyEntry.duration_seconds,
        season_id: historyEntry.season_id,
        episode_id: historyEntry.episode_id,
        is_finished: historyEntry.is_finished,
        percentage: Math.round((historyEntry.position_seconds / historyEntry.duration_seconds) * 100)
      } : null
    };
  }

  static async search(query: string): Promise<ContentItem[]> {
    const published = dbStore.content.filter(c => c.is_published);
    if (!query || query.trim().length === 0) return published;
    const q = query.toLowerCase().trim();
    const localMatches = published.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.original_title && c.original_title.toLowerCase().includes(q)) ||
      (c.overview && c.overview.toLowerCase().includes(q)) ||
      (c.genres && c.genres.some(g => g.toLowerCase().includes(q))) ||
      (c.director && c.director.toLowerCase().includes(q)) ||
      (c.cast && c.cast.some(actor => actor.toLowerCase().includes(q)))
    );

    // If query has at least 2 characters, also pull live results from TMDB
    if (q.length >= 2) {
      try {
        const [movies, tvShows] = await Promise.all([
          TMDBClient.searchMovies(query, 1).catch(() => ({ results: [] })),
          TMDBClient.searchTVShows(query, 1).catch(() => ({ results: [] })),
        ]);

        const externalResults: ContentItem[] = [];
        if (movies.results) {
          for (const m of movies.results.slice(0, 6)) {
            const item = TMDBClient.convertToContentItem(m, 'movie');
            if (!dbStore.content.some(c => c.id === item.id || (c.tmdb_id && c.tmdb_id === item.tmdb_id))) {
              dbStore.content.push(item);
            }
            externalResults.push(item);
          }
        }
        if (tvShows.results) {
          for (const s of tvShows.results.slice(0, 6)) {
            const item = TMDBClient.convertToContentItem(s, 'series');
            if (!dbStore.content.some(c => c.id === item.id || (c.tmdb_id && c.tmdb_id === item.tmdb_id))) {
              dbStore.content.push(item);
            }
            externalResults.push(item);
          }
        }

        // Merge local matches and newly discovered items
        const combined = [...localMatches];
        for (const ext of externalResults) {
          if (!combined.some(c => c.id === ext.id || (c.tmdb_id && c.tmdb_id === ext.tmdb_id))) {
            combined.push(ext);
          }
        }
        return combined;
      } catch (err) {
        console.warn('TMDB dynamic search fallback to local:', err);
      }
    }

    return localMatches;
  }

  static getCollections(): Collection[] {
    return dbStore.collections.map(col => {
      return {
        ...col,
        items: dbStore.content
      };
    });
  }
}
