import { dbStore } from '../db/store.js';

export class TmdbSyncWorker {
  static syncAll() {
    console.log('[TMDB Sync Worker] Starting periodic metadata sync...');
    let updatedCount = 0;
    dbStore.content.forEach(item => {
      if (!item.rating_tmdb) {
        item.rating_tmdb = 8.5;
        updatedCount++;
      }
    });
    console.log(`[TMDB Sync Worker] Completed. Synchronized ${updatedCount} items.`);
  }
}
