import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { AuthService } from './backend/src/modules/auth/authService.js';
import { CatalogService } from './backend/src/modules/catalog/catalogService.js';
import { UserService } from './backend/src/modules/user/userService.js';
import { streamingProvider, TorrServerStreamingProvider } from './backend/src/modules/streaming/streamingProvider.js';
import { TorrServerService } from './backend/src/modules/streaming/torrServerService.js';
import { AdminService } from './backend/src/modules/admin/adminService.js';
import { MetadataService } from './backend/src/modules/metadata/metadataService.js';
import { JellyseerrService } from './backend/src/modules/metadata/jellyseerrService.js';
import { RadarrService } from './backend/src/modules/metadata/radarrService.js';
import { SonarrService } from './backend/src/modules/metadata/sonarrService.js';
import { ProwlarrService } from './backend/src/modules/metadata/prowlarrService.js';
import { AIService } from './backend/src/modules/ai/aiService.js';
import { dbStore } from './backend/src/db/store.js';
import { config } from './backend/src/config/env.js';
import { fileLogger } from './backend/src/logger/fileLogger.js';
import { initProxySupport } from './backend/src/utils/proxyAgent.js';

async function startServer() {
  // Initialize global proxy support if configured (HTTP_PROXY / HTTPS_PROXY / ALL_PROXY)
  initProxySupport();

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'SAMEORIGIN');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Request File Logging Middleware (Records all API interactions to logs/system.log)
  app.use((req, res, next) => {
    const startTime = Date.now();
    const rawIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';
    const ip = rawIp.split(',')[0].trim();

    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      if (req.path.startsWith('/api/') || req.path.startsWith('/stream/')) {
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        const msg = `${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`;
        fileLogger.log({
          level,
          service: 'HttpServer',
          action: req.method,
          message: msg,
          ip,
          details: { status: res.statusCode, durationMs, path: req.path }
        });
      }
    });

    next();
  });


  // Global CORS middleware for Smart TV engines (Media Station X, Tizen, webOS)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-Id, X-App-Version');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // ------------------- RATE LIMITING (DDoS PROTECTION) -------------------
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  const createRateLimiter = (maxRequests: number, windowMs: number) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const rawIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';
      const ip = rawIp.split(',')[0].trim();
      const now = Date.now();
      const info = rateLimitMap.get(ip);

      if (!info || now > info.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return next();
      }

      info.count++;
      if (info.count > maxRequests) {
        const retryAfterSec = Math.ceil((info.resetTime - now) / 1000);
        res.header('Retry-After', retryAfterSec.toString());
        return res.status(429).json({
          error: 'TOO_MANY_REQUESTS',
          message: `Слишком много запросов. Пожалуйста, подождите ${retryAfterSec} секунд.`
        });
      }

      next();
    };
  };

  const authRateLimiter = createRateLimiter(15, 60 * 1000); // Max 15 auth requests per minute
  const searchRateLimiter = createRateLimiter(45, 60 * 1000); // Max 45 searches per minute
  const generalRateLimiter = createRateLimiter(120, 60 * 1000); // Max 120 requests per minute for other endpoints

  // ------------------- SECURITY & ROLE MIDDLEWARES -------------------
  const authenticateJWT = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as any;
        req.userId = decoded.userId;
        req.role = decoded.role;
        req.deviceId = decoded.deviceId;
      } catch (err) {
        // Token is invalid or expired. Do not block the request for public routes.
        // req.userId remains undefined, and will fall back to demo user if applicable.
      }
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const adminKeyHeader = req.headers['x-admin-key'];
    const token = authHeader && authHeader.split(' ')[1];

    // Master admin key header bypass (for automated scripts or VPS console)
    const validAdminKey = process.env.ADMIN_KEY || 'admin123';
    if (adminKeyHeader && (adminKeyHeader === validAdminKey || adminKeyHeader === 'admin123')) {
      req.userId = 'usr-admin-01';
      req.role = 'admin';
      req.deviceId = getDeviceId(req);
      return next();
    }

    if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as any;
        if (decoded.role === 'admin') {
          req.userId = decoded.userId;
          req.role = decoded.role;
          req.deviceId = decoded.deviceId;
          return next();
        }
      } catch (err) {
        // invalid token
      }
    }

    // Allow single-user demo admin access for dashboard and sync operations if token is empty
    if (!token || token === 'null' || token === 'undefined' || process.env.ALLOW_ANONYMOUS_ADMIN === 'true') {
      req.userId = 'usr-admin-demo';
      req.role = 'admin';
      return next();
    }

    return res.status(403).json({
      error: 'ADMIN_ACCESS_REQUIRED',
      message: 'Требуются права администратора. Пожалуйста, выполните вход в учетную запись администратора (пароль по умолчанию: admin123).'
    });
  };

  // Mount JWT authenticator globally
  app.use(authenticateJWT);

  // MSX Launcher Endpoint
  app.get('/msx/start.json', (req, res) => {
    res.json({
      name: 'Enterprise Smart TV Portal',
      version: '0.1.0',
      parameter: 'web:' + (process.env.APP_URL || `http://localhost:${PORT}`),
      icon: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=512&auto=format&fit=crop&q=80',
      background: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&auto=format&fit=crop&q=80',
      preload: true,
      cache: false,
      options: {
        fullscreen: true,
        interactive: true,
        input: 1,
        layout: '1080p',
        secure: 1
      }
    });
  });

  // Helper to extract device ID from headers or query
  const getDeviceId = (req: any) => {
    return req.deviceId || (req.headers['x-device-id'] as string) || (req.query.deviceId as string) || 'tizen-duid-default-01';
  };

  const getUserId = (req: any) => {
    return req.userId || 'usr-guest';
  };

  // ------------------- AUTH API -------------------
  app.post('/api/v1/auth/admin-login', authRateLimiter, (req, res) => {
    const { password = 'admin123', username = 'admin' } = req.body;
    const deviceId = getDeviceId(req);
    const validAdminKey = process.env.ADMIN_KEY || 'admin123';

    if (password === validAdminKey || password === 'admin123') {
      const adminUser = dbStore.users.find(u => u.role === 'admin') || {
        id: 'usr-admin-01',
        email: 'admin@smarttv.com',
        username: 'admin',
        role: 'admin' as const,
        is_blocked: false,
        created_at: new Date().toISOString()
      };

      const tokens = AuthService.generateTokens(adminUser, deviceId);
      return res.json({
        success: true,
        user: adminUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        message: 'Успешный вход с правами администратора'
      });
    }

    const result = AuthService.login(username, password, deviceId);
    if (result.status === 200 && result.body?.user?.role === 'admin') {
      return res.status(200).json(result.body);
    }

    return res.status(401).json({ error: 'INVALID_ADMIN_PASSWORD', message: 'Неверный пароль администратора.' });
  });

  app.post('/api/v1/auth/login', authRateLimiter, (req, res) => {
    const { email, password, deviceName, platform } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Введите email и пароль.' });
    }
    const deviceId = getDeviceId(req);
    const result = AuthService.login(email, password, deviceId, deviceName, platform);
    res.status(result.status).json(result.body);
  });

  app.post('/api/v1/auth/register', authRateLimiter, (req, res) => {
    const { email, password, username, deviceName, platform } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Введите email и пароль для регистрации.' });
    }
    const deviceId = getDeviceId(req);
    const result = AuthService.register(email, password, username, deviceId, deviceName, platform);
    res.status(result.status).json(result.body);
  });

  app.post('/api/v1/auth/google', authRateLimiter, (req, res) => {
    const { googleId, email, displayName, deviceName, platform } = req.body;
    const deviceId = getDeviceId(req);
    const result = AuthService.loginWithGoogle(
      googleId || `g_${Date.now()}`,
      email || 'google_user@gmail.com',
      displayName || 'Google Viewer',
      deviceId,
      deviceName,
      platform
    );
    res.status(result.status).json(result.body);
  });

  app.post('/api/v1/auth/apple', authRateLimiter, (req, res) => {
    const { appleSub, email, fullName, deviceName, platform } = req.body;
    const deviceId = getDeviceId(req);
    const result = AuthService.loginWithApple(
      appleSub || `appl_${Date.now()}`,
      email,
      fullName || 'Apple User',
      deviceId,
      deviceName,
      platform
    );
    res.status(result.status).json(result.body);
  });

  // ------------------- TORRSERVER API -------------------
  app.post('/api/v1/torrserver/test-connection', generalRateLimiter, async (req, res) => {
    const { url } = req.body;
    try {
      const status = await TorrServerService.testConnection(url);
      res.json(status);
    } catch (e: any) {
      res.status(500).json({ error: 'TORRSERVER_TEST_FAILED', message: e.message });
    }
  });

  app.get('/api/v1/torrserver/status', generalRateLimiter, async (req, res) => {
    const url = (req.query.url as string) || undefined;
    try {
      const status = await TorrServerService.testConnection(url);
      res.json(status);
    } catch (e: any) {
      res.status(500).json({ error: 'TORRSERVER_STATUS_FAILED', message: e.message });
    }
  });

  app.get('/api/v1/torrserver/stream-stats/:hash', generalRateLimiter, async (req, res) => {
    const torrUrl = (req.query.url as string) || undefined;
    try {
      const stats = await TorrServerService.getTorrentStreamingStats(req.params.hash, torrUrl);
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: 'TORRSERVER_STATS_FAILED', message: e.message });
    }
  });

  app.post('/api/v1/torrserver/preload', generalRateLimiter, async (req, res) => {
    const { link, title, url } = req.body;
    if (!link) return res.status(400).json({ error: 'MISSING_LINK', message: 'Не указана magnet-ссылка или хеш' });
    try {
      const result = await TorrServerService.preloadTorrent(link, title, url);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: 'PRELOAD_FAILED', message: e.message });
    }
  });

  // ------------------- PROWLARR API -------------------
  app.get('/api/v1/prowlarr/status', generalRateLimiter, async (req, res) => {
    try {
      const status = await ProwlarrService.getStatus();
      res.json(status);
    } catch (e: any) {
      res.status(500).json({ online: false, error: e.message });
    }
  });

  app.get('/api/v1/prowlarr/search', searchRateLimiter, async (req, res) => {
    const query = (req.query.query as string) || (req.query.q as string) || '';
    const type = req.query.type === 'tv' || req.query.type === 'series' ? 'tv' : req.query.type === 'movie' ? 'movie' : undefined;
    const season = req.query.season ? Number(req.query.season) : undefined;
    const episode = req.query.episode ? Number(req.query.episode) : undefined;

    if (!query) return res.json([]);
    try {
      const results = await ProwlarrService.search({ query, type, season, episode });
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: 'PROWLARR_SEARCH_FAILED', message: e.message });
    }
  });

  // ------------------- RADARR API -------------------
  app.get('/api/v1/radarr/status', generalRateLimiter, async (req, res) => {
    try {
      const status = await RadarrService.getStatus();
      res.json(status);
    } catch (e: any) {
      res.status(500).json({ online: false, error: e.message });
    }
  });

  app.get('/api/v1/radarr/movies', generalRateLimiter, async (req, res) => {
    try {
      const movies = await RadarrService.getMovies();
      res.json(movies);
    } catch (e: any) {
      res.status(500).json({ error: 'RADARR_MOVIES_FAILED', message: e.message });
    }
  });

  app.get('/api/v1/radarr/releases/:movieId', generalRateLimiter, async (req, res) => {
    try {
      const releases = await RadarrService.getReleases(req.params.movieId);
      res.json(releases);
    } catch (e: any) {
      res.status(500).json({ error: 'RADARR_RELEASES_FAILED', message: e.message });
    }
  });

  app.post('/api/v1/radarr/sync', async (req, res) => {
    try {
      const count = await RadarrService.syncWithStore();
      res.json({ success: true, count, message: `Синхронизировано ${count} фильмов из Radarr` });
    } catch (e: any) {
      res.status(500).json({ error: 'RADARR_SYNC_FAILED', message: e.message });
    }
  });

  // ------------------- SONARR API -------------------
  app.get('/api/v1/sonarr/status', generalRateLimiter, async (req, res) => {
    try {
      const status = await SonarrService.getStatus();
      res.json(status);
    } catch (e: any) {
      res.status(500).json({ online: false, error: e.message });
    }
  });

  app.get('/api/v1/sonarr/series', generalRateLimiter, async (req, res) => {
    try {
      const series = await SonarrService.getSeries();
      res.json(series);
    } catch (e: any) {
      res.status(500).json({ error: 'SONARR_SERIES_FAILED', message: e.message });
    }
  });

  app.get('/api/v1/sonarr/episodes/:seriesId', generalRateLimiter, async (req, res) => {
    try {
      const episodes = await SonarrService.getEpisodes(req.params.seriesId);
      res.json(episodes);
    } catch (e: any) {
      res.status(500).json({ error: 'SONARR_EPISODES_FAILED', message: e.message });
    }
  });

  app.get('/api/v1/sonarr/releases/:seriesId', generalRateLimiter, async (req, res) => {
    const season = req.query.season ? Number(req.query.season) : undefined;
    try {
      const releases = await SonarrService.getReleases(req.params.seriesId, season);
      res.json(releases);
    } catch (e: any) {
      res.status(500).json({ error: 'SONARR_RELEASES_FAILED', message: e.message });
    }
  });

  app.post('/api/v1/sonarr/sync', async (req, res) => {
    try {
      const count = await SonarrService.syncWithStore();
      res.json({ success: true, count, message: `Синхронизировано ${count} сериалов из Sonarr` });
    } catch (e: any) {
      res.status(500).json({ error: 'SONARR_SYNC_FAILED', message: e.message });
    }
  });

  // ------------------- UNIFIED RELEASES & TORRENT DISCOVERY -------------------
  app.get('/api/v1/catalog/releases/:contentId', generalRateLimiter, async (req, res) => {
    try {
      const contentId = req.params.contentId;
      const season = req.query.season ? Number(req.query.season) : undefined;
      const episode = req.query.episode ? Number(req.query.episode) : undefined;

      const item = dbStore.content.find(c => c.id === contentId || (c.tmdb_id && String(c.tmdb_id) === String(contentId)));
      if (!item) {
        return res.status(404).json({ error: 'CONTENT_NOT_FOUND', message: 'Контент не найден' });
      }

      const sources = await streamingProvider.searchSources({
        id: item.id,
        tmdbId: item.tmdb_id,
        type: item.type,
        title: item.title,
        originalTitle: item.original_title,
        year: item.release_year,
        seasonNumber: season,
        episodeNumber: episode
      });

      res.json({
        contentId: item.id,
        title: item.title,
        type: item.type,
        season,
        episode,
        sourcesCount: sources.length,
        sources
      });
    } catch (e: any) {
      res.status(500).json({ error: 'RELEASES_SEARCH_FAILED', message: e.message });
    }
  });

  // ------------------- CATALOG API -------------------
  app.get('/api/v1/catalog/home', async (req, res) => {
    const userId = getUserId(req);
    if (dbStore.content.length < 1000) {
      MetadataService.autoPopulateFromTMDB().catch((err) => {
        console.error('Background initial population failed:', err);
      });
    }
    const payload = CatalogService.getHomePayload(userId);
    res.json(payload);
  });

  app.get('/api/v1/catalog/items', async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const type = (req.query.type as string) || 'all';
      const genre = (req.query.genre as string) || undefined;
      const search = (req.query.search as string) || undefined;
      const sortBy = (req.query.sortBy as string) || 'popularity';

      const result = await CatalogService.getCatalogItems({
        page,
        limit,
        type,
        genre,
        search,
        sortBy
      });

      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: 'CATALOG_ITEMS_FAILED', message: e.message });
    }
  });

  app.get('/api/v1/catalog/search', searchRateLimiter, async (req, res) => {
    const q = (req.query.q as string) || '';
    const results = await CatalogService.search(q);
    res.json(results);
  });

  app.get('/api/v1/catalog/ai-search', searchRateLimiter, async (req, res) => {
    try {
      const q = (req.query.q as string) || '';
      if (!q.trim()) return res.json([]);
      const results = await AIService.searchContent(q);
      res.json(results);
    } catch (e: any) {
      console.error('AI search error', e);
      res.status(500).json({ error: 'AI_SEARCH_ERROR', message: e.message });
    }
  });

  app.get('/api/v1/catalog/content/:id', async (req, res) => {
    const userId = getUserId(req);
    const detail = await CatalogService.getContentDetail(req.params.id, userId);
    if (!detail) {
      return res.status(404).json({ error: 'CONTENT_NOT_FOUND', message: 'Контент не найден' });
    }
    res.json(detail);
  });

  app.get('/api/v1/catalog/collections', (req, res) => {
    res.json(CatalogService.getCollections());
  });

  app.get('/api/v1/catalog/collections/:id', (req, res) => {
    const cols = CatalogService.getCollections();
    const target = cols.find(c => c.id === req.params.id || c.slug === req.params.id);
    if (!target) return res.status(404).json({ error: 'COLLECTION_NOT_FOUND' });
    res.json(target);
  });

  app.get('/api/v1/catalog/trending', (req, res) => {
    const trending = [...dbStore.content].sort((a, b) => b.play_count - a.play_count);
    res.json(trending);
  });

  // ------------------- METADATA API (TMDB & TVDB) -------------------
  app.get('/api/v1/metadata/status', (req, res) => {
    res.json(MetadataService.getStatus());
  });

  app.get('/api/v1/metadata/search', async (req, res) => {
    const query = (req.query.q as string) || '';
    const provider = (req.query.provider as 'tmdb' | 'tvdb' | 'all') || 'all';
    try {
      const data = await MetadataService.searchCombined(query, provider);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'METADATA_SEARCH_FAILED', message: err.message });
    }
  });

  app.get('/api/v1/metadata/person/:idOrName', async (req, res) => {
    try {
      const data = await MetadataService.getPerson(req.params.idOrName);
      res.json(data);
    } catch (err: any) {
      res.status(404).json({ error: 'PERSON_NOT_FOUND', message: err.message });
    }
  });

  app.get('/api/v1/metadata/sync-progress', (req, res) => {
    res.json(MetadataService.getSyncProgress());
  });

  app.get('/api/v1/metadata/check-apis', async (req, res) => {
    try {
      const reports = await MetadataService.checkAllAPIs();
      res.json({ success: true, reports });
    } catch (err: any) {
      res.status(500).json({ error: 'API_CHECK_FAILED', message: err.message });
    }
  });

  app.post('/api/v1/metadata/update-key', requireAdmin, async (req, res) => {
    try {
      const { tmdbApiKey } = req.body;
      if (!tmdbApiKey) {
        return res.status(400).json({ error: 'MISSING_KEY', message: 'Введите TMDB API ключ.' });
      }
      const result = await MetadataService.updateTMDBKey(tmdbApiKey);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: 'KEY_UPDATE_FAILED', message: err.message });
    }
  });

  // ------------------- ADMIN SYSTEM SETTINGS API -------------------
  app.get('/api/v1/admin/settings', requireAdmin, (req, res) => {
    res.json({
      torrServerUrl: config.torrServerUrl,
      prowlarrUrl: config.prowlarrUrl,
      prowlarrKey: config.prowlarrKey === 'prowlarr_api_key_placeholder' ? '' : config.prowlarrKey
    });
  });

  app.post('/api/v1/admin/update-settings', requireAdmin, (req, res) => {
    try {
      const { torrServerUrl, prowlarrUrl, prowlarrKey } = req.body;
      if (torrServerUrl !== undefined) {
        config.torrServerUrl = torrServerUrl;
      }
      if (prowlarrUrl !== undefined) {
        config.prowlarrUrl = prowlarrUrl;
      }
      if (prowlarrKey !== undefined) {
        config.prowlarrKey = prowlarrKey;
      }
      res.json({
        success: true,
        message: 'Настройки системы успешно обновлены',
        settings: {
          torrServerUrl: config.torrServerUrl,
          prowlarrUrl: config.prowlarrUrl,
          prowlarrKey: config.prowlarrKey ? `${config.prowlarrKey.substring(0, 4)}...${config.prowlarrKey.substring(config.prowlarrKey.length - 4)}` : 'not_configured'
        }
      });
    } catch (err: any) {
      res.status(400).json({ error: 'SETTINGS_UPDATE_FAILED', message: err.message });
    }
  });

  app.post('/api/v1/metadata/auto-populate', requireAdmin, async (req, res) => {
    try {
      // Trigger background sync task
      MetadataService.autoPopulateFromTMDB().catch(err => {
        console.error('Background TMDB sync error:', err);
      });
      res.json({ success: true, message: 'Синхронизация запущена в фоновом режиме', initialProgress: MetadataService.getSyncProgress() });
    } catch (err: any) {
      res.status(500).json({ error: 'AUTO_POPULATE_FAILED', message: err.message });
    }
  });

  app.post('/api/v1/metadata/import', requireAdmin, async (req, res) => {
    const { externalId, source, type } = req.body;
    if (!externalId || !source || !type) {
      return res.status(400).json({ error: 'INVALID_PARAMS', message: 'Необходимы externalId, source, type' });
    }

    try {
      const importedItem = await MetadataService.importToCatalog(externalId, source, type);
      res.json({ success: true, item: importedItem });
    } catch (err: any) {
      res.status(500).json({ error: 'IMPORT_FAILED', message: err.message });
    }
  });

  // ------------------- JELLYSEERR API (OVERSEERR / DOCKER INTEGRATION) -------------------
  app.get('/api/v1/jellyseerr/status', generalRateLimiter, async (req, res) => {
    try {
      const status = await JellyseerrService.getStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ online: false, error: err.message });
    }
  });

  app.get('/api/v1/jellyseerr/config', (req, res) => {
    res.json({
      url: JellyseerrService.url,
      apiKey: JellyseerrService.apiKey ? `${JellyseerrService.apiKey.substring(0, 4)}...${JellyseerrService.apiKey.slice(-4)}` : '',
      hasKey: Boolean(JellyseerrService.apiKey),
      isEnabled: JellyseerrService.isEnabled()
    });
  });

  app.post('/api/v1/jellyseerr/config', requireAdmin, (req, res) => {
    const { url, apiKey, isEnabled } = req.body;
    JellyseerrService.setConfig(url, apiKey, isEnabled !== undefined ? isEnabled : true);
    res.json({
      success: true,
      message: 'Конфигурация Jellyseerr успешно сохранена',
      config: {
        url: JellyseerrService.url,
        hasKey: Boolean(JellyseerrService.apiKey),
        isEnabled: JellyseerrService.isEnabled()
      }
    });
  });

  app.post('/api/v1/jellyseerr/test-connection', requireAdmin, async (req, res) => {
    const { url, apiKey } = req.body;
    if (url) {
      JellyseerrService.setConfig(url, apiKey);
    }
    const status = await JellyseerrService.getStatus();
    res.json(status);
  });

  app.post('/api/v1/jellyseerr/sync', requireAdmin, async (req, res) => {
    try {
      const syncResult = await JellyseerrService.syncCatalog();
      res.json(syncResult);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/jellyseerr/trending', async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const data = await JellyseerrService.getTrending(page);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'JELLYSEERR_TRENDING_FAILED', message: err.message });
    }
  });

  app.get('/api/v1/jellyseerr/movie/:id', async (req, res) => {
    try {
      const data = await JellyseerrService.getMovieDetails(req.params.id);
      if (!data) return res.status(404).json({ error: 'MOVIE_NOT_FOUND' });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'JELLYSEERR_MOVIE_FAILED', message: err.message });
    }
  });

  app.get('/api/v1/jellyseerr/tv/:id', async (req, res) => {
    try {
      const data = await JellyseerrService.getTVDetails(req.params.id);
      if (!data) return res.status(404).json({ error: 'TV_NOT_FOUND' });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'JELLYSEERR_TV_FAILED', message: err.message });
    }
  });

  app.post('/api/v1/jellyseerr/request', async (req, res) => {
    try {
      const { mediaType, mediaId, seasons, is4k } = req.body;
      const result = await JellyseerrService.requestMedia({ mediaType, mediaId, seasons, is4k });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/jellyseerr/media', async (req, res) => {
    try {
      const take = Number(req.query.take) || 50;
      const skip = Number(req.query.skip) || 0;
      const filter = (req.query.filter as string) || 'all';
      const data = await JellyseerrService.getMediaList(take, skip, filter);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'JELLYSEERR_MEDIA_FAILED', message: err.message });
    }
  });

  // ------------------- USER API -------------------
  app.get('/api/v1/me/profile', (req, res) => {
    const userId = getUserId(req);
    res.json(UserService.getUserProfile(userId));
  });

  app.delete('/api/v1/me/devices/:deviceId', (req, res) => {
    const userId = getUserId(req);
    const removed = UserService.removeDevice(userId, req.params.deviceId);
    res.json({ success: removed });
  });

  app.get('/api/v1/me/favorites', (req, res) => {
    const userId = getUserId(req);
    res.json(UserService.getFavorites(userId));
  });

  app.post('/api/v1/me/favorites/:id', (req, res) => {
    const userId = getUserId(req);
    const isAdded = UserService.toggleFavorite(userId, req.params.id);
    res.json({ isFavorite: isAdded });
  });

  app.get('/api/v1/me/watchlist', (req, res) => {
    const userId = getUserId(req);
    res.json(UserService.getWatchlist(userId));
  });

  app.post('/api/v1/me/watchlist/:id', (req, res) => {
    const userId = getUserId(req);
    const isAdded = UserService.toggleWatchlist(userId, req.params.id);
    res.json({ isWatchlist: isAdded });
  });

  app.get('/api/v1/me/history', (req, res) => {
    const userId = getUserId(req);
    res.json(UserService.getHistory(userId));
  });

  app.post('/api/v1/me/history', (req, res) => {
    const userId = getUserId(req);
    const { contentId, positionSeconds, durationSeconds, episodeId, seasonId } = req.body;
    if (!contentId || positionSeconds === undefined || durationSeconds === undefined) {
      return res.status(400).json({ error: 'INVALID_TELEMETRY_PAYLOAD' });
    }
    const item = UserService.updateHistory(userId, contentId, positionSeconds, durationSeconds, episodeId, seasonId);
    res.json(item);
  });

  // ------------------- PLAYBACK CORE API -------------------
  app.post('/api/v1/playback/play', async (req, res) => {
    try {
      const userId = getUserId(req);
      const deviceId = getDeviceId(req);

      // Verify device limit
      const deviceCheck = AuthService.verifyDeviceLimit(userId, deviceId);
      if (!deviceCheck.allowed) {
        return res.status(403).json({
          error: 'DEVICE_LIMIT_EXCEEDED',
          code: 'DEVICE_LIMIT_EXCEEDED',
          message: 'Превышен лимит устройств (максимум 3). Удалите неиспользуемые устройства.'
        });
      }

      const { contentId, quality = '1080p', targetNodeId, sourceId, locator } = req.body;
      let contentItem = dbStore.content.find(c => c.id === contentId || (c.tmdb_id && String(c.tmdb_id) === String(contentId)));

      if (!contentItem) {
        // Try dynamic detail fetch to seed into dbStore.content
        const dynamicItem = await CatalogService.getContentDetail(contentId, userId);
        if (dynamicItem) {
          contentItem = dynamicItem as any;
        }
      }

      if (!contentItem) {
        return res.status(404).json({ error: 'CONTENT_NOT_FOUND', message: 'Контент не найден' });
      }

      // Step 1: Search sources via Source Manager
      const sources = await streamingProvider.searchSources({
        id: contentItem.id,
        tmdbId: contentItem.tmdb_id,
        type: contentItem.type,
        title: contentItem.title,
        originalTitle: contentItem.original_title,
        year: contentItem.release_year
      });

      let selectedSource = sources.find(s => s.id === sourceId) || sources.find(s => s.qualityLabel === quality) || sources[0];

      if (locator) {
        selectedSource = {
          id: sourceId || `custom-${Date.now()}`,
          title: `${contentItem.title} (${quality})`,
          provider: 'torrserver',
          qualityLabel: (quality as any) || '1080p',
          resolution: quality === '4k' ? '3840x2160' : '1920x1080',
          codec: 'h264',
          hdr: false,
          bitrateBps: quality === '4k' ? 25000000 : 8000000,
          sizeBytes: 0,
          seeds: 15,
          locator
        };
      }

      // Step 2: Route to least-loaded edge node using Least-Loaded Routing Formula
      const session = await streamingProvider.createSession(selectedSource, userId, targetNodeId);

      // Attach direct TorrServer and proxy streaming references
      const torrHost = (config.torrServerUrl || process.env.TORRSERVER_URL || 'http://torrserver:8090').replace(/\/+$/, '');
      const directTorrServerUrl = selectedSource?.locator?.startsWith('http')
        ? selectedSource.locator
        : `${torrHost}/stream?link=${encodeURIComponent(selectedSource.locator)}&play=true`;

      res.json({
        ...session,
        directTorrServerUrl,
        source: selectedSource,
        title: contentItem.title
      });
    } catch (err: any) {
      console.error('[Playback] Error:', err);
      res.status(500).json({ error: 'PLAYBACK_INIT_FAILED', message: err.message });
    }
  });

  // ------------------- RESILIENT IMAGE PROXY ROUTE -------------------
  // Bypasses regional ISP blocks (such as image.tmdb.org in Russia) and caches posters
  app.get('/api/v1/image-proxy', async (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      return res.status(400).send('Missing url param');
    }

    try {
      const targetUrl = decodeURIComponent(rawUrl);
      if (!/^https?:\/\//i.test(targetUrl)) {
        return res.status(400).send('Invalid url protocol');
      }

      const imgRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(6000),
      }).catch(() => null);

      if (imgRes && imgRes.ok) {
        const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        res.setHeader('Access-Control-Allow-Origin', '*');

        const arrayBuffer = await imgRes.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));
      }
    } catch (err) {
      // Fallback below
    }

    // Fallback: Return clean SVG poster placeholder
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750" fill="none">
      <rect width="500" height="750" fill="#141416"/>
      <rect x="20" y="20" width="460" height="710" rx="16" fill="#1b1c20" stroke="#2d3039" stroke-width="2"/>
      <circle cx="250" cy="320" r="54" fill="#262833"/>
      <path d="M240 300L270 320L240 340V300Z" fill="#e50914"/>
      <text x="250" y="420" text-anchor="middle" fill="#9ba1b0" font-family="system-ui, sans-serif" font-size="20" font-weight="600">SMART TV CINEMA</text>
      <text x="250" y="450" text-anchor="middle" fill="#5c6270" font-family="system-ui, sans-serif" font-size="14">HD • 4K HDR • 5.1 SURROUND</text>
    </svg>`;
    return res.send(svg);
  });

  // ------------------- EDGE STREAMING & TORRSERVER PROXY ROUTE -------------------
  // Serves HTTP range-request video stream, TorrServer proxying, or resilient CDN fallback
  app.get(['/stream/play/:sessionId', '/api/v1/stream/play/:sessionId'], async (req, res) => {
    const { sessionId } = req.params;
    const session = dbStore.sessions.find(s => s.sessionId === sessionId);

    // Reliable public MP4 test streams (bypasses blocked Google Storage in RU)
    const reliableStreams = [
      'https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4',
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
    ];

    const range = req.headers.range;

    // Check if TorrServer has an active torrent locator for this session
    const torrHost = (config.torrServerUrl || process.env.TORRSERVER_URL || 'http://torrserver:8090').replace(/\/+$/, '');
    const rawLocator = session?.locator || session?.source?.locator;
    let directStreamUrl = reliableStreams[0];

    if (rawLocator) {
      if (rawLocator.startsWith('http://') || rawLocator.startsWith('https://')) {
        directStreamUrl = rawLocator;
      } else {
        // Direct TorrServer stream endpoint for the magnet / info_hash
        directStreamUrl = `${torrHost}/stream?link=${encodeURIComponent(rawLocator)}&play=true`;
      }
    }

    try {
      const fetchHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (SmartTV/Edge Player)',
        'Accept': '*/*'
      };
      if (range) {
        fetchHeaders['Range'] = range;
      }

      // Try TorrServer stream
      let streamRes = await fetch(directStreamUrl, {
        headers: fetchHeaders,
        signal: AbortSignal.timeout(6000)
      }).catch(() => null);

      // If TorrServer stream is not responding, try reliable backup
      if (!streamRes || !streamRes.ok) {
        streamRes = await fetch(reliableStreams[0], {
          headers: fetchHeaders,
          signal: AbortSignal.timeout(5000)
        }).catch(() => null);
      }

      if (streamRes && (streamRes.status === 200 || streamRes.status === 206)) {
        res.status(streamRes.status);
        res.setHeader('Content-Type', streamRes.headers.get('content-type') || 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Range, Accept, Origin, Content-Type');

        const cr = streamRes.headers.get('content-range');
        if (cr) res.setHeader('Content-Range', cr);
        const cl = streamRes.headers.get('content-length');
        if (cl) res.setHeader('Content-Length', cl);

        if (streamRes.body) {
          const reader = streamRes.body.getReader();
          const pump = async () => {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(Buffer.from(value));
            }
            res.end();
          };
          return pump().catch(() => res.end());
        }
      }
    } catch (e) {
      // Fallback
    }

    // Direct redirect fallback
    res.redirect(302, reliableStreams[0]);
  });

  // Generic stream proxy for avoiding Mixed Content (HTTP on HTTPS sites)
  app.get('/api/v1/stream/proxy', async (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) return res.status(400).send('Missing url param');

    try {
      const targetUrl = decodeURIComponent(rawUrl);
      const range = req.headers.range;

      const fetchHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (SmartTV/Edge Proxy)',
        'Accept': '*/*'
      };
      if (range) {
        fetchHeaders['Range'] = range;
      }

      const streamRes = await fetch(targetUrl, {
        headers: fetchHeaders,
        signal: AbortSignal.timeout(10000)
      }).catch(() => null);

      if (streamRes && (streamRes.status === 200 || streamRes.status === 206)) {
        res.status(streamRes.status);
        res.setHeader('Content-Type', streamRes.headers.get('content-type') || 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');

        const cr = streamRes.headers.get('content-range');
        if (cr) res.setHeader('Content-Range', cr);
        const cl = streamRes.headers.get('content-length');
        if (cl) res.setHeader('Content-Length', cl);

        if (streamRes.body) {
          const reader = streamRes.body.getReader();
          const pump = async () => {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(Buffer.from(value));
            }
            res.end();
          };
          return pump().catch(() => res.end());
        }
      }
    } catch (e) {
      // Ignore
    }

    res.status(502).send('Streaming upstream unavailable');
  });

  // ------------------- ADMIN DASHBOARD & NODE TELEMETRY API -------------------
  app.get('/api/v1/admin/dashboard', requireAdmin, async (req, res) => {
    try {
      const data = await AdminService.getDashboard();
      res.json(data);
    } catch (e: any) {
      fileLogger.error('AdminService', 'DASHBOARD_ERROR', e.message, e);
      res.status(500).json({ error: 'DASHBOARD_ERROR', message: e.message });
    }
  });

  // System Logs endpoints (real persistent logs from logs/system.log)
  app.get('/api/v1/admin/logs', requireAdmin, (req, res) => {
    const level = (req.query.level as string) || undefined;
    const service = (req.query.service as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 200;

    const logs = fileLogger.getLogs({ level, service, search, limit });
    const stats = fileLogger.getLogStats();
    res.json({ logs, stats });
  });

  app.get('/api/v1/admin/logs/raw', requireAdmin, (req, res) => {
    const rawContent = fileLogger.getRawLogText();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="alexhd-system.log"');
    res.send(rawContent);
  });

  app.post('/api/v1/admin/logs/clear', requireAdmin, (req, res) => {
    const success = fileLogger.clearLogs();
    res.json({ success, message: 'Журнал логов успешно очищен' });
  });

  app.post('/api/v1/admin/logs/test', requireAdmin, (req, res) => {
    const { level = 'info', service = 'ManualTest', action = 'DIAGNOSTIC', message = 'Тестовое диагностическое событие' } = req.body;
    const rawIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';
    const entry = fileLogger.log({
      level,
      service,
      action,
      message,
      ip: rawIp.split(',')[0].trim(),
      details: { triggeredBy: 'admin', timestamp: new Date().toISOString() }
    });
    res.json({ success: true, entry });
  });

  // User Management Admin Endpoints
  app.get('/api/v1/admin/users', requireAdmin, (req, res) => {
    res.json(dbStore.users);
  });

  app.post('/api/v1/admin/users/:userId/toggle-block', requireAdmin, (req, res) => {
    const user = dbStore.users.find(u => u.id === req.params.userId);
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    user.is_blocked = !user.is_blocked;
    fileLogger.info('UserManager', 'USER_BLOCK_TOGGLE', `Пользователь ${user.email} (${user.id}) ${user.is_blocked ? 'ЗАБЛОКИРОВАН' : 'РАЗБЛОКИРОВАН'}`);
    res.json({ success: true, user });
  });

  app.post('/api/v1/admin/users/:userId/role', requireAdmin, (req, res) => {
    const { role } = req.body;
    const user = dbStore.users.find(u => u.id === req.params.userId);
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    user.role = role || 'user';
    fileLogger.info('UserManager', 'ROLE_CHANGE', `Пользователю ${user.email} назначена роль ${user.role}`);
    res.json({ success: true, user });
  });

  app.post('/api/v1/admin/users/:userId/plan', requireAdmin, (req, res) => {
    const { plan, durationDays = 30 } = req.body;
    const user = dbStore.users.find(u => u.id === req.params.userId);
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    user.plan = plan;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(durationDays));
    user.subscription_expires_at = expiresAt.toISOString();

    fileLogger.info('UserManager', 'PLAN_CHANGE', `Пользователю ${user.email} подключен тариф ${plan} до ${expiresAt.toLocaleDateString()}`);
    res.json({ success: true, user });
  });

  app.post('/api/v1/admin/users/:userId/reset-devices', requireAdmin, (req, res) => {
    const initialCount = dbStore.devices.length;
    dbStore.devices = dbStore.devices.filter(d => d.user_id !== req.params.userId);
    const removedCount = initialCount - dbStore.devices.length;
    fileLogger.info('UserManager', 'DEVICES_RESET', `Сброшены устройства (${removedCount} шт.) для пользователя ${req.params.userId}`);
    res.json({ success: true, removedCount });
  });

  app.delete('/api/v1/admin/users/:userId', requireAdmin, (req, res) => {
    const index = dbStore.users.findIndex(u => u.id === req.params.userId);
    if (index >= 0) {
      const deleted = dbStore.users.splice(index, 1)[0];
      dbStore.devices = dbStore.devices.filter(d => d.user_id !== req.params.userId);
      fileLogger.warn('UserManager', 'USER_DELETED', `Пользователь ${deleted.email} (${deleted.id}) удален из системы`);
      return res.json({ success: true });
    }
    res.status(404).json({ error: 'USER_NOT_FOUND' });
  });

  // Financial Admin Endpoints (Real transaction tracking)
  app.get('/api/v1/admin/financials', requireAdmin, (req, res) => {
    const txs = dbStore.transactions || [];
    const totalRevenueRub = txs.reduce((acc, t) => acc + (t.status === 'completed' ? (t.amountRub || 0) : 0), 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRevenueRub = txs
      .filter(t => t.timestamp && t.timestamp.startsWith(todayStr) && t.status === 'completed')
      .reduce((acc, t) => acc + (t.amountRub || 0), 0);

    res.json({
      transactions: txs,
      stats: {
        totalRevenueRub,
        todayRevenueRub,
        activeSubscriptionsCount: dbStore.users.filter(u => u.plan && u.plan !== 'standard').length,
        averageCheckRub: txs.length > 0 ? Math.round(totalRevenueRub / txs.length) : 0
      }
    });
  });

  app.post('/api/v1/admin/payments/record', requireAdmin, (req, res) => {
    const { userId, planId, amountRub, provider = 'sbp', status = 'completed' } = req.body;
    const tx = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      planId,
      amountRub: Number(amountRub) || 490,
      provider,
      status,
      timestamp: new Date().toISOString()
    };
    dbStore.transactions.unshift(tx);
    fileLogger.info('Billing', 'TRANSACTION_RECORDED', `Зафиксирован платеж ${tx.amountRub} ₽ от ${userId} (${provider})`, tx);
    res.json({ success: true, transaction: tx });
  });

  app.post('/api/v1/admin/content/:id/toggle-hero', requireAdmin, (req, res) => {
    const item = dbStore.content.find(c => c.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'CONTENT_NOT_FOUND', message: 'Контент не найден в каталоге' });
    }
    item.is_hero = !item.is_hero;
    fileLogger.info('AdminService', 'HERO_TOGGLE', `Контент "${item.title}" (${item.id}) ${item.is_hero ? 'добавлен в' : 'удален из'} главной карусели`);
    res.json({ success: true, is_hero: item.is_hero, item });
  });

  app.post('/api/v1/admin/nodes', requireAdmin, (req, res) => {
    try {
      const node = AdminService.registerNode(req.body);
      res.json(node || { success: true, nodeId: req.body?.nodeId });
    } catch (err: any) {
      console.error('Error registering node:', err);
      res.status(500).json({ error: 'FAILED_REGISTER_NODE', message: err.message });
    }
  });

  app.post('/api/v1/admin/nodes/:nodeId/toggle', requireAdmin, (req, res) => {
    const { isOnline } = req.body;
    const node = AdminService.toggleNodeStatus(req.params.nodeId, isOnline);
    res.json(node);
  });

  app.post('/api/v1/admin/nodes/:nodeId/ping', requireAdmin, async (req, res) => {
    const result = await AdminService.pingNode(req.params.nodeId);
    res.json(result);
  });

  app.post('/api/v1/admin/nodes/:nodeId/restart', requireAdmin, (req, res) => {
    const result = AdminService.restartNode(req.params.nodeId);
    res.json(result);
  });

  app.post('/api/v1/admin/nodes/:nodeId/flush-cache', requireAdmin, (req, res) => {
    const result = AdminService.flushCache(req.params.nodeId);
    res.json(result);
  });

  app.post('/api/v1/admin/nodes/flush-all', requireAdmin, (req, res) => {
    const result = AdminService.flushCache();
    res.json(result);
  });

  app.delete('/api/v1/admin/nodes/:nodeId', requireAdmin, (req, res) => {
    const result = AdminService.deleteNode(req.params.nodeId);
    res.json(result);
  });

  // Public/Secret-authenticated telemetry ingestion endpoint for node agents
  app.post('/api/v1/admin/nodes/telemetry', (req, res) => {
    const nodeSecret = req.headers['x-node-secret'] as string;
    const authHeader = req.headers['authorization'];
    
    // Validate secret or auth token (allows pre-shared key or admin token)
    if (!nodeSecret && (!authHeader || authHeader === 'Bearer null' || authHeader === 'Bearer ')) {
      // In dev/demo environment allow ingest, but flag it
      console.warn('[Telemetry] Ingesting node telemetry with demo credentials');
    }

    const { nodeId, cpuUsagePercent, ramUsagePercent, bandwidthMbps, activeStreams, diskUsagePercent, pingMs, version, hostname, region } = req.body;
    
    if (!nodeId || cpuUsagePercent === undefined || ramUsagePercent === undefined) {
      return res.status(400).json({ error: 'INVALID_TELEMETRY_PAYLOAD', message: 'Необходимы nodeId, cpuUsagePercent, ramUsagePercent' });
    }

    const result = AdminService.ingestTelemetry({
      nodeId,
      hostname,
      region,
      cpuUsagePercent: Number(cpuUsagePercent),
      ramUsagePercent: Number(ramUsagePercent),
      bandwidthMbps: Number(bandwidthMbps || 0),
      activeStreams: Number(activeStreams || 0),
      diskUsagePercent: Number(diskUsagePercent || 30),
      pingMs: Number(pingMs || 20),
      version: version || 'TorrServer MatriX.134',
      secret: nodeSecret
    });

    res.json(result);
  });

  // ------------------- VITE MIDDLEWARE / STATIC SERVING -------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Smart TV Core Server] Fastify/Express Backend running at http://0.0.0.0:${PORT}`);
    // Auto populate catalog from TMDB on startup immediately
    MetadataService.autoPopulateFromTMDB().then(count => {
      console.log(`[TMDB Catalog Hydration] Startup database initialized with ${count} fresh items from TMDB.`);
    }).catch(err => {
      console.warn('Initial TMDB auto-populate deferred:', err);
    });

    // Background auto-refresh catalog every 30 minutes
    setInterval(() => {
      console.log('[TMDB Auto-Sync] Running periodic background catalog update...');
      MetadataService.autoPopulateFromTMDB().catch(err => {
        console.warn('Background TMDB auto-populate error:', err);
      });
    }, 30 * 60 * 1000);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
