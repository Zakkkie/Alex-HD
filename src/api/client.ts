import {
  HomePayload,
  ContentItem,
  Collection,
  AuthResponse,
  PlaybackSession,
  WatchHistoryItem,
} from '../types';

const getDeviceId = (): string => {
  let devId = localStorage.getItem('tv_device_id');
  if (!devId) {
    devId = 'tizen-duid-' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('tv_device_id', devId);
  }
  return devId;
};

const defaultHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Device-Id': getDeviceId(),
  'Authorization': `Bearer ${localStorage.getItem('tv_access_token') || ''}`
});

export const api = {
  getDeviceId,

  async login(email?: string, password?: string): Promise<AuthResponse> {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({
        email: email || 'demo@alexhd.com',
        password: password || '123456',
        deviceName: 'Alex HD (Media Station X)',
        platform: 'tizen'
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Authentication failed');
    }
    if (data.accessToken) {
      localStorage.setItem('tv_access_token', data.accessToken);
    }
    return data;
  },

  async loginWithGoogle(profile?: { email?: string; name?: string; sub?: string }): Promise<AuthResponse> {
    const res = await fetch('/api/v1/auth/google', {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({
        googleId: profile?.sub || `g_${Date.now()}`,
        email: profile?.email || 'google_user@gmail.com',
        displayName: profile?.name || 'Alex HD Google User',
        deviceName: 'Alex HD (Google Auth)',
        platform: 'tizen'
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Google Sign-In failed');
    }
    if (data.accessToken) {
      localStorage.setItem('tv_access_token', data.accessToken);
    }
    return data;
  },

  async loginWithApple(profile?: { email?: string; fullName?: string; sub?: string }): Promise<AuthResponse> {
    const res = await fetch('/api/v1/auth/apple', {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({
        appleSub: profile?.sub || `appl_${Date.now()}`,
        email: profile?.email,
        fullName: profile?.fullName || 'Apple ID User',
        deviceName: 'Alex HD (Apple ID)',
        platform: 'tizen'
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Apple ID Sign-In failed');
    }
    if (data.accessToken) {
      localStorage.setItem('tv_access_token', data.accessToken);
    }
    return data;
  },

  async testTorrServer(url: string): Promise<any> {
    const res = await fetch('/api/v1/torrserver/test-connection', {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ url })
    });
    if (!res.ok) throw new Error('TorrServer ping failed');
    return res.json();
  },

  async getTorrServerStatus(url?: string): Promise<any> {
    const query = url ? `?url=${encodeURIComponent(url)}` : '';
    const res = await fetch(`/api/v1/torrserver/status${query}`, { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Failed to get TorrServer status');
    return res.json();
  },

  async getTorrServerStreamStats(hash: string, url?: string): Promise<any> {
    const query = url ? `?url=${encodeURIComponent(url)}` : '';
    const res = await fetch(`/api/v1/torrserver/stream-stats/${hash}${query}`, { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Failed to get TorrServer stream stats');
    return res.json();
  },

  async getHome(): Promise<HomePayload> {
    const res = await fetch('/api/v1/catalog/home', { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Failed to load home content');
    return res.json();
  },

  async search(query: string): Promise<ContentItem[]> {
    const res = await fetch(`/api/v1/catalog/search?q=${encodeURIComponent(query)}`, { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async aiSearch(query: string): Promise<ContentItem[]> {
    const res = await fetch(`/api/v1/catalog/ai-search?q=${encodeURIComponent(query)}`, { headers: defaultHeaders() });
    if (!res.ok) throw new Error('AI Search failed');
    return res.json();
  },

  async getContentDetail(id: string): Promise<any> {
    const res = await fetch(`/api/v1/catalog/content/${id}`, { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Content not found');
    return res.json();
  },

  async toggleFavorite(id: string): Promise<{ isFavorite: boolean }> {
    const res = await fetch(`/api/v1/me/favorites/${id}`, { method: 'POST', headers: defaultHeaders() });
    return res.json();
  },

  async getFavorites(): Promise<ContentItem[]> {
    const res = await fetch('/api/v1/me/favorites', { headers: defaultHeaders() });
    return res.json();
  },

  async toggleWatchlist(id: string): Promise<{ isWatchlist: boolean }> {
    const res = await fetch(`/api/v1/me/watchlist/${id}`, { method: 'POST', headers: defaultHeaders() });
    return res.json();
  },

  async getWatchlist(): Promise<ContentItem[]> {
    const res = await fetch('/api/v1/me/watchlist', { headers: defaultHeaders() });
    return res.json();
  },

  async updateHistory(payload: {
    contentId: string;
    positionSeconds: number;
    durationSeconds: number;
    seasonId?: string;
    episodeId?: string;
  }): Promise<WatchHistoryItem> {
    const res = await fetch('/api/v1/me/history', {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getHistory(): Promise<WatchHistoryItem[]> {
    const res = await fetch('/api/v1/me/history', { headers: defaultHeaders() });
    return res.json();
  },

  async initPlayback(contentId: string, quality: string = '1080p'): Promise<PlaybackSession> {
    const res = await fetch('/api/v1/playback/play', {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ contentId, quality })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Playback initialization failed');
    }
    return data;
  },

  async getProfile(): Promise<any> {
    const res = await fetch('/api/v1/me/profile', { headers: defaultHeaders() });
    return res.json();
  },

  async removeDevice(deviceId: string): Promise<any> {
    const res = await fetch(`/api/v1/me/devices/${deviceId}`, { method: 'DELETE', headers: defaultHeaders() });
    return res.json();
  },

  async getAdminDashboard(): Promise<any> {
    const res = await fetch('/api/v1/admin/dashboard', { headers: defaultHeaders() });
    return res.json();
  },

  async getAdminLogs(params?: { level?: string; service?: string; search?: string; limit?: number }): Promise<{ logs: any[]; stats: any }> {
    const query = new URLSearchParams();
    if (params?.level && params.level !== 'all') query.append('level', params.level);
    if (params?.service) query.append('service', params.service);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await fetch(`/api/v1/admin/logs?${query.toString()}`, { headers: defaultHeaders() });
    return res.json();
  },

  async downloadRawLogs(): Promise<string> {
    const res = await fetch('/api/v1/admin/logs/raw', { headers: defaultHeaders() });
    return res.text();
  },

  async clearAdminLogs(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/v1/admin/logs/clear', {
      method: 'POST',
      headers: defaultHeaders()
    });
    return res.json();
  },

  async sendTestLog(payload: { level?: string; service?: string; action?: string; message?: string }): Promise<any> {
    const res = await fetch('/api/v1/admin/logs/test', {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getAdminUsers(): Promise<any[]> {
    const res = await fetch('/api/v1/admin/users', { headers: defaultHeaders() });
    return res.json();
  },

  async toggleBlockUser(userId: string): Promise<any> {
    const res = await fetch(`/api/v1/admin/users/${userId}/toggle-block`, {
      method: 'POST',
      headers: defaultHeaders()
    });
    return res.json();
  },

  async updateUserRole(userId: string, role: string): Promise<any> {
    const res = await fetch(`/api/v1/admin/users/${userId}/role`, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ role })
    });
    return res.json();
  },

  async updateUserPlan(userId: string, plan: string, durationDays: number = 30): Promise<any> {
    const res = await fetch(`/api/v1/admin/users/${userId}/plan`, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ plan, durationDays })
    });
    return res.json();
  },

  async resetUserDevices(userId: string): Promise<any> {
    const res = await fetch(`/api/v1/admin/users/${userId}/reset-devices`, {
      method: 'POST',
      headers: defaultHeaders()
    });
    return res.json();
  },

  async deleteAdminUser(userId: string): Promise<any> {
    const res = await fetch(`/api/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: defaultHeaders()
    });
    return res.json();
  },

  async getFinancials(): Promise<any> {
    const res = await fetch('/api/v1/admin/financials', { headers: defaultHeaders() });
    return res.json();
  },

  async recordPayment(payload: { userId: string; planId: string; amountRub: number; provider?: string }): Promise<any> {
    const res = await fetch('/api/v1/admin/payments/record', {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async registerNode(nodeData: any): Promise<any> {
    const res = await fetch('/api/v1/admin/nodes', {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(nodeData)
    });
    return res.json();
  },

  async toggleNodeStatus(nodeId: string, isOnline: boolean): Promise<any> {
    const res = await fetch(`/api/v1/admin/nodes/${nodeId}/toggle`, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ isOnline })
    });
    return res.json();
  },

  async pingNode(nodeId: string): Promise<any> {
    const res = await fetch(`/api/v1/admin/nodes/${nodeId}/ping`, {
      method: 'POST',
      headers: defaultHeaders()
    });
    return res.json();
  },

  async restartNode(nodeId: string): Promise<any> {
    const res = await fetch(`/api/v1/admin/nodes/${nodeId}/restart`, {
      method: 'POST',
      headers: defaultHeaders()
    });
    return res.json();
  },

  async flushNodeCache(nodeId: string): Promise<any> {
    const res = await fetch(`/api/v1/admin/nodes/${nodeId}/flush-cache`, {
      method: 'POST',
      headers: defaultHeaders()
    });
    return res.json();
  },

  async flushAllNodes(): Promise<any> {
    const res = await fetch('/api/v1/admin/nodes/flush-all', {
      method: 'POST',
      headers: defaultHeaders()
    });
    return res.json();
  },

  async deleteNode(nodeId: string): Promise<any> {
    const res = await fetch(`/api/v1/admin/nodes/${nodeId}`, {
      method: 'DELETE',
      headers: defaultHeaders()
    });
    return res.json();
  },

  async sendTelemetry(telemetryData: any, secret?: string): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (secret) {
      headers['X-Node-Secret'] = secret;
    }
    const res = await fetch('/api/v1/admin/nodes/telemetry', {
      method: 'POST',
      headers,
      body: JSON.stringify(telemetryData)
    });
    return res.json();
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
    const res = await fetch('/api/v1/admin/tmdb-sync', {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ query })
    });
    if (!res.ok) throw new Error('Failed TMDB Sync');
    return res.json();
  },

  async createContent(contentData: any): Promise<any> {
    const res = await fetch('/api/v1/admin/content', {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(contentData)
    });
    if (!res.ok) throw new Error('Failed to create content');
    return res.json();
  },

  async getMetadataStatus(): Promise<{ tmdb: { configured: boolean; key_preview: string | null }; tvdb: { configured: boolean; key_preview: string | null } }> {
    const res = await fetch('/api/v1/metadata/status', { headers: defaultHeaders() });
    return res.json();
  },

  async getPerson(idOrName: string | number): Promise<any> {
    const res = await fetch(`/api/v1/metadata/person/${encodeURIComponent(idOrName)}`, { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Person not found');
    return res.json();
  },

  async autoPopulateCatalog(): Promise<{ success: boolean; added: number }> {
    const res = await fetch('/api/v1/metadata/auto-populate', {
      method: 'POST',
      headers: defaultHeaders()
    });
    if (!res.ok) throw new Error('Auto populate failed');
    return res.json();
  },

  async searchMetadata(query: string, provider: 'tmdb' | 'tvdb' | 'all' = 'all'): Promise<{ results: any[]; errors: string[] }> {
    const res = await fetch(`/api/v1/metadata/search?q=${encodeURIComponent(query)}&provider=${provider}`, { headers: defaultHeaders() });
    return res.json();
  },

  async importMetadata(externalId: number | string, source: 'tmdb' | 'tvdb', type: 'movie' | 'series'): Promise<{ success: boolean; item: ContentItem }> {
    const res = await fetch('/api/v1/metadata/import', {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ externalId, source, type })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Import failed');
    return data;
  }
};
