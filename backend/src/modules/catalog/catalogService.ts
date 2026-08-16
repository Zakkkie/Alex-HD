import { dbStore } from '../../db/store';
import { HomePayload, ContentItem, Collection, WatchHistoryItem } from '../../../../src/types';

export class CatalogService {
  static getHomePayload(userId: string): HomePayload {
    const published = dbStore.content.filter(c => c.is_published);
    const hero = published.find(c => c.id === 'c101-dune-2') || published[0];

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

    return {
      hero,
      continueWatching,
      trending24h,
      popular,
      newReleases,
      timelessClassics,
      fourKCollection,
      collections: collectionsWithItems,
      anime,
      topMovies,
      topSeries
    };
  }

  static getContentDetail(id: string, userId?: string) {
    const item = dbStore.content.find(c => c.id === id || c.tmdb_id === parseInt(id, 10));
    if (!item) return null;

    // Increment play count
    item.play_count += 1;

    let seasons = undefined;
    if (item.type === 'series') {
      seasons = dbStore.seasons
        .filter(s => s.content_id === item.id)
        .map(season => {
          const episodes = dbStore.episodes.filter(e => e.season_id === season.id);
          return { ...season, episodes };
        });
    }

    const isFavorite = userId ? Boolean(dbStore.favorites.get(userId)?.has(item.id)) : false;
    const isWatchlist = userId ? Boolean(dbStore.watchlist.get(userId)?.has(item.id)) : false;

    // Check watch history for resume state
    const historyEntry = userId ? dbStore.history.find(h => h.user_id === userId && h.content_id === item.id) : null;

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

  static search(query: string): ContentItem[] {
    const published = dbStore.content.filter(c => c.is_published);
    if (!query || query.trim().length === 0) return published;
    const q = query.toLowerCase().trim();
    return published.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.original_title && c.original_title.toLowerCase().includes(q)) ||
      (c.overview && c.overview.toLowerCase().includes(q)) ||
      (c.genres && c.genres.some(g => g.toLowerCase().includes(q))) ||
      (c.director && c.director.toLowerCase().includes(q)) ||
      (c.cast && c.cast.some(actor => actor.toLowerCase().includes(q)))
    );
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
