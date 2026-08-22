import {
  HomePayload,
  ContentItem,
  Collection,
  AuthResponse,
  PlaybackSession,
  WatchHistoryItem,
} from '../types';
import { getFallbackHomePayload, fallbackContent } from '../data/fallbackCatalog';
import { LocalStorageCache } from '../utils/localStorageCache';

const getApiBase = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.replace(/\/$/, '');
  }
  return '';
};

const getUrl = (endpoint: string): string => {
  const base = getApiBase();
  if (base) {
    return `${base}${endpoint}`;
  }
  return endpoint;
};

const getDeviceId = (): string => {
  let devId = localStorage.getItem('tv_device_id');
  if (!devId) {
    devId = 'tizen-duid-' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('tv_device_id', devId);
  }
  return devId;
};

const defaultHeaders = () => {
  const token = localStorage.getItem('tv_access_token');
  const adminKey = localStorage.getItem('tv_admin_key') || 'admin123';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Device-Id': getDeviceId(),
    'X-Admin-Key': adminKey
  };
  if (token && token.trim() !== '') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function safeJson(res: Response, fallbackValue: any = null): Promise<any> {
  const text = await res.text().catch(() => '');
  if (!text || !text.trim()) {
    if (!res.ok && res.status !== 204) {
      throw new Error(`HTTP ${res.status}: ${res.statusText || 'Сервер вернул пустой ответ'}`);
    }
    return fallbackValue ?? { success: res.ok };
  }
  try {
    const data = JSON.parse(text);
    if (!res.ok) {
      throw new Error(data.message || data.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return data;
  } catch (err: any) {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text.substring(0, 150)}`);
    }
    return fallbackValue ?? { success: true, raw: text };
  }
}

export const api = {
  getDeviceId,

  async login(email?: string, password?: string): Promise<AuthResponse> {
    const res = await fetch(getUrl('/api/v1/auth/login'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({
        email,
        password,
        deviceName: 'Alex HD (Media Station X)',
        platform: 'tizen'
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Ошибка входа');
    }
    if (data.accessToken) {
      localStorage.setItem('tv_access_token', data.accessToken);
    }
    return data;
  },

  async register(email?: string, password?: string, username?: string): Promise<AuthResponse> {
    const res = await fetch(getUrl('/api/v1/auth/register'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({
        email,
        password,
        username,
        deviceName: 'Alex HD (Media Station X)',
        platform: 'tizen'
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Ошибка регистрации');
    }
    if (data.accessToken) {
      localStorage.setItem('tv_access_token', data.accessToken);
    }
    return data;
  },

  async adminLogin(password: string = 'admin123', username: string = 'admin'): Promise<AuthResponse> {
    const res = await fetch(getUrl('/api/v1/auth/admin-login'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ password, username })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Неверный пароль администратора');
    }
    if (data.accessToken) {
      localStorage.setItem('tv_access_token', data.accessToken);
      localStorage.setItem('tv_admin_key', password);
    }
    return data;
  },

  async loginWithGoogle(profile?: { email?: string; name?: string; sub?: string }): Promise<AuthResponse> {
    const res = await fetch(getUrl('/api/v1/auth/google'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({
        googleId: profile?.sub,
        email: profile?.email,
        displayName: profile?.name,
        deviceName: 'Alex HD (Google Auth)',
        platform: 'tizen'
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Ошибка входа через Google');
    }
    if (data.accessToken) {
      localStorage.setItem('tv_access_token', data.accessToken);
    }
    return data;
  },

  async loginWithApple(profile?: { email?: string; fullName?: string; sub?: string }): Promise<AuthResponse> {
    const res = await fetch(getUrl('/api/v1/auth/apple'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({
        appleSub: profile?.sub,
        email: profile?.email,
        fullName: profile?.fullName,
        deviceName: 'Alex HD (Apple ID)',
        platform: 'tizen'
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Ошибка входа через Apple');
    }
    if (data.accessToken) {
      localStorage.setItem('tv_access_token', data.accessToken);
    }
    return data;
  },

  async testTorrServer(url: string): Promise<any> {
    let cleanUrl = (url || '').trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `http://${cleanUrl}`;
    }
    cleanUrl = cleanUrl.replace(/\/+$/, '');

    try {
      const res = await fetch(getUrl('/api/v1/torrserver/test-connection'), {
        method: 'POST',
        headers: defaultHeaders(),
        body: JSON.stringify({ url: cleanUrl })
      });
      if (res.ok) {
        return await res.json();
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `HTTP ${res.status}`);
    } catch (e: any) {
      // If backend call failed (e.g. Mixed Content HTTPS frontend calling HTTP backend),
      // attempt direct fetch or return structured status
      try {
        const start = Date.now();
        const directRes = await fetch(`${cleanUrl}/echo`, { signal: AbortSignal.timeout(3000) });
        if (directRes.ok) {
          const version = (await directRes.text()).trim() || 'TorrServer MatriX';
          return {
            online: true,
            version,
            url: cleanUrl,
            latencyMs: Date.now() - start,
            activeTorrents: 0,
            cacheSizeMb: 256,
            bufferSizeMb: 32,
            clientsConnected: 0,
            readerWriteSpeedMbps: 0
          };
        }
      } catch (directErr: any) {
        // Direct fetch failed too
      }
      throw new Error(`Не удалось подключиться к TorrServer (${cleanUrl}): ${e.message || 'Ошибка сети'}`);
    }
  },

  async getTorrServerStatus(url?: string): Promise<any> {
    const query = url ? `?url=${encodeURIComponent(url)}` : '';
    const res = await fetch(getUrl(`/api/v1/torrserver/status${query}`), { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Failed to get TorrServer status');
    return res.json();
  },

  async getTorrServerStreamStats(hash: string, url?: string): Promise<any> {
    const query = url ? `?url=${encodeURIComponent(url)}` : '';
    const res = await fetch(getUrl(`/api/v1/torrserver/stream-stats/${hash}${query}`), { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Failed to get TorrServer stream stats');
    return res.json();
  },

  async getHome(onBackgroundUpdate?: (freshData: HomePayload) => void): Promise<HomePayload> {
    const cached = LocalStorageCache.get<HomePayload>('catalog_home');

    const fetchPromise = (async () => {
      try {
        const res = await fetch(getUrl('/api/v1/catalog/home'), { headers: defaultHeaders() });
        if (res.ok) {
          const data = await res.json();
          if (data && data.hero && data.trending24h && data.trending24h.length > 0) {
            LocalStorageCache.set('catalog_home', data);
            if (onBackgroundUpdate) {
              onBackgroundUpdate(data);
            }
            return data;
          }
        }
      } catch (err) {
        console.warn('Backend getHome background refresh failed:', err);
      }
      return null;
    })();

    if (cached && cached.hero && cached.trending24h && cached.trending24h.length > 0) {
      return cached;
    }

    const fresh = await fetchPromise;
    if (fresh) return fresh;

    return getFallbackHomePayload();
  },

  async getCatalogItems(params: {
    page?: number;
    limit?: number;
    type?: string;
    genre?: string;
    search?: string;
    sortBy?: string;
  } = {}): Promise<{
    items: ContentItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.type) queryParams.set('type', params.type);
      if (params.genre) queryParams.set('genre', params.genre);
      if (params.search) queryParams.set('search', params.search);
      if (params.sortBy) queryParams.set('sortBy', params.sortBy);

      const res = await fetch(getUrl(`/api/v1/catalog/items?${queryParams.toString()}`), {
        headers: defaultHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('getCatalogItems failed:', e);
    }
    return { items: [], total: 0, page: 1, limit: 50, totalPages: 1, hasMore: false };
  },

  async search(query: string, onBackgroundUpdate?: (freshData: ContentItem[]) => void): Promise<ContentItem[]> {
    const cacheKey = `search_${query.toLowerCase().trim()}`;
    const cached = LocalStorageCache.get<ContentItem[]>(cacheKey);

    const fetchPromise = (async () => {
      try {
        const res = await fetch(getUrl(`/api/v1/catalog/search?q=${encodeURIComponent(query)}`), { headers: defaultHeaders() });
        if (res.ok) {
          const data = await res.json();
          LocalStorageCache.set(cacheKey, data);
          if (onBackgroundUpdate) onBackgroundUpdate(data);
          return data;
        }
      } catch (e) {
        console.warn('Background search refresh failed:', e);
      }
      return null;
    })();

    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    const fresh = await fetchPromise;
    if (fresh) return fresh;

    const q = query.toLowerCase();
    return fallbackContent.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.original_title.toLowerCase().includes(q) ||
      c.genres.some(g => g.toLowerCase().includes(q))
    );
  },

  async aiSearch(query: string): Promise<ContentItem[]> {
    const cacheKey = `aisearch_${query.toLowerCase().trim()}`;
    const cached = LocalStorageCache.get<ContentItem[]>(cacheKey);

    try {
      const res = await fetch(getUrl(`/api/v1/catalog/ai-search?q=${encodeURIComponent(query)}`), { headers: defaultHeaders() });
      if (res.ok) {
        const data = await res.json();
        LocalStorageCache.set(cacheKey, data);
        return data;
      }
    } catch (e) {
      console.warn('AI search network error, fallback to cache:', e);
    }

    if (cached) return cached;

    const q = query.toLowerCase();
    return fallbackContent.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.genres.some(g => g.toLowerCase().includes(q)) ||
      c.overview.toLowerCase().includes(q)
    );
  },

  async getContentDetail(id: string, onBackgroundUpdate?: (freshData: any) => void): Promise<any> {
    const cacheKey = `content_${id}`;
    const cached = LocalStorageCache.get<any>(cacheKey);

    const fetchPromise = (async () => {
      try {
        const res = await fetch(getUrl(`/api/v1/catalog/content/${id}`), { headers: defaultHeaders() });
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            LocalStorageCache.set(cacheKey, data);
            if (onBackgroundUpdate) onBackgroundUpdate(data);
            return data;
          }
        }
      } catch (e) {
        console.warn('Background content detail refresh failed:', e);
      }
      return null;
    })();

    if (cached && cached.id) {
      return cached;
    }

    const fresh = await fetchPromise;
    if (fresh) return fresh;

    const item = fallbackContent.find(c => c.id === id || String(c.tmdb_id) === String(id));
    if (item) return item;
    return fallbackContent[0];
  },

  async toggleFavorite(id: string): Promise<{ isFavorite: boolean }> {
    try {
      const res = await fetch(getUrl(`/api/v1/me/favorites/${id}`), { method: 'POST', headers: defaultHeaders() });
      return await res.json();
    } catch (e) {
      return { isFavorite: true };
    }
  },

  async getFavorites(): Promise<ContentItem[]> {
    try {
      const res = await fetch(getUrl('/api/v1/me/favorites'), { headers: defaultHeaders() });
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  async toggleWatchlist(id: string): Promise<{ isWatchlist: boolean }> {
    try {
      const res = await fetch(getUrl(`/api/v1/me/watchlist/${id}`), { method: 'POST', headers: defaultHeaders() });
      return await res.json();
    } catch (e) {
      return { isWatchlist: true };
    }
  },

  async getWatchlist(): Promise<ContentItem[]> {
    try {
      const res = await fetch(getUrl('/api/v1/me/watchlist'), { headers: defaultHeaders() });
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  async updateHistory(payload: {
    contentId: string;
    positionSeconds: number;
    durationSeconds: number;
    seasonId?: string;
    episodeId?: string;
  }): Promise<WatchHistoryItem> {
    try {
      const res = await fetch(getUrl('/api/v1/me/history'), {
        method: 'POST',
        headers: defaultHeaders(),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      return {
        id: 'hist-fallback',
        user_id: 'usr-guest',
        content_id: payload.contentId,
        season_id: payload.seasonId,
        episode_id: payload.episodeId,
        position_seconds: payload.positionSeconds,
        duration_seconds: payload.durationSeconds,
        is_finished: false,
        updated_at: new Date().toISOString()
      };
    }
  },

  async getHistory(): Promise<WatchHistoryItem[]> {
    try {
      const res = await fetch(getUrl('/api/v1/me/history'), { headers: defaultHeaders() });
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  async initPlayback(contentId: string, quality: string = '1080p', sourceId?: string, locator?: string): Promise<PlaybackSession> {
    const res = await fetch(getUrl('/api/v1/playback/play'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ contentId, quality, sourceId, locator })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Playback initialization failed');
    }
    return data;
  },

  async getProfile(): Promise<any> {
    const res = await fetch(getUrl('/api/v1/me/profile'), { headers: defaultHeaders() });
    return res.json();
  },

  async removeDevice(deviceId: string): Promise<any> {
    const res = await fetch(getUrl(`/api/v1/me/devices/${deviceId}`), { method: 'DELETE', headers: defaultHeaders() });
    return res.json();
  },

  async getAdminDashboard(): Promise<any> {
    const res = await fetch(getUrl('/api/v1/admin/dashboard'), { headers: defaultHeaders() });
    return safeJson(res, {});
  },

  async getAdminLogs(params?: { level?: string; service?: string; search?: string; limit?: number }): Promise<{ logs: any[]; stats: any }> {
    const query = new URLSearchParams();
    if (params?.level && params.level !== 'all') query.append('level', params.level);
    if (params?.service) query.append('service', params.service);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await fetch(getUrl(`/api/v1/admin/logs?${query.toString()}`), { headers: defaultHeaders() });
    return safeJson(res, { logs: [], stats: {} });
  },

  async downloadRawLogs(): Promise<string> {
    const res = await fetch(getUrl('/api/v1/admin/logs/raw'), { headers: defaultHeaders() });
    return res.text();
  },

  async clearAdminLogs(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(getUrl('/api/v1/admin/logs/clear'), {
      method: 'POST',
      headers: defaultHeaders()
    });
    return safeJson(res, { success: true, message: 'Logs cleared' });
  },

  async sendTestLog(payload: { level?: string; service?: string; action?: string; message?: string }): Promise<any> {
    const res = await fetch(getUrl('/api/v1/admin/logs/test'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(payload)
    });
    return safeJson(res, { success: true });
  },

  async getAdminUsers(): Promise<any[]> {
    const res = await fetch(getUrl('/api/v1/admin/users'), { headers: defaultHeaders() });
    return safeJson(res, []);
  },

  async toggleBlockUser(userId: string): Promise<any> {
    const res = await fetch(getUrl(`/api/v1/admin/users/${userId}/toggle-block`), {
      method: 'POST',
      headers: defaultHeaders()
    });
    return safeJson(res, { success: true });
  },

  async updateUserRole(userId: string, role: string): Promise<any> {
    const res = await fetch(getUrl(`/api/v1/admin/users/${userId}/role`), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ role })
    });
    return safeJson(res, { success: true });
  },

  async updateUserPlan(userId: string, plan: string, durationDays: number = 30): Promise<any> {
    const res = await fetch(getUrl(`/api/v1/admin/users/${userId}/plan`), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ plan, durationDays })
    });
    return safeJson(res, { success: true });
  },

  async resetUserDevices(userId: string): Promise<any> {
    const res = await fetch(getUrl(`/api/v1/admin/users/${userId}/reset-devices`), {
      method: 'POST',
      headers: defaultHeaders()
    });
    return safeJson(res, { success: true });
  },

  async deleteAdminUser(userId: string): Promise<any> {
    const res = await fetch(getUrl(`/api/v1/admin/users/${userId}`), {
      method: 'DELETE',
      headers: defaultHeaders()
    });
    return safeJson(res, { success: true });
  },

  async getFinancials(): Promise<any> {
    const res = await fetch(getUrl('/api/v1/admin/financials'), { headers: defaultHeaders() });
    return safeJson(res, { transactions: [], stats: {} });
  },

  async recordPayment(payload: { userId: string; planId: string; amountRub: number; provider?: string }): Promise<any> {
    const res = await fetch(getUrl('/api/v1/admin/payments/record'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(payload)
    });
    return safeJson(res, { success: true });
  },

  async registerNode(nodeData: any): Promise<any> {
    try {
      const res = await fetch(getUrl('/api/v1/admin/nodes'), {
        method: 'POST',
        headers: defaultHeaders(),
        body: JSON.stringify(nodeData)
      });
      return await safeJson(res, { success: true, node: nodeData });
    } catch (e: any) {
      console.warn('Backend registerNode fallback to local store:', e);
      return { success: true, node: nodeData };
    }
  },

  async toggleNodeStatus(nodeId: string, isOnline: boolean): Promise<any> {
    const res = await fetch(getUrl(`/api/v1/admin/nodes/${nodeId}/toggle`), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ isOnline })
    });
    return safeJson(res, { success: true, isOnline });
  },

  async pingNode(nodeId: string): Promise<any> {
    const res = await fetch(getUrl(`/api/v1/admin/nodes/${nodeId}/ping`), {
      method: 'POST',
      headers: defaultHeaders()
    });
    return safeJson(res, { isOnline: true, pingMs: 25 });
  },

  async restartNode(nodeId: string): Promise<any> {
    const res = await fetch(getUrl(`/api/v1/admin/nodes/${nodeId}/restart`), {
      method: 'POST',
      headers: defaultHeaders()
    });
    return safeJson(res, { success: true });
  },

  async flushNodeCache(nodeId: string): Promise<any> {
    const res = await fetch(getUrl(`/api/v1/admin/nodes/${nodeId}/flush-cache`), {
      method: 'POST',
      headers: defaultHeaders()
    });
    return safeJson(res, { success: true });
  },

  async flushAllNodes(): Promise<any> {
    const res = await fetch(getUrl('/api/v1/admin/nodes/flush-all'), {
      method: 'POST',
      headers: defaultHeaders()
    });
    return safeJson(res, { success: true });
  },

  async deleteNode(nodeId: string): Promise<any> {
    const res = await fetch(getUrl(`/api/v1/admin/nodes/${nodeId}`), {
      method: 'DELETE',
      headers: defaultHeaders()
    });
    return safeJson(res, { success: true });
  },

  async sendTelemetry(telemetryData: any, secret?: string): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (secret) {
      headers['X-Node-Secret'] = secret;
    }
    const res = await fetch(getUrl('/api/v1/admin/nodes/telemetry'), {
      method: 'POST',
      headers,
      body: JSON.stringify(telemetryData)
    });
    return safeJson(res, { success: true });
  },

  async getStream(contentId: string): Promise<any> {
    const session = await this.initPlayback(contentId);
    return {
      content_id: contentId,
      title: 'HLS Stream',
      stream_url: session.streamUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      session,
      subtitles: [
        { id: 'sub-ru', language: 'Русский', label: 'Русский (SRT)', url: '' },
        { id: 'sub-en', language: 'English', label: 'English (SRT)', url: '' }
      ],
      audio_tracks: [
        { id: 'ru', language: 'Русский', label: 'Дубляж 5.1' },
        { id: 'en', language: 'English', label: 'Original Dolby' }
      ]
    };
  },

  async saveProgress(contentId: string, seconds: number, percentage: number): Promise<any> {
    return this.updateHistory({
      contentId,
      positionSeconds: seconds,
      durationSeconds: Math.round(seconds / (percentage / 100 || 1))
    });
  },

  async syncTmdb(query: string): Promise<any> {
    const res = await fetch(getUrl('/api/v1/admin/tmdb-sync'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ query })
    });
    return safeJson(res, { success: true });
  },

  async createContent(contentData: any): Promise<any> {
    const res = await fetch(getUrl('/api/v1/admin/content'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(contentData)
    });
    return safeJson(res, { success: true, item: contentData });
  },

  async toggleHeroContentItem(id: string): Promise<any> {
    const res = await fetch(getUrl(`/api/v1/admin/content/${id}/toggle-hero`), {
      method: 'POST',
      headers: defaultHeaders()
    });
    return safeJson(res, { success: true });
  },

  async getMetadataStatus(): Promise<{
    tmdb: { configured: boolean; key_preview: string | null };
    tvdb: { configured: boolean; key_preview: string | null };
    syncState?: {
      isSyncing: boolean;
      progressPercent: number;
      currentStep: string;
      itemsAdded: number;
      totalCatalogCount: number;
      error: string | null;
      lastSyncTimestamp: string | null;
    };
  }> {
    const res = await fetch(getUrl('/api/v1/metadata/status'), { headers: defaultHeaders() });
    return safeJson(res, { tmdb: { configured: false, key_preview: null }, tvdb: { configured: false, key_preview: null } });
  },

  async getMetadataSyncProgress(): Promise<{
    isSyncing: boolean;
    progressPercent: number;
    currentStep: string;
    itemsAdded: number;
    totalCatalogCount: number;
    error: string | null;
    lastSyncTimestamp: string | null;
    apiReports?: Array<{
      name: string;
      service: string;
      status: 'ok' | 'error';
      pingMs?: number;
      error?: string;
      details?: string;
    }>;
  }> {
    const res = await fetch(getUrl('/api/v1/metadata/sync-progress'), { headers: defaultHeaders() });
    return safeJson(res, {
      isSyncing: false,
      progressPercent: 0,
      currentStep: 'Готов к синхронизации',
      itemsAdded: 0,
      totalCatalogCount: 0,
      error: null,
      lastSyncTimestamp: null,
      apiReports: []
    });
  },

  async checkAPIs(): Promise<{ success: boolean; reports: any[] }> {
    const res = await fetch(getUrl('/api/v1/metadata/check-apis'), { headers: defaultHeaders() });
    return safeJson(res, { success: false, reports: [] });
  },

  async updateTMDBKey(tmdbApiKey: string): Promise<{ success: boolean; message: string; keyPreview?: string }> {
    const res = await fetch(getUrl('/api/v1/metadata/update-key'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ tmdbApiKey })
    });
    const data = await safeJson(res, null);
    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Не удалось обновить TMDB API ключ');
    }
    return data;
  },

  async getAdminSettings(): Promise<{ torrServerUrl: string; prowlarrUrl: string; prowlarrKey: string }> {
    const res = await fetch(getUrl('/api/v1/admin/settings'), { headers: defaultHeaders() });
    const data = await safeJson(res, null);
    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Не удалось загрузить настройки системы');
    }
    return data;
  },

  async updateAdminSettings(settings: { torrServerUrl?: string; prowlarrUrl?: string; prowlarrKey?: string }): Promise<{ success: boolean; message: string; settings: any }> {
    const res = await fetch(getUrl('/api/v1/admin/update-settings'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(settings)
    });
    const data = await safeJson(res, null);
    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Не удалось обновить настройки системы');
    }
    return data;
  },

  async getPerson(idOrName: string | number, onBackgroundUpdate?: (freshData: any) => void): Promise<any> {
    const cacheKey = `person_${encodeURIComponent(idOrName)}`;
    const cached = LocalStorageCache.get<any>(cacheKey);

    const fetchPromise = (async () => {
      try {
        const res = await fetch(getUrl(`/api/v1/metadata/person/${encodeURIComponent(idOrName)}`), { headers: defaultHeaders() });
        const data = await safeJson(res, null);
        if (data && (data.name || data.id)) {
          LocalStorageCache.set(cacheKey, data);
          if (onBackgroundUpdate) onBackgroundUpdate(data);
          return data;
        }
      } catch (e) {
        console.warn('Background person fetch failed:', e);
      }
      return null;
    })();

    if (cached && (cached.name || cached.id)) {
      return cached;
    }

    const fresh = await fetchPromise;
    return fresh;
  },

  async autoPopulateCatalog(): Promise<{ success: boolean; added: number }> {
    const res = await fetch(getUrl('/api/v1/metadata/auto-populate'), {
      method: 'POST',
      headers: defaultHeaders()
    });
    return safeJson(res, { success: true, added: 0 });
  },

  async searchMetadata(query: string, provider: 'tmdb' | 'tvdb' | 'all' = 'all'): Promise<{ results: any[]; errors: string[] }> {
    const res = await fetch(getUrl(`/api/v1/metadata/search?q=${encodeURIComponent(query)}&provider=${provider}`), { headers: defaultHeaders() });
    return safeJson(res, { results: [], errors: [] });
  },

  async importMetadata(externalId: number | string, source: 'tmdb' | 'tvdb', type: 'movie' | 'series'): Promise<{ success: boolean; item: ContentItem }> {
    const res = await fetch(getUrl('/api/v1/metadata/import'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ externalId, source, type })
    });
    return safeJson(res, { success: true });
  },

  // ------------------- JELLYSEERR METHODS -------------------
  async getJellyseerrStatus(): Promise<{
    online: boolean;
    version?: string;
    commitTag?: string;
    url: string;
    totalRequests?: number;
    error?: string;
  }> {
    const res = await fetch(getUrl('/api/v1/jellyseerr/status'), { headers: defaultHeaders() });
    return safeJson(res, { online: false, url: 'http://127.0.0.1:5055' });
  },

  async getJellyseerrConfig(): Promise<{
    url: string;
    apiKey: string;
    hasKey: boolean;
    isEnabled: boolean;
  }> {
    const res = await fetch(getUrl('/api/v1/jellyseerr/config'), { headers: defaultHeaders() });
    return safeJson(res, { url: 'http://127.0.0.1:5055', apiKey: '', hasKey: false, isEnabled: true });
  },

  async updateJellyseerrConfig(config: { url?: string; apiKey?: string; isEnabled?: boolean }): Promise<{
    success: boolean;
    message: string;
    config: any;
  }> {
    const res = await fetch(getUrl('/api/v1/jellyseerr/config'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(config)
    });
    return safeJson(res, { success: true });
  },

  async testJellyseerrConnection(url?: string, apiKey?: string): Promise<{
    online: boolean;
    version?: string;
    commitTag?: string;
    url: string;
    error?: string;
  }> {
    const res = await fetch(getUrl('/api/v1/jellyseerr/test-connection'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ url, apiKey })
    });
    return safeJson(res, { online: false, url: url || 'http://127.0.0.1:5055' });
  },

  async syncJellyseerrCatalog(): Promise<{
    success: boolean;
    syncedCount: number;
    totalCount: number;
    error?: string;
  }> {
    const res = await fetch(getUrl('/api/v1/jellyseerr/sync'), {
      method: 'POST',
      headers: defaultHeaders()
    });
    return safeJson(res, { success: false, syncedCount: 0, totalCount: 0 });
  },

  async requestJellyseerrMedia(params: {
    mediaType: 'movie' | 'tv';
    mediaId: number;
    seasons?: number[];
    is4k?: boolean;
  }): Promise<{ success: boolean; result?: any; error?: string }> {
    const res = await fetch(getUrl('/api/v1/jellyseerr/request'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(params)
    });
    return safeJson(res, { success: false });
  },

  // ------------------- PROWLARR CLIENT METHODS -------------------
  async getProwlarrStatus(): Promise<{
    online: boolean;
    version?: string;
    url: string;
    indexersCount?: number;
    indexers?: string[];
    error?: string;
    latencyMs?: number;
  }> {
    const res = await fetch(getUrl('/api/v1/prowlarr/status'), { headers: defaultHeaders() });
    return safeJson(res, { online: false, url: 'http://172.19.0.5:9696' });
  },

  async searchProwlarr(query: string, opts?: { type?: 'movie' | 'tv'; season?: number; episode?: number }): Promise<any[]> {
    const params = new URLSearchParams({ query });
    if (opts?.type) params.set('type', opts.type);
    if (opts?.season) params.set('season', String(opts.season));
    if (opts?.episode) params.set('episode', String(opts.episode));
    const res = await fetch(getUrl(`/api/v1/prowlarr/search?${params.toString()}`), { headers: defaultHeaders() });
    return safeJson(res, []);
  },

  // ------------------- RADARR CLIENT METHODS -------------------
  async getRadarrStatus(): Promise<{
    online: boolean;
    version?: string;
    url: string;
    movieCount?: number;
    error?: string;
    latencyMs?: number;
  }> {
    const res = await fetch(getUrl('/api/v1/radarr/status'), { headers: defaultHeaders() });
    return safeJson(res, { online: false, url: 'http://172.19.0.8:7878' });
  },

  async getRadarrMovies(): Promise<any[]> {
    const res = await fetch(getUrl('/api/v1/radarr/movies'), { headers: defaultHeaders() });
    return safeJson(res, []);
  },

  async getRadarrReleases(movieId: number | string): Promise<any[]> {
    const res = await fetch(getUrl(`/api/v1/radarr/releases/${movieId}`), { headers: defaultHeaders() });
    return safeJson(res, []);
  },

  async syncRadarr(): Promise<{ success: boolean; count: number; message: string }> {
    const res = await fetch(getUrl('/api/v1/radarr/sync'), { method: 'POST', headers: defaultHeaders() });
    return safeJson(res, { success: false, count: 0, message: '' });
  },

  // ------------------- SONARR CLIENT METHODS -------------------
  async getSonarrStatus(): Promise<{
    online: boolean;
    version?: string;
    url: string;
    seriesCount?: number;
    error?: string;
    latencyMs?: number;
  }> {
    const res = await fetch(getUrl('/api/v1/sonarr/status'), { headers: defaultHeaders() });
    return safeJson(res, { online: false, url: 'http://172.19.0.9:8989' });
  },

  async getSonarrSeries(): Promise<any[]> {
    const res = await fetch(getUrl('/api/v1/sonarr/series'), { headers: defaultHeaders() });
    return safeJson(res, []);
  },

  async getSonarrEpisodes(seriesId: number | string): Promise<any[]> {
    const res = await fetch(getUrl(`/api/v1/sonarr/episodes/${seriesId}`), { headers: defaultHeaders() });
    return safeJson(res, []);
  },

  async getSonarrReleases(seriesId: number | string, season?: number): Promise<any[]> {
    const q = season ? `?season=${season}` : '';
    const res = await fetch(getUrl(`/api/v1/sonarr/releases/${seriesId}${q}`), { headers: defaultHeaders() });
    return safeJson(res, []);
  },

  async syncSonarr(): Promise<{ success: boolean; count: number; message: string }> {
    const res = await fetch(getUrl('/api/v1/sonarr/sync'), { method: 'POST', headers: defaultHeaders() });
    return safeJson(res, { success: false, count: 0, message: '' });
  },

  // ------------------- UNIFIED RELEASES & TORRENTS -------------------
  async getCatalogReleases(contentId: string, season?: number, episode?: number): Promise<{
    contentId: string;
    title: string;
    type: 'movie' | 'series';
    season?: number;
    episode?: number;
    sourcesCount: number;
    sources: any[];
  }> {
    const params = new URLSearchParams();
    if (season !== undefined) params.set('season', String(season));
    if (episode !== undefined) params.set('episode', String(episode));
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(getUrl(`/api/v1/catalog/releases/${encodeURIComponent(contentId)}${qs}`), { headers: defaultHeaders() });
    return safeJson(res, { contentId, title: '', type: 'movie', sourcesCount: 0, sources: [] });
  },

  async preloadTorrServerTorrent(link: string, title?: string, url?: string): Promise<{ success: boolean; hash?: string }> {
    const res = await fetch(getUrl('/api/v1/torrserver/preload'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ link, title, url })
    });
    return safeJson(res, { success: false });
  }
};
