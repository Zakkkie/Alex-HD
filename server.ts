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
import { AIService } from './backend/src/modules/ai/aiService.js';
import { dbStore } from './backend/src/db/store.js';
import { config } from './backend/src/config/env.js';
import { fileLogger } from './backend/src/logger/fileLogger.js';

async function startServer() {
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
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Требуется авторизация администратора.'
      });
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      if (decoded.role !== 'admin') {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Доступ ограничен. Требуются права администратора.'
        });
      }
      req.userId = decoded.userId;
      req.role = decoded.role;
      req.deviceId = decoded.deviceId;
      next();
    } catch (err) {
      return res.status(401).json({
        error: 'INVALID_TOKEN',
        message: 'Сессия администратора недействительна.'
      });
    }
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
    return req.userId || 'usr-demo-01';
  };

  // ------------------- AUTH API -------------------
  app.post('/api/v1/auth/login', authRateLimiter, (req, res) => {
    const { email, password, deviceName, platform } = req.body;
    const deviceId = getDeviceId(req);
    const result = AuthService.login(email || 'demo@smarttv.com', password || '123456', deviceId, deviceName, platform);
    res.status(result.status).json(result.body);
  });

  app.post('/api/v1/auth/register', authRateLimiter, (req, res) => {
    const { email, password, username, deviceName, platform } = req.body;
    const deviceId = getDeviceId(req);
    const result = AuthService.register(email || 'new@smarttv.com', password || '123456', username, deviceId, deviceName, platform);
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

  // ------------------- CATALOG API -------------------
  app.get('/api/v1/catalog/home', async (req, res) => {
    const userId = getUserId(req);
    if (dbStore.content.length < 10) {
      await MetadataService.autoPopulateFromTMDB().catch(() => {});
    }
    const payload = CatalogService.getHomePayload(userId);
    res.json(payload);
  });

  app.get('/api/v1/catalog/search', searchRateLimiter, (req, res) => {
    const q = (req.query.q as string) || '';
    const results = CatalogService.search(q);
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

  app.get('/api/v1/catalog/content/:id', (req, res) => {
    const userId = getUserId(req);
    const detail = CatalogService.getContentDetail(req.params.id, userId);
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

  app.post('/api/v1/metadata/auto-populate', requireAdmin, async (req, res) => {
    try {
      const count = await MetadataService.autoPopulateFromTMDB();
      res.json({ success: true, added: count });
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

      const { contentId, quality = '1080p', targetNodeId } = req.body;
      const contentItem = dbStore.content.find(c => c.id === contentId);

      if (!contentItem) {
        return res.status(404).json({ error: 'CONTENT_NOT_FOUND' });
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

      const selectedSource = sources.find(s => s.qualityLabel === quality) || sources[0];

      // Step 2: Route to least-loaded edge node using Least-Loaded Routing Formula
      const session = await streamingProvider.createSession(selectedSource, userId, targetNodeId);

      res.json(session);
    } catch (err: any) {
      console.error('[Playback] Error:', err);
      res.status(500).json({ error: 'PLAYBACK_INIT_FAILED', message: err.message });
    }
  });

  // ------------------- EDGE STREAMING SIMULATOR ROUTE -------------------
  // Serves a sample mp4 / test video stream chunk for live playback testing inside the player
  app.get('/stream/play/:sessionId', (req, res) => {
    // Open Big Buck Bunny / Sintel / Tears of Steel sample open-source stream
    const sampleVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    res.redirect(302, sampleVideoUrl);
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

  app.post('/api/v1/admin/nodes', requireAdmin, (req, res) => {
    const node = AdminService.registerNode(req.body);
    res.json(node);
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
    // Auto populate catalog from TMDB on startup
    MetadataService.autoPopulateFromTMDB().catch(err => {
      console.warn('Initial TMDB auto-populate deferred:', err);
    });
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
