import { dbStore } from '../../db/store';
import { WatchHistoryItem } from '../../../../src/types';

export class UserService {
  static getFavorites(userId: string) {
    const favSet = dbStore.favorites.get(userId) || new Set();
    return dbStore.content.filter(c => favSet.has(c.id));
  }

  static toggleFavorite(userId: string, contentId: string): boolean {
    let favSet = dbStore.favorites.get(userId);
    if (!favSet) {
      favSet = new Set();
      dbStore.favorites.set(userId, favSet);
    }
    if (favSet.has(contentId)) {
      favSet.delete(contentId);
      return false;
    } else {
      favSet.add(contentId);
      return true;
    }
  }

  static getWatchlist(userId: string) {
    const watchSet = dbStore.watchlist.get(userId) || new Set();
    return dbStore.content.filter(c => watchSet.has(c.id));
  }

  static toggleWatchlist(userId: string, contentId: string): boolean {
    let watchSet = dbStore.watchlist.get(userId);
    if (!watchSet) {
      watchSet = new Set();
      dbStore.watchlist.set(userId, watchSet);
    }
    if (watchSet.has(contentId)) {
      watchSet.delete(contentId);
      return false;
    } else {
      watchSet.add(contentId);
      return true;
    }
  }

  static updateHistory(
    userId: string,
    contentId: string,
    positionSeconds: number,
    durationSeconds: number,
    episodeId?: string,
    seasonId?: string
  ) {
    const isFinished = durationSeconds > 0 ? (positionSeconds / durationSeconds) >= 0.9 : false;

    let historyItem = dbStore.history.find(
      h => h.user_id === userId && h.content_id === contentId && h.episode_id === episodeId
    );

    const content = dbStore.content.find(c => c.id === contentId);

    if (historyItem) {
      historyItem.position_seconds = positionSeconds;
      historyItem.duration_seconds = durationSeconds;
      historyItem.is_finished = isFinished;
      historyItem.updated_at = new Date().toISOString();
    } else {
      historyItem = {
        id: `hist-${Date.now()}`,
        user_id: userId,
        content_id: contentId,
        season_id: seasonId || null,
        episode_id: episodeId || null,
        position_seconds: positionSeconds,
        duration_seconds: durationSeconds,
        is_finished: isFinished,
        updated_at: new Date().toISOString(),
        content
      };
      dbStore.history.push(historyItem);
      if (dbStore.history.length > 1000) {
        dbStore.history = dbStore.history.slice(-1000);
      }
    }

    return historyItem;
  }

  static getHistory(userId: string) {
    return dbStore.history
      .filter(h => h.user_id === userId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  static getUserProfile(userId: string) {
    const user = dbStore.users.find(u => u.id === userId) || dbStore.users[0];
    const userDevices = dbStore.devices.filter(d => d.user_id === userId);
    return {
      user,
      devices: userDevices,
      maxDevices: 3
    };
  }

  static removeDevice(userId: string, deviceId: string) {
    const idx = dbStore.devices.findIndex(d => d.user_id === userId && d.id === deviceId);
    if (idx !== -1) {
      dbStore.devices.splice(idx, 1);
      return true;
    }
    return false;
  }
}
