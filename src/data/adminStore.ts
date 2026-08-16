import {
  SubscriptionPlan,
  SubscriptionPlanId,
  User,
  ServerNode,
  SystemLogEntry,
  PaymentTransaction,
  FinancialStats
} from '../types';

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  standard: {
    id: 'standard',
    name: 'Стандарт',
    priceRub: 0,
    period: 'Бесплатно навсегда',
    maxResolution: '720p',
    maxResolutionLabel: '720p HD',
    maxDevices: 1,
    color: '#9e9e9e',
    features: [
      'Базовый доступ к библиотеке кино и сериалов',
      'Качество видео до 720p HD',
      '1 подключенное устройство',
      'Стандартный стереозвук 2.0',
      'Базовый CDN-маршрут'
    ]
  },
  hd: {
    id: 'hd',
    name: 'Доступ HD',
    priceRub: 179,
    period: '179 ₽ / месяц',
    maxResolution: '1080p',
    maxResolutionLabel: '1080p Full HD',
    maxDevices: 3,
    color: '#38bdf8',
    isPopular: true,
    badge: 'ПОПУЛЯРНЫЙ ВЫБОР',
    features: [
      'Полный каталог фильмов, сериалов и аниме',
      'Качество видео 1080p Full HD (60 FPS)',
      'До 3 одновременно подключенных устройств',
      'Многоканальный звук Dolby Digital 5.1',
      'Приоритетный TorrServer кэш (128 МБ)',
      'Отсутствие рекламных вставок'
    ]
  },
  '4k': {
    id: '4k',
    name: 'Доступ 4K Ultra VIP',
    priceRub: 349,
    period: '349 ₽ / месяц',
    maxResolution: '4k',
    maxResolutionLabel: '4K Ultra HD & HDR',
    maxDevices: 5,
    color: '#d4b581',
    badge: 'МАКСИМАЛЬНЫЙ ДОСТУП',
    features: [
      'Максимальное качество 4K Ultra HD, HDR10+, Dolby Vision',
      'До 5 одновременно подключенных устройств',
      'Премиальный объемный звук Dolby Atmos 7.1',
      'Персональный выделенный CDN Edge-узел',
      'Безлимитный битрейт торрент-стриминга (1 Gbps)',
      'Ранний доступ к эксклюзивным релизам и озвучкам',
      'VIP-поддержка 24/7'
    ]
  }
};

class AdminStoreService {
  private users: User[] = [];
  private nodes: ServerNode[] = [];
  private logs: SystemLogEntry[] = [];
  private transactions: PaymentTransaction[] = [];
  private isInitialized = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedUsers = localStorage.getItem('alexhd_admin_users');
      const savedNodes = localStorage.getItem('alexhd_admin_nodes');
      const savedLogs = localStorage.getItem('alexhd_admin_logs');
      const savedTx = localStorage.getItem('alexhd_admin_transactions');

      if (savedUsers) this.users = JSON.parse(savedUsers);
      if (savedNodes) this.nodes = JSON.parse(savedNodes);
      if (savedLogs) this.logs = JSON.parse(savedLogs);
      if (savedTx) this.transactions = JSON.parse(savedTx);
      this.isInitialized = true;
    } catch {
      this.users = [];
      this.nodes = [];
      this.logs = [];
      this.transactions = [];
    }
  }

  public setBackendData(data: {
    users?: User[];
    nodes?: any[];
    logs?: SystemLogEntry[];
    transactions?: PaymentTransaction[];
  }) {
    if (data.users) {
      this.users = data.users.map(u => ({
        ...u,
        displayName: u.displayName || u.username || u.email,
        connected_devices_count: u.devices?.length || 0,
        plan: u.plan || 'standard'
      }));
    }
    if (data.nodes) {
      this.nodes = data.nodes.map(n => ({
        id: n.nodeId || n.id,
        name: n.name || `Node ${n.nodeId || n.id} (${n.region || 'Edge'})`,
        type: (n.type || 'torrserver') as any,
        ip: n.hostname || n.ip || '127.0.0.1:8090',
        location: n.region || 'Локальный / Edge',
        countryCode: 'RU',
        status: (n.isOnline || n.status === 'online') ? 'online' : 'offline',
        cpuUsage: n.cpuUsagePercent ?? n.cpuUsage ?? 0,
        ramUsage: n.ramUsagePercent ?? n.ramUsage ?? 0,
        diskUsage: n.diskUsagePercent ?? n.diskUsage ?? 0,
        bandwidthGbps: Math.round(((n.bandwidthMbps || 0) / 1000) * 10) / 10,
        activeStreams: n.activeStreams || 0,
        pingMs: n.pingMs ?? (n.isOnline ? 12 : -1),
        uptimeHours: n.uptimeHours || 1,
        errorCount24h: 0,
        version: n.version || 'TorrServer MatriX.134',
        lastHealthCheck: n.isOnline ? 'Только что' : 'Оффлайн'
      }));
    }
    if (data.logs) {
      this.logs = data.logs;
    }
    if (data.transactions) {
      this.transactions = data.transactions;
    }
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      localStorage.setItem('alexhd_admin_users', JSON.stringify(this.users));
      localStorage.setItem('alexhd_admin_nodes', JSON.stringify(this.nodes));
      localStorage.setItem('alexhd_admin_logs', JSON.stringify(this.logs));
      localStorage.setItem('alexhd_admin_transactions', JSON.stringify(this.transactions));
    } catch {}
  }

  // --- Users API ---
  getUsers(): User[] {
    return [...this.users];
  }

  getUser(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  setUsers(users: User[]) {
    this.users = users;
    this.saveToStorage();
  }

  deleteUser(id: string): boolean {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.users.splice(idx, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  toggleBlockUser(id: string): User | null {
    const user = this.users.find(u => u.id === id);
    if (user) {
      user.is_blocked = !user.is_blocked;
      this.saveToStorage();
      return { ...user };
    }
    return null;
  }

  updateUserRole(id: string, newRole: 'user' | 'admin' | 'moderator'): User | null {
    const user = this.users.find(u => u.id === id);
    if (user) {
      user.role = newRole;
      this.saveToStorage();
      return { ...user };
    }
    return null;
  }

  updateUserPlan(id: string, newPlan: SubscriptionPlanId, daysToAdd: number = 30): User | null {
    const user = this.users.find(u => u.id === id);
    if (user) {
      user.plan = newPlan;
      if (newPlan === 'standard') {
        user.subscription_expires_at = null;
      } else {
        const currentExp = user.subscription_expires_at ? new Date(user.subscription_expires_at).getTime() : Date.now();
        const baseTime = Math.max(Date.now(), currentExp);
        user.subscription_expires_at = new Date(baseTime + daysToAdd * 86400000).toISOString();
      }
      this.saveToStorage();
      return { ...user };
    }
    return null;
  }

  resetUserDevices(id: string): User | null {
    const user = this.users.find(u => u.id === id);
    if (user) {
      user.devices = [];
      user.connected_devices_count = 0;
      this.saveToStorage();
      return { ...user };
    }
    return null;
  }

  // --- Nodes & Monitoring API ---
  getNodes(): ServerNode[] {
    return [...this.nodes];
  }

  setNodes(nodes: ServerNode[]) {
    this.nodes = nodes;
    this.saveToStorage();
  }

  addNode(node: Partial<ServerNode>): ServerNode {
    const id = node.id || `node-${Date.now()}`;
    const newNode: ServerNode = {
      id,
      name: node.name || `Узел ${id}`,
      type: node.type || 'torrserver',
      ip: node.ip || '127.0.0.1:8090',
      location: node.location || 'Локальный / Edge',
      countryCode: node.countryCode || 'RU',
      status: (node.status as any) || 'offline',
      cpuUsage: node.cpuUsage || 0,
      ramUsage: node.ramUsage || 0,
      diskUsage: node.diskUsage || 0,
      bandwidthGbps: node.bandwidthGbps || 0,
      activeStreams: node.activeStreams || 0,
      pingMs: node.pingMs || -1,
      uptimeHours: 1,
      errorCount24h: 0,
      version: node.version || 'TorrServer MatriX.134',
      lastHealthCheck: node.status === 'online' ? 'Только что' : 'Оффлайн'
    };

    const existingIdx = this.nodes.findIndex(n => n.id === id || n.ip === newNode.ip);
    if (existingIdx >= 0) {
      this.nodes[existingIdx] = { ...this.nodes[existingIdx], ...newNode };
    } else {
      this.nodes.push(newNode);
    }
    this.saveToStorage();
    return newNode;
  }

  deleteNode(nodeId: string): boolean {
    const idx = this.nodes.findIndex(n => n.id === nodeId);
    if (idx !== -1) {
      this.nodes.splice(idx, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  pingNode(nodeId: string, measuredPing?: number): number {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      const ping = measuredPing !== undefined ? measuredPing : (node.status === 'online' ? 12 : -1);
      node.pingMs = ping;
      node.status = ping > 0 ? 'online' : 'offline';
      node.lastHealthCheck = ping > 0 ? 'Только что' : 'Оффлайн';
      this.saveToStorage();
      return ping;
    }
    return -1;
  }

  toggleNodeStatus(nodeId: string): ServerNode | null {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      node.status = node.status === 'online' ? 'offline' : 'online';
      node.lastHealthCheck = node.status === 'online' ? 'Только что' : 'Оффлайн';
      this.saveToStorage();
      return { ...node };
    }
    return null;
  }

  restartNode(nodeId: string): ServerNode | null {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      node.activeStreams = 0;
      node.bandwidthGbps = 0;
      this.saveToStorage();
      return { ...node };
    }
    return null;
  }

  ingestTelemetry(telemetry: {
    id: string;
    cpuUsage?: number;
    ramUsage?: number;
    diskUsage?: number;
    bandwidthGbps?: number;
    activeStreams?: number;
    pingMs?: number;
    version?: string;
  }) {
    const node = this.nodes.find(n => n.id === telemetry.id);
    if (node) {
      if (telemetry.cpuUsage !== undefined) node.cpuUsage = telemetry.cpuUsage;
      if (telemetry.ramUsage !== undefined) node.ramUsage = telemetry.ramUsage;
      if (telemetry.diskUsage !== undefined) node.diskUsage = telemetry.diskUsage;
      if (telemetry.bandwidthGbps !== undefined) node.bandwidthGbps = telemetry.bandwidthGbps;
      if (telemetry.activeStreams !== undefined) node.activeStreams = telemetry.activeStreams;
      if (telemetry.pingMs !== undefined) node.pingMs = telemetry.pingMs;
      if (telemetry.version) node.version = telemetry.version;
      node.status = 'online';
      node.lastHealthCheck = 'Только что';
      this.saveToStorage();
    }
  }

  // --- Logs API ---
  getLogs(): SystemLogEntry[] {
    return [...this.logs];
  }

  setLogs(logs: SystemLogEntry[]) {
    this.logs = logs;
    this.saveToStorage();
  }

  addLog(level: 'info' | 'warn' | 'error' | 'critical', service: string, nodeId: string, message: string, details?: string) {
    const now = new Date();
    const formatted = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;
    const newLog: SystemLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: formatted,
      level,
      service,
      nodeId,
      message,
      details
    };
    this.logs.unshift(newLog);
    if (this.logs.length > 500) this.logs.pop();
    this.saveToStorage();
  }

  // --- Transactions & Financials API ---
  getTransactions(): PaymentTransaction[] {
    return [...this.transactions];
  }

  setTransactions(txs: PaymentTransaction[]) {
    this.transactions = txs;
    this.saveToStorage();
  }

  recordPayment(userId: string, planId: SubscriptionPlanId, method: 'sbp' | 'mir' | 'card' | 'crypto' | 'tpay', months: number = 1): PaymentTransaction {
    const user = this.getUser(userId);
    const plan = SUBSCRIPTION_PLANS[planId];
    const amount = plan.priceRub * months;

    const methodLabels: Record<string, string> = {
      sbp: 'СБП (QR-код)',
      mir: 'Карта МИР',
      card: 'Банковская карта',
      crypto: 'Криптовалюта (USDT)',
      tpay: 'T-Pay'
    };

    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const tx: PaymentTransaction = {
      id: `tx-${Date.now()}`,
      userId,
      userEmail: user?.email || 'user@smarttv.com',
      userName: user?.displayName || user?.username || 'Пользователь Alex HD',
      planId,
      planName: plan.name,
      amountRub: amount,
      method,
      methodLabel: methodLabels[method] || method,
      status: 'completed',
      timestamp: dateStr,
      paymentGatewayRef: `PAY-${method.toUpperCase()}-${Math.floor(100000000 + Math.random() * 900000000)}`,
      periodMonths: months
    };

    this.transactions.unshift(tx);

    if (user) {
      this.updateUserPlan(userId, planId, months * 30);
    }

    this.saveToStorage();
    return tx;
  }

  getFinancialStats(): FinancialStats {
    const totalRev = this.transactions.reduce((acc, t) => acc + (t.status === 'completed' ? (t.amountRub || 0) : 0), 0);
    const today = new Date().toLocaleDateString('ru-RU');
    
    const todayRev = this.transactions
      .filter(t => t.timestamp && t.timestamp.startsWith(today.slice(0, 5)) && t.status === 'completed')
      .reduce((acc, t) => acc + (t.amountRub || 0), 0);

    const payingUsers = this.users.filter(u => u.plan && u.plan !== 'standard').length;
    const totalUsers = this.users.length;
    const avgCheck = this.transactions.length ? Math.round(totalRev / this.transactions.length) : 0;

    // Group actual transactions by plan
    const countStandard = this.users.filter(u => !u.plan || u.plan === 'standard').length;
    const countHD = this.users.filter(u => u.plan === 'hd').length;
    const count4K = this.users.filter(u => u.plan === '4k').length;

    const revenueByPlan = [
      { planId: 'standard' as SubscriptionPlanId, planName: 'Стандарт (0 ₽)', count: countStandard, totalRub: 0 },
      { planId: 'hd' as SubscriptionPlanId, planName: 'Доступ HD (179 ₽)', count: countHD, totalRub: countHD * 179 },
      { planId: '4k' as SubscriptionPlanId, planName: 'Доступ 4K Ultra (349 ₽)', count: count4K, totalRub: count4K * 349 }
    ];

    // Group actual payment methods from transactions
    const methodCounts: Record<string, { count: number; totalRub: number; label: string }> = {
      sbp: { count: 0, totalRub: 0, label: 'СБП (QR)' },
      mir: { count: 0, totalRub: 0, label: 'Карты МИР' },
      tpay: { count: 0, totalRub: 0, label: 'T-Pay' },
      crypto: { count: 0, totalRub: 0, label: 'USDT / Crypto' },
      card: { count: 0, totalRub: 0, label: 'Банковская карта' }
    };

    this.transactions.forEach(t => {
      if (t.status === 'completed' && t.method && methodCounts[t.method]) {
        methodCounts[t.method].count += 1;
        methodCounts[t.method].totalRub += t.amountRub || 0;
      }
    });

    const paymentMethodDistribution = Object.entries(methodCounts).map(([method, data]) => ({
      method,
      label: data.label,
      count: data.count,
      totalRub: data.totalRub
    }));

    return {
      totalRevenueRub: totalRev,
      monthRevenueRub: totalRev,
      todayRevenueRub: todayRev,
      averageCheckRub: avgCheck,
      payingUsersCount: payingUsers,
      totalUsersCount: totalUsers,
      conversionRate: totalUsers > 0 ? Math.round((payingUsers / totalUsers) * 100) : 0,
      revenueByDay: [],
      revenueByPlan,
      paymentMethodDistribution
    };
  }
}

export const adminStore = new AdminStoreService();

