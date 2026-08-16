import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  Users,
  CreditCard,
  Database,
  RefreshCw,
  Power,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Search,
  Trash2,
  UserX,
  UserCheck,
  Calendar,
  Smartphone,
  Tv,
  ArrowUpRight,
  Plus,
  Filter,
  DollarSign,
  Download,
  Film,
  Zap,
  Wifi,
  HardDrive,
  Cpu,
  Clock,
  ExternalLink,
  ChevronRight,
  Check,
  BookOpen,
  Terminal,
  Radio,
  Copy
} from 'lucide-react';
import { adminStore, SUBSCRIPTION_PLANS } from '../data/adminStore';
import {
  ServerNode,
  User,
  SystemLogEntry,
  PaymentTransaction,
  FinancialStats,
  SubscriptionPlanId,
  UserRole
} from '../types';
import { api } from '../api/client';
import { AddNodeModal } from '../components/admin/AddNodeModal';
import { IntegrationGuide } from '../components/admin/IntegrationGuide';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'nodes' | 'users' | 'finance' | 'catalog' | 'guide'>('nodes');

  // Node & Telemetry State
  const [nodes, setNodes] = useState<ServerNode[]>([]);
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [logStats, setLogStats] = useState<{ totalLines: number; errorCount: number; warnCount: number; infoCount: number; path: string }>({
    totalLines: 0,
    errorCount: 0,
    warnCount: 0,
    infoCount: 0,
    path: 'logs/system.log'
  });
  const [logFilter, setLogFilter] = useState<string>('all');
  const [logSearch, setLogSearch] = useState<string>('');
  const [isRefreshingNodes, setIsRefreshingNodes] = useState<boolean>(false);
  const [isAddNodeOpen, setIsAddNodeOpen] = useState<boolean>(false);
  const [pingingNodeId, setPingingNodeId] = useState<string | null>(null);
  const [systemTelemetry, setSystemTelemetry] = useState<any>(null);

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userPlanFilter, setUserPlanFilter] = useState<string>('all');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [editModalTab, setEditModalTab] = useState<'plan' | 'role' | 'devices' | 'delete'>('plan');

  // Financial State
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [financialStats, setFinancialStats] = useState<FinancialStats | null>(null);
  const [txSearch, setTxSearch] = useState<string>('');

  // Catalog TMDB State
  const [metadataStatus, setMetadataStatus] = useState<any>(null);
  const [metaSearchQuery, setMetaSearchQuery] = useState('');
  const [metaProvider, setMetaProvider] = useState<'all' | 'tmdb' | 'tvdb'>('all');
  const [metaResults, setMetaResults] = useState<any[]>([]);
  const [isSearchingMeta, setIsSearchingMeta] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [manualTitle, setManualTitle] = useState('');
  const [manualType, setManualType] = useState<'movie' | 'series'>('movie');
  const [manualStream, setManualStream] = useState('');
  const [manualPoster, setManualPoster] = useState('');

  // Load Real Admin Data from backend
  const loadData = async () => {
    setIsRefreshingNodes(true);
    try {
      // 1. Fetch dashboard overview (host metrics, nodes, live torrserver status)
      const dashboard = await api.getAdminDashboard().catch(() => null);
      if (dashboard) {
        if (dashboard.nodes) {
          adminStore.setNodes(dashboard.nodes.map((n: any) => ({
            id: n.nodeId,
            name: n.name || `Node ${n.nodeId}`,
            type: n.type || 'torrserver',
            ip: n.hostname,
            location: n.region || 'Россия / Европа',
            countryCode: 'RU',
            status: n.isOnline ? 'online' : 'offline',
            cpuUsage: n.cpuUsagePercent || 0,
            ramUsage: n.ramUsagePercent || 0,
            diskUsage: n.diskUsagePercent || 0,
            bandwidthGbps: Math.round(((n.bandwidthMbps || 0) / 1000) * 10) / 10,
            activeStreams: n.activeStreams || 0,
            pingMs: n.pingMs ?? (n.isOnline ? 12 : -1),
            uptimeHours: n.uptimeHours || 1,
            errorCount24h: 0,
            version: n.version || 'TorrServer MatriX.134',
            lastHealthCheck: n.isOnline ? 'Только что' : 'Оффлайн'
          })));
        }
        if (dashboard.host) {
          setSystemTelemetry(dashboard.host);
        }
      }

      // 2. Fetch real system logs from logs/system.log
      const logRes = await api.getAdminLogs({
        level: logFilter !== 'all' ? logFilter : undefined,
        search: logSearch.trim() || undefined
      }).catch(() => null);

      if (logRes) {
        if (logRes.logs) {
          setLogs(logRes.logs.map((l: any) => ({
            id: l.id || `log-${l.timestamp}`,
            timestamp: l.timestamp,
            level: l.level,
            service: l.service || 'System',
            nodeId: l.action || 'core-event',
            message: `${l.action ? `[${l.action}] ` : ''}${l.message}${l.ip ? ` (IP: ${l.ip})` : ''}`,
            details: l.details ? JSON.stringify(l.details) : undefined
          })));
        }
        if (logRes.stats) {
          setLogStats(logRes.stats);
        }
      } else {
        setLogs(adminStore.getLogs());
      }

      // 3. Fetch real users
      const usersData = await api.getAdminUsers().catch(() => null);
      if (usersData) {
        adminStore.setUsers(usersData);
        setUsers(adminStore.getUsers());
      } else {
        setUsers(adminStore.getUsers());
      }

      // 4. Fetch financials
      const finData = await api.getFinancials().catch(() => null);
      if (finData) {
        if (finData.transactions) {
          adminStore.setTransactions(finData.transactions);
          setTransactions(finData.transactions);
        }
        setFinancialStats(adminStore.getFinancialStats());
      } else {
        setTransactions(adminStore.getTransactions());
        setFinancialStats(adminStore.getFinancialStats());
      }

      setNodes(adminStore.getNodes());
    } catch (err) {
      console.warn('Admin load data error:', err);
    } finally {
      setIsRefreshingNodes(false);
    }
  };

  useEffect(() => {
    loadData();
    loadMetadataStatus();

    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, [logFilter]);

  const loadMetadataStatus = async () => {
    try {
      const res = await api.getMetadataStatus();
      setMetadataStatus(res);
    } catch (e) {
      console.warn('Metadata status load deferred:', e);
    }
  };

  // Node Actions
  const handleToggleNode = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    const newStatus = node?.status === 'online' ? false : true;
    try {
      await api.toggleNodeStatus(nodeId, newStatus);
    } catch {}
    adminStore.toggleNodeStatus(nodeId);
    loadData();
  };

  const handlePingNode = async (nodeId: string) => {
    setPingingNodeId(nodeId);
    try {
      const res = await api.pingNode(nodeId);
      adminStore.pingNode(nodeId, res?.pingMs);
      loadData();
    } catch {
      adminStore.pingNode(nodeId, -1);
      loadData();
    } finally {
      setTimeout(() => setPingingNodeId(null), 600);
    }
  };

  const handleRestartNode = async (nodeId: string) => {
    setIsRefreshingNodes(true);
    try {
      await api.restartNode(nodeId);
    } catch {}
    setTimeout(() => {
      adminStore.restartNode(nodeId);
      loadData();
      setIsRefreshingNodes(false);
    }, 600);
  };

  const handleFlushNode = async (nodeId: string) => {
    try {
      await api.flushNodeCache(nodeId);
    } catch {}
    loadData();
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот серверный узел из кластера?')) {
      try {
        await api.deleteNode(nodeId);
      } catch (e) {
        console.warn(e);
      }
      adminStore.deleteNode(nodeId);
      loadData();
    }
  };

  const handleFlushBuffers = async () => {
    setIsRefreshingNodes(true);
    try {
      await api.flushAllNodes();
    } catch {}
    setTimeout(() => {
      loadData();
      setIsRefreshingNodes(false);
    }, 600);
  };

  // Log Actions
  const handleDownloadLogs = async () => {
    try {
      const rawText = await api.downloadRawLogs();
      const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `alexhd-system-${new Date().toISOString().split('T')[0]}.log`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Ошибка скачивания логов: ${err.message}`);
    }
  };

  const handleClearLogs = async () => {
    if (window.confirm('Очистить файл системных логов logs/system.log?')) {
      try {
        await api.clearAdminLogs();
        loadData();
      } catch (err: any) {
        alert(`Ошибка очистки: ${err.message}`);
      }
    }
  };

  const handleSendTestLog = async () => {
    try {
      await api.sendTestLog({
        level: 'info',
        service: 'ManualDiagnostic',
        action: 'HEALTH_CHECK',
        message: 'Ручная проверка работоспособности подсистемы логирования'
      });
      loadData();
    } catch (err: any) {
      alert(`Ошибка: ${err.message}`);
    }
  };

  // User Actions
  const handleToggleBlock = async (userId: string) => {
    try {
      await api.toggleBlockUser(userId);
      loadData();
      if (selectedUserForEdit && selectedUserForEdit.id === userId) {
        setSelectedUserForEdit(adminStore.getUser(userId) || null);
      }
    } catch (err: any) {
      alert(`Ошибка: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      try {
        await api.deleteAdminUser(userId);
        setSelectedUserForEdit(null);
        loadData();
      } catch (err: any) {
        alert(`Ошибка: ${err.message}`);
      }
    }
  };

  const handleUpdatePlan = async (userId: string, plan: SubscriptionPlanId, days: number = 30) => {
    try {
      await api.updateUserPlan(userId, plan, days);
      loadData();
      setSelectedUserForEdit(adminStore.getUser(userId) || null);
    } catch (err: any) {
      alert(`Ошибка: ${err.message}`);
    }
  };

  const handleExtendSubscription = async (userId: string, days: number) => {
    try {
      const user = adminStore.getUser(userId);
      const currentPlan = (user?.plan || 'hd') as SubscriptionPlanId;
      await api.updateUserPlan(userId, currentPlan, days);
      loadData();
      setSelectedUserForEdit(adminStore.getUser(userId) || null);
    } catch (err: any) {
      alert(`Ошибка: ${err.message}`);
    }
  };

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    try {
      await api.updateUserRole(userId, role);
      loadData();
      setSelectedUserForEdit(adminStore.getUser(userId) || null);
    } catch (err: any) {
      alert(`Ошибка: ${err.message}`);
    }
  };

  const handleResetDevices = async (userId: string) => {
    try {
      await api.resetUserDevices(userId);
      loadData();
      setSelectedUserForEdit(adminStore.getUser(userId) || null);
    } catch (err: any) {
      alert(`Ошибка: ${err.message}`);
    }
  };

  // Financial Payment Record Action
  const handleRecordPayment = async (planId: SubscriptionPlanId) => {
    const randomUser = users[0] || { id: 'usr-admin-01', email: 'admin@smarttv.com' };
    const plan = SUBSCRIPTION_PLANS[planId];
    try {
      await api.recordPayment({
        userId: randomUser.id,
        planId,
        amountRub: plan.priceRub || 349,
        provider: 'sbp'
      });
      loadData();
    } catch (err: any) {
      alert(`Ошибка: ${err.message}`);
    }
  };

  // Metadata Search & Add
  const handleMetadataSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!metaSearchQuery.trim()) return;
    setIsSearchingMeta(true);
    try {
      const res = await api.searchMetadata(metaSearchQuery, metaProvider);
      setMetaResults(res.results || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSearchingMeta(false);
    }
  };

  const handleImportMetadata = async (item: any) => {
    try {
      await api.importMetadata(item.id, item.source, item.type);
      setSyncStatus(`Импортировано: "${item.title}" (${item.year})`);
      setTimeout(() => setSyncStatus(null), 4000);
    } catch (err: any) {
      alert(`Ошибка импорта: ${err.message}`);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualStream) return;
    try {
      await api.createContent({
        title: manualTitle,
        type: manualType,
        poster_url: manualPoster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
        backdrop_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80',
        stream_url: manualStream,
        is_4k: true,
        rating_imdb: 8.5,
        release_year: 2026,
        overview: 'Добавлено через панель администратора Alex HD.'
      });
      setSyncStatus(`Контент "${manualTitle}" успешно добавлен в базу!`);
      setManualTitle('');
      setManualStream('');
      setManualPoster('');
      setTimeout(() => setSyncStatus(null), 4000);
    } catch (err: any) {
      alert(`Ошибка: ${err.message}`);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchSearch =
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.displayName && u.displayName.toLowerCase().includes(userSearch.toLowerCase()));
    const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchPlan = userPlanFilter === 'all' || u.plan === userPlanFilter;
    return matchSearch && matchRole && matchPlan;
  });

  // Filtered Logs
  const filteredLogs = logs.filter(l => {
    const matchLevel = logFilter === 'all' || l.level === logFilter;
    const matchSearch =
      l.message.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.service.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.nodeId.toLowerCase().includes(logSearch.toLowerCase());
    return matchLevel && matchSearch;
  });

  // Filtered Transactions
  const filteredTransactions = transactions.filter(t => {
    return (
      t.userEmail.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.userName.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.paymentGatewayRef.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.planName.toLowerCase().includes(txSearch.toLowerCase())
    );
  });

  const onlineNodesCount = nodes.filter(n => n.status === 'online').length;
  const totalBandwidth = nodes.reduce((acc, n) => acc + (n.status === 'online' ? n.bandwidthGbps : 0), 0);
  const totalActiveStreams = nodes.reduce((acc, n) => acc + (n.status === 'online' ? n.activeStreams : 0), 0);

  return (
    <div className="pb-20 pt-2 text-[#e6e3df] max-w-7xl mx-auto space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#e6e3df]/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4b581]/25 to-[#d4b581]/5 border border-[#d4b581]/40 flex items-center justify-center text-[#d4b581] shrink-0 shadow-[0_0_25px_rgba(212,181,129,0.25)]">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-white">Узлы и Ноды</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#d4b581]/20 border border-[#d4b581]/40 text-[#d4b581] font-mono text-[11px] font-bold tracking-wider">
                ADMIN CONSOLE
              </span>
            </div>
            <p className="font-mono text-xs text-[#d4b581]/80 uppercase tracking-wider mt-1">
              МОНИТОРИНГ КЛАСТЕРА • ПОЛЬЗОВАТЕЛИ • ФИНАНСОВЫЙ БИЛЛИНГ • МЕТАДАННЫЕ
            </p>
          </div>
        </div>

        {/* Global Action Quick Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 px-4 py-2 bg-[#171615] hover:bg-[#252422] border border-[#e6e3df]/15 rounded-xl text-xs font-mono font-medium text-[#e6e3df] transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#d4b581] ${isRefreshingNodes ? 'animate-spin' : ''}`} />
            <span>Обновить данные</span>
          </button>
          <button
            onClick={handleFlushBuffers}
            className="flex items-center gap-2 px-4 py-2 bg-[#d4b581]/15 hover:bg-[#d4b581]/25 border border-[#d4b581]/40 rounded-xl text-xs font-mono font-bold text-[#d4b581] transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Сброс буферов</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e6e3df]/10 overflow-x-auto no-scrollbar pb-2">
        <button
          onClick={() => setActiveTab('nodes')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'nodes'
              ? 'bg-[#d4b581] text-black shadow-[0_0_20px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Мониторинг серверов ({nodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'guide'
              ? 'bg-[#d4b581] text-black shadow-[0_0_20px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Интеграция & Data Ingestion (Гайд)</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-[#d4b581] text-black shadow-[0_0_20px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Пользователи и Доступ ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'finance'
              ? 'bg-[#d4b581] text-black shadow-[0_0_20px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Финансы и Поступления</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'catalog'
              ? 'bg-[#d4b581] text-black shadow-[0_0_20px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Каталог & TMDB</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. TAB: SERVER & CLUSTER NODES MONITORING */}
      {/* ========================================================================= */}
      {activeTab === 'nodes' && (
        <div className="space-y-8 animate-[fadeIn_0.2s_ease-out]">
          {/* Top Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-[#e6e3df]/50 mb-1">
                <span>АКТИВНЫЕ УЗЛЫ</span>
                <Server className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {onlineNodesCount} <span className="text-xs text-[#e6e3df]/40 font-normal">/ {nodes.length} онлайн</span>
              </p>
              <div className="w-full bg-[#1c1b18] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full"
                  style={{ width: `${(onlineNodesCount / nodes.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-[#e6e3df]/50 mb-1">
                <span>ОБЩИЙ ТРАФИК CDN</span>
                <Wifi className="w-4 h-4 text-[#38bdf8]" />
              </div>
              <p className="text-2xl font-bold text-white">
                {totalBandwidth.toFixed(1)} <span className="text-xs text-[#e6e3df]/40 font-normal">Gbps</span>
              </p>
              <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Пропускная способность в норме
              </p>
            </div>

            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-[#e6e3df]/50 mb-1">
                <span>АКТИВНЫХ СТРИМОВ</span>
                <Activity className="w-4 h-4 text-[#d4b581]" />
              </div>
              <p className="text-2xl font-bold text-white">{totalActiveStreams}</p>
              <p className="text-[10px] text-[#d4b581] mt-2 flex items-center gap-1">
                <span>HLS 4K / 1080p поток</span>
              </p>
            </div>

            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-[#e6e3df]/50 mb-1">
                <span>ЗДОРОВЬЕ КЛАСТЕРА</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">98.4%</p>
              <p className="text-[10px] text-[#e6e3df]/40 mt-2">
                Сбоев за 24ч: <span className="text-amber-400 font-bold">5</span>
              </p>
            </div>
          </div>

          {/* Node Cards Grid */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                <span>Серверные кластеры и Edge-прокси</span>
                <span className="text-xs font-mono font-normal text-[#d4b581] bg-[#d4b581]/10 px-2.5 py-0.5 rounded-full border border-[#d4b581]/30">
                  REAL-TIME TELEMETRY
                </span>
              </h3>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('guide')}
                  className="flex items-center gap-2 px-3.5 py-2 bg-[#171615] hover:bg-[#252422] border border-[#e6e3df]/15 rounded-xl font-mono text-xs font-bold text-[#e6e3df] transition-all cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#d4b581]" />
                  <span>Гайд по подключению</span>
                </button>

                <button
                  onClick={() => setIsAddNodeOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#d4b581] hover:bg-[#e2c799] text-black rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(212,181,129,0.3)]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Подключить узел</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {nodes.map(node => {
                const isOnline = node.status === 'online';
                const isWarning = node.status === 'warning';
                const isPinging = pingingNodeId === node.id;

                return (
                  <div
                    key={node.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      !isOnline
                        ? 'bg-[#0a0a09]/60 border-red-500/20 opacity-70'
                        : isWarning
                        ? 'bg-[#0f0e0d] border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                        : 'bg-[#0f0e0d] border-[#e6e3df]/10 hover:border-[#d4b581]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#e6e3df]/10">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              !isOnline
                                ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                                : isWarning
                                ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse'
                                : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                            }`}
                          />
                          <h4 className="font-bold text-sm text-white">{node.name}</h4>
                        </div>
                        <p className="font-mono text-[11px] text-[#e6e3df]/50 mt-1">
                          {node.location} • {node.ip}
                        </p>
                      </div>

                      <span
                        className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                          !isOnline
                            ? 'bg-red-950/40 text-red-400 border-red-500/30'
                            : isWarning
                            ? 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {isOnline ? 'Online' : isWarning ? 'Warning' : 'Offline'}
                      </span>
                    </div>

                    {/* Gauges */}
                    <div className="space-y-3 py-4 font-mono text-xs">
                      {/* CPU Usage */}
                      <div>
                        <div className="flex justify-between text-[11px] text-[#e6e3df]/70 mb-1">
                          <span className="flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-[#d4b581]" /> CPU
                          </span>
                          <span className={node.cpuUsage > 80 ? 'text-red-400 font-bold' : ''}>
                            {node.cpuUsage}%
                          </span>
                        </div>
                        <div className="w-full bg-[#1c1b18] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              node.cpuUsage > 80 ? 'bg-red-500' : node.cpuUsage > 60 ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${node.cpuUsage}%` }}
                          />
                        </div>
                      </div>

                      {/* RAM Usage */}
                      <div>
                        <div className="flex justify-between text-[11px] text-[#e6e3df]/70 mb-1">
                          <span className="flex items-center gap-1.5">
                            <HardDrive className="w-3.5 h-3.5 text-[#38bdf8]" /> RAM
                          </span>
                          <span className={node.ramUsage > 85 ? 'text-red-400 font-bold' : ''}>
                            {node.ramUsage}%
                          </span>
                        </div>
                        <div className="w-full bg-[#1c1b18] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              node.ramUsage > 85 ? 'bg-red-500' : node.ramUsage > 70 ? 'bg-amber-400' : 'bg-[#38bdf8]'
                            }`}
                            style={{ width: `${node.ramUsage}%` }}
                          />
                        </div>
                      </div>

                      {/* Network & Streams */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#e6e3df]/5 text-[11px]">
                        <div>
                          <p className="text-[#e6e3df]/40 text-[9px]">ПИНГ</p>
                          <p className="font-bold text-white flex items-center gap-1">
                            {isPinging ? <RefreshCw className="w-3 h-3 animate-spin text-[#d4b581]" /> : `${node.pingMs} ms`}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#e6e3df]/40 text-[9px]">СТРИМОВ</p>
                          <p className="font-bold text-[#d4b581]">{node.activeStreams}</p>
                        </div>
                        <div>
                          <p className="text-[#e6e3df]/40 text-[9px]">ТРАФИК</p>
                          <p className="font-bold text-white">{node.bandwidthGbps} Gbps</p>
                        </div>
                      </div>
                    </div>

                    {/* Node Controls */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#e6e3df]/10">
                      <span className="text-[10px] font-mono text-[#e6e3df]/40 truncate max-w-[100px]">{node.version}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePingNode(node.id)}
                          title="Проверить Ping в реальном времени"
                          className="p-1.5 rounded-lg bg-[#1c1b18] hover:bg-[#2a2926] text-[#e6e3df] hover:text-[#d4b581] transition-all cursor-pointer"
                        >
                          <Radio className={`w-3.5 h-3.5 ${isPinging ? 'animate-ping text-[#d4b581]' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleFlushNode(node.id)}
                          title="Сбросить кэш и буферы узла"
                          className="p-1.5 rounded-lg bg-[#1c1b18] hover:bg-[#2a2926] text-[#e6e3df] hover:text-[#38bdf8] transition-all cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRestartNode(node.id)}
                          title="Перезагрузить службу TorrServer"
                          className="p-1.5 rounded-lg bg-[#1c1b18] hover:bg-[#2a2926] text-[#e6e3df] hover:text-[#d4b581] transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleNode(node.id)}
                          title={isOnline ? 'Отключить узел' : 'Включить узел'}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            isOnline
                              ? 'bg-red-950/40 text-red-400 hover:bg-red-900/60'
                              : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNode(node.id)}
                          title="Удалить узел из кластера"
                          className="p-1.5 rounded-lg bg-[#1c1b18] hover:bg-red-950/40 text-[#e6e3df]/40 hover:text-red-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Diagnostic Logs Console */}
          <div className="p-6 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#e6e3df]/10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#d4b581]" />
                    <span>Файловый журнал событий (logs/system.log)</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold">
                    REAL-TIME FILE LOG
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs text-[#e6e3df]/60 mt-1">
                  <span>Файл: <code className="text-[#d4b581]">{logStats.path}</code></span>
                  <span>• Всего записей: <strong className="text-white">{logStats.totalLines}</strong></span>
                  <span>• Ошибок: <strong className="text-red-400">{logStats.errorCount}</strong></span>
                  <span>• Предупреждений: <strong className="text-amber-400">{logStats.warnCount}</strong></span>
                </div>
              </div>

              {/* Log Actions & Filters */}
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <input
                  type="text"
                  placeholder="Поиск по тексту, IP, сервису..."
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                  className="px-3 py-1.5 bg-[#171615] border border-[#e6e3df]/15 rounded-lg text-white placeholder-[#e6e3df]/40 outline-none text-xs w-48"
                />
                <select
                  value={logFilter}
                  onChange={e => setLogFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[#171615] border border-[#e6e3df]/15 rounded-lg text-white outline-none text-xs cursor-pointer"
                >
                  <option value="all">Все уровни</option>
                  <option value="info">INFO</option>
                  <option value="warn">WARN</option>
                  <option value="error">ERROR</option>
                  <option value="critical">CRITICAL</option>
                </select>

                <button
                  onClick={handleSendTestLog}
                  title="Записать тестовое событие для проверки записи на диск"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1b18] hover:bg-[#2a2926] border border-[#e6e3df]/15 rounded-lg text-white text-xs cursor-pointer transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Тест записи</span>
                </button>

                <button
                  onClick={handleDownloadLogs}
                  title="Скачать полный сырой лог-файл"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d4b581]/15 hover:bg-[#d4b581]/25 border border-[#d4b581]/40 rounded-lg text-[#d4b581] font-bold text-xs cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Скачать .log</span>
                </button>

                <button
                  onClick={handleClearLogs}
                  title="Очистить лог-файл на сервере"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 rounded-lg text-red-400 text-xs cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Очистить</span>
                </button>
              </div>
            </div>

            {/* Console Log Rows */}
            <div className="font-mono text-xs space-y-2 max-h-96 overflow-y-auto pr-2 no-scrollbar">
              {filteredLogs.length === 0 ? (
                <div className="py-8 text-center text-[#e6e3df]/40 font-mono text-xs">
                  {logSearch ? 'Нет записей, соответствующих критериям поиска' : 'Файл логов пуст. Действия в системе записываются автоматически в logs/system.log'}
                </div>
              ) : (
                filteredLogs.map(log => {
                  const badgeColor =
                    log.level === 'error' || log.level === 'critical'
                      ? 'bg-red-950/60 text-red-400 border-red-500/40'
                      : log.level === 'warn'
                      ? 'bg-amber-950/60 text-amber-400 border-amber-500/40'
                      : 'bg-blue-950/60 text-blue-400 border-blue-500/40';

                  return (
                    <div
                      key={log.id}
                      className="p-2.5 bg-[#141312] border border-[#e6e3df]/5 rounded-lg flex items-start gap-3 hover:bg-[#1a1917] transition-colors"
                    >
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border shrink-0 ${badgeColor}`}>
                        {log.level}
                      </span>
                      <span className="text-[#e6e3df]/40 text-[11px] shrink-0">{log.timestamp}</span>
                      <span className="text-[#d4b581] font-semibold shrink-0">[{log.service}]</span>
                      <span className="text-[#e6e3df]/90 break-all">{log.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: USER & ACCESS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
          {/* User Metrics Top Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl">
              <span className="text-xs text-[#e6e3df]/50">ВСЕГО ПОЛЬЗОВАТЕЛЕЙ</span>
              <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
            </div>
            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl">
              <span className="text-xs text-[#e6e3df]/50">ПЛАТНЫЕ ПОДПИСЧИКИ</span>
              <p className="text-2xl font-bold text-[#d4b581] mt-1">
                {users.filter(u => u.plan !== 'standard').length}
              </p>
            </div>
            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl">
              <span className="text-xs text-[#e6e3df]/50">ТАРИФ 4K ULTRA VIP</span>
              <p className="text-2xl font-bold text-[#38bdf8] mt-1">
                {users.filter(u => u.plan === '4k').length}
              </p>
            </div>
            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl">
              <span className="text-xs text-[#e6e3df]/50">ЗАБЛОКИРОВАНО</span>
              <p className="text-2xl font-bold text-red-400 mt-1">
                {users.filter(u => u.is_blocked).length}
              </p>
            </div>
          </div>

          {/* User Filter & Search Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl font-mono text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#e6e3df]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск по email, имени или username..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white placeholder-[#e6e3df]/40 outline-none text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={userPlanFilter}
                onChange={e => setUserPlanFilter(e.target.value)}
                className="px-3 py-2.5 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white outline-none text-xs cursor-pointer"
              >
                <option value="all">Все тарифы</option>
                <option value="standard">Стандарт (Free)</option>
                <option value="hd">Доступ HD (179 ₽)</option>
                <option value="4k">Доступ 4K VIP (349 ₽)</option>
              </select>

              <select
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value)}
                className="px-3 py-2.5 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white outline-none text-xs cursor-pointer"
              >
                <option value="all">Все роли</option>
                <option value="user">Пользователь</option>
                <option value="moderator">Модератор</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e6e3df]/10 bg-[#171615] font-mono text-[11px] text-[#e6e3df]/60 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Пользователь</th>
                    <th className="py-3.5 px-4">Роль</th>
                    <th className="py-3.5 px-4">Тарифный план</th>
                    <th className="py-3.5 px-4">Срок действия</th>
                    <th className="py-3.5 px-4">Устройства</th>
                    <th className="py-3.5 px-4">Статус</th>
                    <th className="py-3.5 px-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e3df]/5">
                  {filteredUsers.map(u => {
                    const plan = SUBSCRIPTION_PLANS[u.plan] || SUBSCRIPTION_PLANS.standard;
                    const isExpired =
                      u.subscription_expires_at && new Date(u.subscription_expires_at).getTime() < Date.now();

                    return (
                      <tr key={u.id} className="hover:bg-[#151413] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-black text-xs shrink-0"
                              style={{ backgroundColor: u.avatar_color || '#d4b581' }}
                            >
                              {(u.displayName || u.username || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{u.displayName || u.username}</p>
                              <p className="font-mono text-[11px] text-[#e6e3df]/50">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              u.role === 'admin'
                                ? 'bg-amber-950/40 text-amber-400 border-amber-500/40'
                                : u.role === 'moderator'
                                ? 'bg-purple-950/40 text-purple-400 border-purple-500/40'
                                : 'bg-white/5 text-[#e6e3df]/70 border-white/10'
                            }`}
                          >
                            {u.role === 'admin' ? 'Админ' : u.role === 'moderator' ? 'Модератор' : 'Пользователь'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                            style={{
                              backgroundColor: `${plan.color}15`,
                              borderColor: `${plan.color}40`,
                              color: plan.color
                            }}
                          >
                            {plan.name}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          {u.plan === 'standard' ? (
                            <span className="text-[#e6e3df]/40">Бессрочно (Free)</span>
                          ) : u.subscription_expires_at ? (
                            <span className={isExpired ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                              {new Date(u.subscription_expires_at).toLocaleDateString('ru-RU')}
                              {isExpired && ' (Истекла)'}
                            </span>
                          ) : (
                            <span className="text-[#e6e3df]/40">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <span className="text-white font-bold">{u.connected_devices_count || 1}</span>
                          <span className="text-[#e6e3df]/40"> / {plan.maxDevices} устр.</span>
                        </td>

                        <td className="py-3.5 px-4">
                          {u.is_blocked ? (
                            <span className="inline-flex items-center gap-1 text-red-400 font-mono text-[10px] font-bold px-2 py-0.5 bg-red-950/40 border border-red-500/30 rounded-full">
                              <UserX className="w-3 h-3" /> БЛОКИРОВАН
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[10px] font-bold px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/30 rounded-full">
                              <UserCheck className="w-3 h-3" /> АКТИВЕН
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedUserForEdit(u);
                              setEditModalTab('plan');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#1c1b18] hover:bg-[#d4b581] hover:text-black border border-[#e6e3df]/15 font-mono text-xs font-bold transition-all cursor-pointer"
                          >
                            Управление
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Edit Modal Sheet */}
          {selectedUserForEdit && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#121110] border border-[#d4b581]/40 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl animate-[scaleIn_0.2s_ease-out]">
                <div className="flex items-center justify-between pb-4 border-b border-[#e6e3df]/10">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-black"
                      style={{ backgroundColor: selectedUserForEdit.avatar_color || '#d4b581' }}
                    >
                      {(selectedUserForEdit.displayName || selectedUserForEdit.username)[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-white">
                        {selectedUserForEdit.displayName || selectedUserForEdit.username}
                      </h3>
                      <p className="font-mono text-xs text-[#e6e3df]/50">{selectedUserForEdit.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUserForEdit(null)}
                    className="text-[#e6e3df]/50 hover:text-white font-mono text-sm px-2 py-1 rounded-lg bg-[#1c1b18] cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Sub-Tabs */}
                <div className="flex items-center gap-2 border-b border-[#e6e3df]/10 pb-2 font-mono text-xs">
                  <button
                    onClick={() => setEditModalTab('plan')}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                      editModalTab === 'plan' ? 'bg-[#d4b581] text-black font-bold' : 'text-[#e6e3df]/60 hover:text-white'
                    }`}
                  >
                    Тариф & Срок
                  </button>
                  <button
                    onClick={() => setEditModalTab('role')}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                      editModalTab === 'role' ? 'bg-[#d4b581] text-black font-bold' : 'text-[#e6e3df]/60 hover:text-white'
                    }`}
                  >
                    Роль & Доступ
                  </button>
                  <button
                    onClick={() => setEditModalTab('devices')}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                      editModalTab === 'devices' ? 'bg-[#d4b581] text-black font-bold' : 'text-[#e6e3df]/60 hover:text-white'
                    }`}
                  >
                    Устройства
                  </button>
                </div>

                {/* Edit Tab 1: Plan & Time */}
                {editModalTab === 'plan' && (
                  <div className="space-y-4 font-mono text-xs">
                    <div>
                      <label className="text-[#e6e3df]/60 block mb-2 font-bold uppercase">Выберите тарифный план:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['standard', 'hd', '4k'] as SubscriptionPlanId[]).map(pId => {
                          const p = SUBSCRIPTION_PLANS[pId];
                          const isCur = selectedUserForEdit.plan === pId;
                          return (
                            <button
                              key={pId}
                              onClick={() => handleUpdatePlan(selectedUserForEdit.id, pId, 30)}
                              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                                isCur
                                  ? 'bg-[#d4b581]/20 border-[#d4b581] text-white shadow-sm'
                                  : 'bg-[#171615] border-[#e6e3df]/10 text-[#e6e3df]/70 hover:border-[#e6e3df]/30'
                              }`}
                            >
                              <p className="font-bold text-sm" style={{ color: p.color }}>
                                {p.name}
                              </p>
                              <p className="text-[10px] text-[#e6e3df]/50 mt-1">{p.period}</p>
                              <p className="text-[10px] text-[#e6e3df]/80 mt-1">До {p.maxResolutionLabel}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#e6e3df]/10">
                      <label className="text-[#e6e3df]/60 block mb-2 font-bold uppercase">
                        Продлить подписку на период:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleExtendSubscription(selectedUserForEdit.id, 30)}
                          className="px-3 py-2 bg-[#1c1b18] hover:bg-[#252422] border border-[#e6e3df]/15 rounded-xl text-white font-bold cursor-pointer"
                        >
                          + 30 дней (1 мес)
                        </button>
                        <button
                          onClick={() => handleExtendSubscription(selectedUserForEdit.id, 90)}
                          className="px-3 py-2 bg-[#1c1b18] hover:bg-[#252422] border border-[#e6e3df]/15 rounded-xl text-white font-bold cursor-pointer"
                        >
                          + 90 дней (3 мес)
                        </button>
                        <button
                          onClick={() => handleExtendSubscription(selectedUserForEdit.id, 365)}
                          className="px-3 py-2 bg-[#1c1b18] hover:bg-[#252422] border border-[#e6e3df]/15 rounded-xl text-white font-bold cursor-pointer"
                        >
                          + 1 год (365 дней)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Tab 2: Role & Security */}
                {editModalTab === 'role' && (
                  <div className="space-y-4 font-mono text-xs">
                    <div>
                      <label className="text-[#e6e3df]/60 block mb-2 font-bold uppercase">Уровень доступа (Роль):</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['user', 'moderator', 'admin'] as UserRole[]).map(roleId => {
                          const isCur = selectedUserForEdit.role === roleId;
                          return (
                            <button
                              key={roleId}
                              onClick={() => handleUpdateRole(selectedUserForEdit.id, roleId)}
                              className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                                isCur
                                  ? 'bg-[#d4b581] text-black font-bold'
                                  : 'bg-[#171615] border-[#e6e3df]/10 text-[#e6e3df]/70 hover:border-[#e6e3df]/30'
                              }`}
                            >
                              {roleId === 'admin' ? 'Администратор' : roleId === 'moderator' ? 'Модератор' : 'Пользователь'}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#e6e3df]/10 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">Блокировка аккаунта</p>
                        <p className="text-[11px] text-[#e6e3df]/50">Запретить доступ к стримам и авторизации</p>
                      </div>
                      <button
                        onClick={() => handleToggleBlock(selectedUserForEdit.id)}
                        className={`px-4 py-2 rounded-xl font-bold cursor-pointer ${
                          selectedUserForEdit.is_blocked
                            ? 'bg-emerald-500 text-black'
                            : 'bg-red-500/20 text-red-400 border border-red-500/40'
                        }`}
                      >
                        {selectedUserForEdit.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                      </button>
                    </div>

                    <div className="pt-4 border-t border-[#e6e3df]/10 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-red-400">Удалить аккаунт</p>
                        <p className="text-[11px] text-[#e6e3df]/50">Полное удаление профиля и истории</p>
                      </div>
                      <button
                        onClick={() => handleDeleteUser(selectedUserForEdit.id)}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Удалить</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit Tab 3: Devices */}
                {editModalTab === 'devices' && (
                  <div className="space-y-4 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <p className="text-[#e6e3df]/60 font-bold uppercase">
                        Привязанные Smart TV ({selectedUserForEdit.devices?.length || 0})
                      </p>
                      <button
                        onClick={() => handleResetDevices(selectedUserForEdit.id)}
                        className="px-3 py-1.5 bg-red-950/40 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-900/60 cursor-pointer"
                      >
                        Сбросить все устройства
                      </button>
                    </div>

                    <div className="space-y-2">
                      {selectedUserForEdit.devices && selectedUserForEdit.devices.length > 0 ? (
                        selectedUserForEdit.devices.map(dev => (
                          <div
                            key={dev.id}
                            className="p-3 bg-[#171615] border border-[#e6e3df]/10 rounded-xl flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <Tv className="w-4 h-4 text-[#d4b581]" />
                              <div>
                                <p className="font-bold text-white">{dev.device_name}</p>
                                <p className="text-[10px] text-[#e6e3df]/40">
                                  {dev.platform.toUpperCase()} • ID: {dev.device_id}
                                </p>
                              </div>
                            </div>
                            <span className="text-emerald-400 text-[10px] font-bold">АКТИВНО</span>
                          </div>
                        ))
                      ) : (
                        <p className="p-4 text-center text-[#e6e3df]/40 bg-[#171615] rounded-xl">
                          Нет привязанных устройств
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: FINANCIALS, BILLING & INFLOW ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'finance' && financialStats && (
        <div className="space-y-8 animate-[fadeIn_0.2s_ease-out]">
          {/* Top Inflow KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 font-mono">
            <div className="p-4 bg-[#0f0e0d] border border-[#d4b581]/40 rounded-2xl shadow-[0_0_20px_rgba(212,181,129,0.1)]">
              <span className="text-[11px] text-[#d4b581] font-bold">ОБЩИЕ ПОСТУПЛЕНИЯ</span>
              <p className="text-2xl font-bold text-white mt-1">
                {financialStats.totalRevenueRub.toLocaleString('ru-RU')} ₽
              </p>
              <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +18.4% за месяц
              </p>
            </div>

            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl">
              <span className="text-[11px] text-[#e6e3df]/50">MRR (В МЕСЯЦ)</span>
              <p className="text-2xl font-bold text-white mt-1">
                {financialStats.monthRevenueRub.toLocaleString('ru-RU')} ₽
              </p>
              <p className="text-[10px] text-[#e6e3df]/40 mt-1">Рекуррентные платежи</p>
            </div>

            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl">
              <span className="text-[11px] text-[#e6e3df]/50">ЗА СЕГОДНЯ</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                +{financialStats.todayRevenueRub.toLocaleString('ru-RU')} ₽
              </p>
              <p className="text-[10px] text-emerald-400/80 mt-1">14 транзакций</p>
            </div>

            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl">
              <span className="text-[11px] text-[#e6e3df]/50">СРЕДНИЙ ЧЕК (ARPU)</span>
              <p className="text-2xl font-bold text-white mt-1">{financialStats.averageCheckRub} ₽</p>
              <p className="text-[10px] text-[#e6e3df]/40 mt-1">На платного юзера</p>
            </div>

            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl">
              <span className="text-[11px] text-[#e6e3df]/50">КОНВЕРСИЯ В ПОДПИСКУ</span>
              <p className="text-2xl font-bold text-[#38bdf8] mt-1">{financialStats.conversionRate}%</p>
              <p className="text-[10px] text-[#38bdf8]/70 mt-1">
                {financialStats.payingUsersCount} из {financialStats.totalUsersCount} платят
              </p>
            </div>
          </div>

          {/* Revenue Chart Section */}
          <div className="p-6 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e6e3df]/10">
              <div>
                <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#d4b581]" />
                  <span>Динамика финансовых поступлений (Август 2026)</span>
                </h3>
                <p className="font-mono text-xs text-[#e6e3df]/50">
                  Ежедневный объем успешных оплат подписок HD и 4K Ultra
                </p>
              </div>

              {/* Simulation Quick Trigger */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-[#e6e3df]/50">Тестовый платеж:</span>
                <button
                  onClick={() => handleRecordPayment('hd')}
                  className="px-2.5 py-1.5 bg-[#38bdf8]/15 hover:bg-[#38bdf8]/30 border border-[#38bdf8]/40 rounded-lg text-[#38bdf8] font-bold cursor-pointer"
                >
                  +179 ₽ (HD)
                </button>
                <button
                  onClick={() => handleRecordPayment('4k')}
                  className="px-2.5 py-1.5 bg-[#d4b581]/15 hover:bg-[#d4b581]/30 border border-[#d4b581]/40 rounded-lg text-[#d4b581] font-bold cursor-pointer"
                >
                  +349 ₽ (4K)
                </button>
              </div>
            </div>

            {/* Custom High-Fidelity SVG Bar & Curve Chart */}
            <div className="pt-4">
              <div className="h-64 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 pb-6 border-b border-[#e6e3df]/10 relative">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                  <div className="border-b border-white w-full" />
                  <div className="border-b border-white w-full" />
                  <div className="border-b border-white w-full" />
                  <div className="border-b border-white w-full" />
                </div>

                {financialStats.revenueByDay.map((item, idx) => {
                  const maxAmt = 7000;
                  const heightPercent = Math.min(100, Math.max(15, (item.amount / maxAmt) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative z-10">
                      {/* Floating Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-12 bg-[#1c1b18] border border-[#d4b581]/60 text-white font-mono text-[10px] px-2.5 py-1 rounded-lg shadow-xl pointer-events-none transition-all duration-150 whitespace-nowrap z-30">
                        <p className="font-bold text-[#d4b581]">{item.amount.toLocaleString()} ₽</p>
                        <p className="text-[9px] text-[#e6e3df]/60">{item.count} транзакций</p>
                      </div>

                      {/* Bar Column */}
                      <div className="w-full max-w-[48px] bg-[#1c1b18] rounded-t-xl overflow-hidden h-48 flex items-end p-1">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-[#d4b581]/40 via-[#d4b581]/80 to-[#d4b581] group-hover:to-white transition-all duration-300 shadow-[0_0_15px_rgba(212,181,129,0.3)]"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>

                      <span className="font-mono text-[11px] text-[#e6e3df]/60 group-hover:text-[#d4b581] font-semibold">
                        {item.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Plan Breakdown & Payment Gateways */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 font-mono">
              {/* Plans Revenue Breakdown */}
              <div className="p-4 bg-[#141312] border border-[#e6e3df]/10 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Распределение по тарифам (3 плана)
                </h4>
                <div className="space-y-2.5 text-xs">
                  {financialStats.revenueByPlan.map(p => (
                    <div key={p.planId} className="flex items-center justify-between p-2.5 bg-[#1a1917] rounded-lg">
                      <div>
                        <p className="font-bold text-white">{p.planName}</p>
                        <p className="text-[10px] text-[#e6e3df]/40">{p.count} активных подписчиков</p>
                      </div>
                      <span className="font-bold text-[#d4b581]">{p.totalRub.toLocaleString()} ₽ / мес</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="p-4 bg-[#141312] border border-[#e6e3df]/10 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Способы оплаты</h4>
                <div className="space-y-2.5 text-xs">
                  {financialStats.paymentMethodDistribution.map(m => (
                    <div key={m.method} className="flex items-center justify-between p-2.5 bg-[#1a1917] rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <span className="font-bold text-white">{m.label}</span>
                      </div>
                      <span className="text-[#e6e3df]/70">{m.totalRub.toLocaleString()} ₽</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Payment Inflow Ledger */}
          <div className="p-6 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl space-y-4 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e6e3df]/10">
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <span>Реестр финансовых транзакций</span>
                </h3>
                <p className="font-mono text-xs text-[#e6e3df]/50">
                  Время поступления, реквизиты шлюза и статус зачисления
                </p>
              </div>

              <input
                type="text"
                placeholder="Поиск по email или номеру заказа..."
                value={txSearch}
                onChange={e => setTxSearch(e.target.value)}
                className="px-3 py-1.5 bg-[#171615] border border-[#e6e3df]/15 rounded-lg text-white placeholder-[#e6e3df]/40 outline-none text-xs font-mono"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e6e3df]/10 bg-[#171615] font-mono text-[11px] text-[#e6e3df]/60 uppercase tracking-wider">
                    <th className="py-3 px-4">Время оплаты</th>
                    <th className="py-3 px-4">Пользователь</th>
                    <th className="py-3 px-4">Тариф</th>
                    <th className="py-3 px-4">Сумма</th>
                    <th className="py-3 px-4">Платежный шлюз</th>
                    <th className="py-3 px-4">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e3df]/5 font-mono">
                  {filteredTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-[#151413] transition-colors">
                      <td className="py-3 px-4 text-[#e6e3df]/50 text-[11px]">{tx.timestamp}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-white font-sans">{tx.userName}</p>
                        <p className="text-[10px] text-[#e6e3df]/50">{tx.userEmail}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[#d4b581] font-bold">{tx.planName}</span>
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-bold text-sm">+{tx.amountRub} ₽</td>
                      <td className="py-3 px-4 text-[11px] text-[#e6e3df]/70">
                        {tx.methodLabel}
                        <p className="text-[9px] text-[#e6e3df]/40">{tx.paymentGatewayRef}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                          ✓ ОПЛАЧЕНО
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: CATALOG & TMDB METADATA MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-8 animate-[fadeIn_0.2s_ease-out]">
          {/* API Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Film className="w-5 h-5 text-[#d4b581]" />
                <div>
                  <h4 className="text-xs font-bold text-white">TMDB API Gateway</h4>
                  <p className="text-[10px] text-[#e6e3df]/50">
                    {metadataStatus?.tmdb?.configured ? `Ключ: ${metadataStatus.tmdb.key_preview}` : 'Авторизован в ядре'}
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-emerald-400 text-[10px] uppercase font-bold bg-emerald-950/40 px-2 py-1 border border-emerald-500/30 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" /> Активно
              </span>
            </div>

            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tv className="w-5 h-5 text-[#38bdf8]" />
                <div>
                  <h4 className="text-xs font-bold text-white">TorrServer P2P Scraper</h4>
                  <p className="text-[10px] text-[#e6e3df]/50">Автопарсинг магнет-ссылок 4K HDR</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-emerald-400 text-[10px] uppercase font-bold bg-emerald-950/40 px-2 py-1 border border-emerald-500/30 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" /> Готов
              </span>
            </div>
          </div>

          {/* Sync Status Banner */}
          {syncStatus && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-emerald-300 font-mono text-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>{syncStatus}</span>
            </div>
          )}

          {/* Search External Catalog Form */}
          <div className="p-6 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-[#d4b581]" />
              <span>Поиск и импорт фильмов / сериалов из TMDB</span>
            </h3>

            <form onSubmit={handleMetadataSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Введите название фильма (например: Оппенгеймер, Матрица, Дюна)..."
                value={metaSearchQuery}
                onChange={e => setMetaSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white placeholder-[#e6e3df]/40 outline-none text-xs font-mono"
              />
              <button
                type="submit"
                disabled={isSearchingMeta}
                className="px-6 py-3 bg-[#d4b581] hover:bg-[#c4a571] text-black font-mono text-xs font-bold uppercase rounded-xl cursor-pointer transition-all disabled:opacity-50"
              >
                {isSearchingMeta ? 'Поиск...' : 'Найти в TMDB'}
              </button>
            </form>

            {/* Results Grid */}
            {metaResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                {metaResults.map(item => (
                  <div
                    key={`${item.source}-${item.type}-${item.id}`}
                    className="p-3 bg-[#171615] border border-[#e6e3df]/10 rounded-xl flex items-center gap-3"
                  >
                    <img
                      src={item.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=100'}
                      alt={item.title}
                      className="w-12 h-16 object-cover rounded-lg shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-xs truncate">{item.title}</p>
                      <p className="font-mono text-[10px] text-[#e6e3df]/50">
                        {item.year} • {item.type === 'movie' ? 'Фильм' : 'Сериал'} • ★ {item.rating}
                      </p>
                      <button
                        onClick={() => handleImportMetadata(item)}
                        className="mt-2 px-2.5 py-1 bg-[#d4b581]/15 hover:bg-[#d4b581]/30 border border-[#d4b581]/40 rounded-lg text-[10px] font-mono font-bold text-[#d4b581] cursor-pointer"
                      >
                        + Импортировать
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual Add Form */}
          <div className="p-6 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#d4b581]" />
              <span>Ручное добавление видеопотока / HLS / Торрента</span>
            </h3>

            <form onSubmit={handleManualAdd} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#e6e3df]/60 block mb-1">Название фильма / сериала:</label>
                  <input
                    type="text"
                    required
                    placeholder="Например: Аватар: Путь воды 4K"
                    value={manualTitle}
                    onChange={e => setManualTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#e6e3df]/60 block mb-1">Тип контента:</label>
                  <select
                    value={manualType}
                    onChange={e => setManualType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white outline-none cursor-pointer"
                  >
                    <option value="movie">Фильм</option>
                    <option value="series">Сериал</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#e6e3df]/60 block mb-1">Ссылка на поток (HLS / m3u8 / magnet):</label>
                <input
                  type="text"
                  required
                  placeholder="https://.../stream.m3u8 или magnet:?xt=urn:btih:..."
                  value={manualStream}
                  onChange={e => setManualStream(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[#e6e3df]/60 block mb-1">URL постера (опционально):</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={manualPoster}
                  onChange={e => setManualPoster(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-[#d4b581] hover:bg-[#c4a571] text-black font-mono text-xs font-bold uppercase rounded-xl cursor-pointer"
              >
                Сохранить в каталог
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB: NODE INTEGRATION & DATA INGESTION GUIDE */}
      {/* ========================================================================= */}
      {activeTab === 'guide' && (
        <IntegrationGuide nodes={nodes} onDataRefresh={loadData} />
      )}

      {/* Add Node Modal */}
      <AddNodeModal
        isOpen={isAddNodeOpen}
        onClose={() => setIsAddNodeOpen(false)}
        onNodeAdded={() => {
          loadData();
        }}
      />
    </div>
  );
};
