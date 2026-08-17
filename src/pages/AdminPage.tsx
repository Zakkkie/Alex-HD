import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  Users,
  Database,
  RefreshCw,
  Power,
  RotateCcw,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Trash2,
  UserX,
  UserCheck,
  Tv,
  Plus,
  Zap,
  Wifi,
  HardDrive,
  Cpu,
  Download,
  Film,
  Terminal,
  Radio,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Sliders
} from 'lucide-react';
import { adminStore, SUBSCRIPTION_PLANS } from '../data/adminStore';
import {
  ServerNode,
  User,
  SystemLogEntry,
  SubscriptionPlanId,
  UserRole
} from '../types';
import { api } from '../api/client';
import { AddNodeModal } from '../components/admin/AddNodeModal';
import { InstallationGuideTab } from '../components/admin/InstallationGuideTab';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'nodes' | 'catalog' | 'users' | 'guide'>('nodes');

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
  const [isTerminalGuideOpen, setIsTerminalGuideOpen] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userPlanFilter, setUserPlanFilter] = useState<string>('all');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [editModalTab, setEditModalTab] = useState<'plan' | 'role' | 'devices'>('plan');

  // Catalog TMDB State
  const [metadataStatus, setMetadataStatus] = useState<any>(null);
  const [metaSearchQuery, setMetaSearchQuery] = useState('');
  const [metaResults, setMetaResults] = useState<any[]>([]);
  const [isSearchingMeta, setIsSearchingMeta] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<{
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
  }>({
    isSyncing: false,
    progressPercent: 0,
    currentStep: 'Готов к синхронизации',
    itemsAdded: 0,
    totalCatalogCount: 0,
    error: null,
    lastSyncTimestamp: null,
    apiReports: []
  });

  const [manualTitle, setManualTitle] = useState('');
  const [manualType, setManualType] = useState<'movie' | 'series'>('movie');
  const [manualStream, setManualStream] = useState('');
  const [manualPoster, setManualPoster] = useState('');

  const [tmdbKeyInput, setTmdbKeyInput] = useState('');
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);
  const [keyUpdateError, setKeyUpdateError] = useState<string | null>(null);
  const [keyUpdateSuccess, setKeyUpdateSuccess] = useState<string | null>(null);
  const [showKeyForm, setShowKeyForm] = useState(false);

  const [torrServerUrlInput, setTorrServerUrlInput] = useState('');
  const [prowlarrUrlInput, setProwlarrUrlInput] = useState('');
  const [prowlarrKeyInput, setProwlarrKeyInput] = useState('');
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [settingsUpdateError, setSettingsUpdateError] = useState<string | null>(null);
  const [settingsUpdateSuccess, setSettingsUpdateSuccess] = useState<string | null>(null);
  const [showSettingsForm, setShowSettingsForm] = useState(false);

  const loadSettings = async () => {
    try {
      const data = await api.getAdminSettings();
      setTorrServerUrlInput(data.torrServerUrl || '');
      setProwlarrUrlInput(data.prowlarrUrl || '');
      setProwlarrKeyInput(data.prowlarrKey || '');
    } catch (err: any) {
      console.warn('Failed to load system settings:', err);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSettings(true);
    setSettingsUpdateError(null);
    setSettingsUpdateSuccess(null);
    try {
      const res = await api.updateAdminSettings({
        torrServerUrl: torrServerUrlInput.trim(),
        prowlarrUrl: prowlarrUrlInput.trim(),
        prowlarrKey: prowlarrKeyInput.trim()
      });
      if (res.success) {
        setSettingsUpdateSuccess(res.message || 'Настройки сохранены!');
        setShowSettingsForm(false);
      } else {
        setSettingsUpdateError(res.message || 'Не удалось сохранить настройки');
      }
    } catch (err: any) {
      setSettingsUpdateError(err.message || 'Ошибка обновления настроек');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleUpdateTMDBKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmdbKeyInput.trim()) {
      setKeyUpdateError('Пожалуйста, введите API ключ TMDB.');
      return;
    }
    setIsUpdatingKey(true);
    setKeyUpdateError(null);
    setKeyUpdateSuccess(null);
    try {
      const res = await api.updateTMDBKey(tmdbKeyInput);
      if (res.success) {
        setKeyUpdateSuccess(res.message || 'Ключ успешно обновлен!');
        setTmdbKeyInput('');
        setShowKeyForm(false);
        // Refresh metadata status
        loadMetadataStatus();
      } else {
        setKeyUpdateError(res.message || 'Не удалось обновить ключ');
      }
    } catch (err: any) {
      setKeyUpdateError(err.message || 'Ошибка обновления ключа');
    } finally {
      setIsUpdatingKey(false);
    }
  };

  // Load Real Admin Data from backend
  const loadData = async () => {
    setIsRefreshingNodes(true);
    try {
      // 1. Fetch dashboard overview (host metrics, nodes, live torrserver status)
      const dashboard = await api.getAdminDashboard().catch(() => null);
      if (dashboard?.nodes) {
        adminStore.setNodes(dashboard.nodes.map((n: any) => ({
          id: n.nodeId,
          name: n.name || `Node ${n.nodeId}`,
          type: n.type || 'torrserver',
          ip: n.hostname,
          location: n.region || 'Россия / VPS',
          countryCode: 'RU',
          status: n.isOnline ? 'online' : 'offline',
          cpuUsage: n.isOnline && typeof n.cpuUsagePercent === 'number' ? n.cpuUsagePercent : null,
          ramUsage: n.isOnline && typeof n.ramUsagePercent === 'number' ? n.ramUsagePercent : null,
          diskUsage: n.isOnline && typeof n.diskUsagePercent === 'number' ? n.diskUsagePercent : null,
          bandwidthGbps: n.isOnline && typeof n.bandwidthMbps === 'number' ? Math.round(((n.bandwidthMbps || 0) / 1000) * 10) / 10 : null,
          activeStreams: n.isOnline ? (n.activeStreams || 0) : 0,
          pingMs: n.isOnline && typeof n.pingMs === 'number' && n.pingMs > 0 ? n.pingMs : null,
          uptimeHours: n.uptimeHours || 1,
          errorCount24h: n.error ? 1 : 0,
          version: n.version || (n.isOnline ? 'TorrServer MatriX.134' : 'N/A'),
          lastHealthCheck: n.isOnline ? 'Только что' : 'Оффлайн (Нет связи)',
          lastError: n.error || (!n.isOnline ? 'Сервер недоступен (ECONNREFUSED / No Ping)' : undefined)
        })));
      }

      // 2. Fetch real system logs
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

      // 3. Fetch users
      const usersData = await api.getAdminUsers().catch(() => null);
      if (usersData) {
        adminStore.setUsers(usersData);
        setUsers(adminStore.getUsers());
      } else {
        setUsers(adminStore.getUsers());
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
    loadSettings();

    const interval = setInterval(() => {
      loadData();
    }, 6000);

    return () => clearInterval(interval);
  }, [logFilter]);

  const loadMetadataStatus = async () => {
    try {
      const res = await api.getMetadataStatus();
      setMetadataStatus(res);
      handleCheckApisOnly();
    } catch (e) {
      console.warn('Metadata status load deferred:', e);
    }
  };

  // Node Actions
  const handleToggleNode = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    const newStatus = node?.status !== 'online';
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
    if (window.confirm('Удалить узел TorrServer из панели?')) {
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
      alert(`Ошибка скачивания: ${err.message}`);
    }
  };

  const handleClearLogs = async () => {
    if (window.confirm('Очистить системный журнал?')) {
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
        message: 'Диагностическая проверка журнала'
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
    if (confirm('Удалить пользователя?')) {
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

  // Metadata Auto-Sync Polling Effect
  useEffect(() => {
    let timer: any = null;
    if (syncProgress.isSyncing) {
      timer = setInterval(async () => {
        const prog = await api.getMetadataSyncProgress().catch(() => null);
        if (prog) {
          setSyncProgress(prog);
          if (!prog.isSyncing) {
            clearInterval(timer);
            setSyncStatus(`Синхронизация завершена! Добавлено ${prog.itemsAdded} элементов.`);
            setTimeout(() => setSyncStatus(null), 5000);
          }
        }
      }, 700);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [syncProgress.isSyncing]);

  const handleCheckApisOnly = async () => {
    try {
      const res = await api.checkAPIs();
      if (res && res.reports) {
        setSyncProgress(prev => ({
          ...prev,
          apiReports: res.reports
        }));
      }
    } catch (err: any) {
      console.warn('API Check failed:', err);
    }
  };

  const handleTriggerSync = async () => {
    handleCheckApisOnly();
    setSyncProgress(prev => ({
      ...prev,
      isSyncing: true,
      progressPercent: 5,
      currentStep: 'Запуск диагностики и обновления API TMDB и TVDB...'
    }));
    try {
      const res = await api.autoPopulateCatalog();
      if (res && (res as any).initialProgress) {
        setSyncProgress((res as any).initialProgress);
      }
    } catch (err: any) {
      setSyncProgress(prev => ({ ...prev, isSyncing: false, error: err.message || 'Ошибка запуска' }));
    }
  };

  // Metadata Search & Add
  const handleMetadataSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!metaSearchQuery.trim()) return;
    setIsSearchingMeta(true);
    try {
      const res = await api.searchMetadata(metaSearchQuery, 'tmdb');
      setMetaResults(res.results || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSearchingMeta(false);
    }
  };

  const handleImportMetadata = async (item: any) => {
    try {
      await api.importMetadata(item.id, item.source || 'tmdb', item.type || 'movie');
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
      setSyncStatus(`"${manualTitle}" успешно добавлен в каталог!`);
      setManualTitle('');
      setManualStream('');
      setManualPoster('');
      setTimeout(() => setSyncStatus(null), 4000);
    } catch (err: any) {
      alert(`Ошибка: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2500);
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

  const onlineNodesCount = nodes.filter(n => n.status === 'online').length;
  const totalBandwidth = nodes.reduce((acc, n) => acc + (n.status === 'online' ? n.bandwidthGbps : 0), 0);
  const totalActiveStreams = nodes.reduce((acc, n) => acc + (n.status === 'online' ? n.activeStreams : 0), 0);

  return (
    <div className="pb-20 pt-2 text-[#e6e3df] max-w-7xl mx-auto space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e6e3df]/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4b581]/25 to-[#d4b581]/5 border border-[#d4b581]/40 flex items-center justify-center text-[#d4b581] shrink-0 shadow-[0_0_20px_rgba(212,181,129,0.2)]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-white">Панель управления</h1>
              <span className="px-2 py-0.5 rounded-full bg-[#d4b581]/20 border border-[#d4b581]/40 text-[#d4b581] font-mono text-[10px] font-bold tracking-wider">
                ADMIN CONSOLE
              </span>
            </div>
            <p className="font-mono text-xs text-[#d4b581]/80 uppercase tracking-wider mt-0.5">
              УПРАВЛЕНИЕ КЛАСТЕРОМ • TORRSERVER • МЕТАДАННЫЕ TMDB • ПОЛЬЗОВАТЕЛИ
            </p>
          </div>
        </div>

        {/* Global Action Quick Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#171615] hover:bg-[#252422] border border-[#e6e3df]/15 rounded-xl text-xs font-mono font-medium text-[#e6e3df] transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#d4b581] ${isRefreshingNodes ? 'animate-spin' : ''}`} />
            <span>Обновить</span>
          </button>
          <button
            onClick={handleFlushBuffers}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#d4b581]/15 hover:bg-[#d4b581]/25 border border-[#d4b581]/40 rounded-xl text-xs font-mono font-bold text-[#d4b581] transition-all cursor-pointer"
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'nodes'
              ? 'bg-[#d4b581] text-black shadow-[0_0_20px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Узлы и TorrServer ({nodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'catalog'
              ? 'bg-[#d4b581] text-black shadow-[0_0_20px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Каталог & TMDB</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-[#d4b581] text-black shadow-[0_0_20px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Пользователи и Доступ ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'guide'
              ? 'bg-[#d4b581] text-black shadow-[0_0_20px_rgba(212,181,129,0.4)]'
              : 'bg-[#171615] text-[#e6e3df]/70 border border-[#e6e3df]/10 hover:text-white hover:bg-[#22211f]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Гайд по установке</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. TAB: SERVER NODES & TORRSERVER MONITORING */}
      {/* ========================================================================= */}
      {activeTab === 'nodes' && (
        <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
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
                  style={{ width: `${nodes.length > 0 ? (onlineNodesCount / nodes.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-[#e6e3df]/50 mb-1">
                <span>ТРАФИК КЛАСТЕРА</span>
                <Wifi className="w-4 h-4 text-[#38bdf8]" />
              </div>
              <p className="text-2xl font-bold text-white">
                {totalBandwidth.toFixed(1)} <span className="text-xs text-[#e6e3df]/40 font-normal">Gbps</span>
              </p>
              <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Пропускная способность
              </p>
            </div>

            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-[#e6e3df]/50 mb-1">
                <span>АКТИВНЫХ СТРИМОВ</span>
                <Activity className="w-4 h-4 text-[#d4b581]" />
              </div>
              <p className="text-2xl font-bold text-white">{totalActiveStreams}</p>
              <p className="text-[10px] text-[#d4b581] mt-2 flex items-center gap-1">
                <span>HLS / 4K прямой поток</span>
              </p>
            </div>

            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-[#e6e3df]/50 mb-1">
                <span>ЗДОРОВЬЕ СЕРВИСОВ</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">100%</p>
              <p className="text-[10px] text-[#e6e3df]/40 mt-2">
                Демон: <span className="text-[#d4b581]">TorrServer MatriX</span>
              </p>
            </div>
          </div>

          {/* Quick Terminal SSH Commands Dropdown */}
          <div className="p-4 bg-[#121110] border border-[#d4b581]/30 rounded-2xl">
            <button
              onClick={() => setIsTerminalGuideOpen(!isTerminalGuideOpen)}
              className="w-full flex items-center justify-between font-mono text-xs font-bold text-white cursor-pointer"
            >
              <div className="flex items-center gap-2 text-[#d4b581]">
                <Terminal className="w-4 h-4" />
                <span>SSH-команды для управления VPS и TorrServer</span>
              </div>
              <div className="flex items-center gap-1 text-[#e6e3df]/60 hover:text-white">
                <span>{isTerminalGuideOpen ? 'Скрыть' : 'Показать команды'}</span>
                {isTerminalGuideOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isTerminalGuideOpen && (
              <div className="mt-4 pt-3 border-t border-[#e6e3df]/10 space-y-3 font-mono text-xs animate-in fade-in duration-150">
                <p className="text-[#e6e3df]/70">
                  Выполните эти команды на вашем сервере через SSH для проверки и настройки TorrServer:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#e6e3df]/50">Открыть порт TorrServer в фаерволе:</p>
                      <code className="text-emerald-400 font-bold text-xs">sudo ufw allow 8090/tcp</code>
                    </div>
                    <button
                      onClick={() => copyToClipboard('sudo ufw allow 8090/tcp', 'ufw')}
                      className="p-1.5 rounded-lg bg-[#1c1b18] hover:bg-[#2a2926] text-[#e6e3df] cursor-pointer"
                      title="Копировать"
                    >
                      {copiedCmd === 'ufw' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-3 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#e6e3df]/50">Проверить отклик демона локально:</p>
                      <code className="text-emerald-400 font-bold text-xs">curl -I http://127.0.0.1:8090/echo</code>
                    </div>
                    <button
                      onClick={() => copyToClipboard('curl -I http://127.0.0.1:8090/echo', 'curl')}
                      className="p-1.5 rounded-lg bg-[#1c1b18] hover:bg-[#2a2926] text-[#e6e3df] cursor-pointer"
                      title="Копировать"
                    >
                      {copiedCmd === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-3 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#e6e3df]/50">Перезапустить службу TorrServer:</p>
                      <code className="text-[#38bdf8] font-bold text-xs">sudo systemctl restart torrserver</code>
                    </div>
                    <button
                      onClick={() => copyToClipboard('sudo systemctl restart torrserver', 'restart')}
                      className="p-1.5 rounded-lg bg-[#1c1b18] hover:bg-[#2a2926] text-[#e6e3df] cursor-pointer"
                      title="Копировать"
                    >
                      {copiedCmd === 'restart' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-3 bg-[#0a0a09] border border-[#e6e3df]/10 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#e6e3df]/50">Смотреть логи бэкенда в реальном времени:</p>
                      <code className="text-[#38bdf8] font-bold text-xs">pm2 logs alexhd-backend</code>
                    </div>
                    <button
                      onClick={() => copyToClipboard('pm2 logs alexhd-backend', 'pm2')}
                      className="p-1.5 rounded-lg bg-[#1c1b18] hover:bg-[#2a2926] text-[#e6e3df] cursor-pointer"
                      title="Копировать"
                    >
                      {copiedCmd === 'pm2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Node Cards Grid */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                <span>Подключенные серверы TorrServer</span>
              </h3>

              <button
                onClick={() => setIsAddNodeOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#d4b581] hover:bg-[#e2c799] text-black rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(212,181,129,0.3)] self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить сервер</span>
              </button>
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
                        ? 'bg-[#0a0a09]/60 border-red-500/20 opacity-80'
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
                      {/* CPU */}
                      <div>
                        <div className="flex justify-between text-[11px] text-[#e6e3df]/70 mb-1">
                          <span className="flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-[#d4b581]" /> Нагрузка CPU
                          </span>
                          <span className={node.cpuUsage !== null ? "text-white" : "text-red-400 font-bold"}>
                            {node.cpuUsage !== null ? `${node.cpuUsage}%` : 'NONE'}
                          </span>
                        </div>
                        <div className="w-full bg-[#1c1b18] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${node.cpuUsage !== null ? 'bg-emerald-400' : 'bg-red-500/30'}`}
                            style={{ width: `${Math.max(5, node.cpuUsage || 0)}%` }}
                          />
                        </div>
                      </div>

                      {/* RAM */}
                      <div>
                        <div className="flex justify-between text-[11px] text-[#e6e3df]/70 mb-1">
                          <span className="flex items-center gap-1.5">
                            <HardDrive className="w-3.5 h-3.5 text-[#38bdf8]" /> Память RAM
                          </span>
                          <span className={node.ramUsage !== null ? "text-white" : "text-red-400 font-bold"}>
                            {node.ramUsage !== null ? `${node.ramUsage}%` : 'NONE'}
                          </span>
                        </div>
                        <div className="w-full bg-[#1c1b18] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${node.ramUsage !== null ? 'bg-[#38bdf8]' : 'bg-red-500/30'}`}
                            style={{ width: `${Math.max(10, node.ramUsage || 0)}%` }}
                          />
                        </div>
                      </div>

                      {/* Ping & Streams */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e6e3df]/5 text-[11px]">
                        <div>
                          <p className="text-[#e6e3df]/40 text-[9px]">ОТКЛИК (PING)</p>
                          <p className="font-bold flex items-center gap-1">
                            {isPinging ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-[#d4b581]" />
                            ) : node.pingMs !== null && node.pingMs > 0 ? (
                              <span className="text-white">{node.pingMs} ms</span>
                            ) : (
                              <span className="text-red-400">NONE</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#e6e3df]/40 text-[9px]">СТРИМОВ</p>
                          <p className={node.activeStreams > 0 ? "font-bold text-[#d4b581]" : "text-[#e6e3df]/40"}>
                            {isOnline ? node.activeStreams : 'NONE'}
                          </p>
                        </div>
                      </div>

                      {/* Error Banner when Offline or Error */}
                      {(!isOnline || node.lastError) && (
                        <div className="mt-2 p-2 bg-red-950/50 border border-red-500/40 rounded-lg text-[10px] text-red-300 font-mono flex items-center gap-1.5 animate-in fade-in">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span className="truncate">{node.lastError || 'Узел не отвечает / Данные отсутствуют'}</span>
                        </div>
                      )}
                    </div>

                    {/* Node Controls */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#e6e3df]/10">
                      <span className="text-[10px] font-mono text-[#e6e3df]/40 truncate max-w-[100px]">{node.version}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePingNode(node.id)}
                          title="Проверить отклик"
                          className="p-1.5 rounded-lg bg-[#1c1b18] hover:bg-[#2a2926] text-[#e6e3df] hover:text-[#d4b581] transition-all cursor-pointer"
                        >
                          <Radio className={`w-3.5 h-3.5 ${isPinging ? 'animate-ping text-[#d4b581]' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleFlushNode(node.id)}
                          title="Сбросить кэш узла"
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
                          title="Удалить узел"
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

          {/* Real-time System Diagnostic Logs Console */}
          <div className="p-6 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#e6e3df]/10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#d4b581]" />
                    <span>Системный журнал событий ({logStats.path})</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold">
                    LIVE LOG
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs text-[#e6e3df]/60 mt-1">
                  <span>Записей: <strong className="text-white">{logStats.totalLines}</strong></span>
                  <span>• Ошибок: <strong className="text-red-400">{logStats.errorCount}</strong></span>
                </div>
              </div>

              {/* Log Actions & Filters */}
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <input
                  type="text"
                  placeholder="Поиск в логах..."
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                  className="px-3 py-1.5 bg-[#171615] border border-[#e6e3df]/15 rounded-lg text-white placeholder-[#e6e3df]/40 outline-none text-xs w-40"
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
                </select>

                <button
                  onClick={handleSendTestLog}
                  title="Тест записи"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1b18] hover:bg-[#2a2926] border border-[#e6e3df]/15 rounded-lg text-white text-xs cursor-pointer transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Тест</span>
                </button>

                <button
                  onClick={handleDownloadLogs}
                  title="Скачать лог"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d4b581]/15 hover:bg-[#d4b581]/25 border border-[#d4b581]/40 rounded-lg text-[#d4b581] font-bold text-xs cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.log</span>
                </button>

                <button
                  onClick={handleClearLogs}
                  title="Очистить"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 rounded-lg text-red-400 text-xs cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Очистить</span>
                </button>
              </div>
            </div>

            {/* Console Log Rows */}
            <div className="font-mono text-xs space-y-2 max-h-80 overflow-y-auto pr-2 no-scrollbar">
              {filteredLogs.length === 0 ? (
                <div className="py-6 text-center text-[#e6e3df]/40 font-mono text-xs">
                  {logSearch ? 'Нет записей, соответствующих поиску' : 'Журнал чист. События стриминга и узлов сохраняются автоматически.'}
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
      {/* 2. TAB: CATALOG & TMDB METADATA MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
          {/* API Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Film className="w-5 h-5 text-[#d4b581]" />
                  <div>
                    <h4 className="text-xs font-bold text-white">TMDB Metadata API</h4>
                    <p className="text-[10px] text-[#e6e3df]/50">
                      {metadataStatus?.tmdb?.configured ? `Ключ: ${metadataStatus.tmdb.key_preview}` : 'Авторизован в ядре'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowKeyForm(!showKeyForm);
                      setKeyUpdateError(null);
                      setKeyUpdateSuccess(null);
                    }}
                    className="px-2.5 py-1 text-[10px] uppercase font-bold bg-[#171615] hover:bg-[#22211f] border border-[#e6e3df]/15 text-[#d4b581] rounded-lg cursor-pointer transition-all"
                  >
                    {showKeyForm ? 'Скрыть' : 'Изменить'}
                  </button>
                  <span className="flex items-center gap-1 text-emerald-400 text-[10px] uppercase font-bold bg-emerald-950/40 px-2 py-1 border border-emerald-500/30 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Активно
                  </span>
                </div>
              </div>

              {showKeyForm && (
                <form onSubmit={handleUpdateTMDBKey} className="mt-2 pt-3 border-t border-[#e6e3df]/10 space-y-2">
                  <div className="text-[10px] text-[#e6e3df]/60 mb-1 leading-normal">
                    Обновите API-ключ v3 (32-символьный hex) для синхронизации метаданных и поиска:
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Вставьте ваш TMDB API Key v3..."
                      value={tmdbKeyInput}
                      onChange={(e) => setTmdbKeyInput(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="flex-1 px-3 py-1.5 bg-[#171615] border border-[#e6e3df]/20 rounded-lg text-white text-[11px] outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isUpdatingKey}
                      className="px-3 py-1.5 bg-[#d4b581] hover:bg-[#c4a571] text-black font-bold text-[11px] rounded-lg cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {isUpdatingKey ? 'Проверка...' : 'Сохранить'}
                    </button>
                  </div>
                  {keyUpdateError && (
                    <div className="text-[10px] text-red-400 font-bold flex items-center gap-1 leading-normal">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /> {keyUpdateError}
                    </div>
                  )}
                  {keyUpdateSuccess && (
                    <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 leading-normal">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {keyUpdateSuccess}
                    </div>
                  )}
                </form>
              )}
            </div>

            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tv className="w-5 h-5 text-[#38bdf8]" />
                <div>
                  <h4 className="text-xs font-bold text-white">TorrServer P2P Scraper</h4>
                  <p className="text-[10px] text-[#e6e3df]/50">Парсинг magnet-потоков 4K / HDR</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-emerald-400 text-[10px] uppercase font-bold bg-emerald-950/40 px-2 py-1 border border-emerald-500/30 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" /> Готов
              </span>
            </div>

            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl space-y-4 col-span-1 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Параметры Prowlarr и TorrServer</h4>
                    <p className="text-[10px] text-[#e6e3df]/50">Настройки P2P-поисковика и адреса по умолчанию для воспроизведения</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsForm(!showSettingsForm)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-[#e6e3df]/20 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer transition-all"
                >
                  {showSettingsForm ? 'Скрыть' : 'Настроить'}
                </button>
              </div>

              {showSettingsForm && (
                <form onSubmit={handleUpdateSettings} className="space-y-3 pt-3 border-t border-[#e6e3df]/10 animate-[fadeIn_0.2s_ease-out]">
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-[#e6e3df]/60 font-bold uppercase block mb-1">Адрес TorrServer ноды (Default Node)</label>
                      <input
                        type="text"
                        placeholder="http://178.236.240.100:8090"
                        value={torrServerUrlInput}
                        onChange={(e) => setTorrServerUrlInput(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="w-full px-3 py-1.5 bg-[#171615] border border-[#e6e3df]/20 rounded-lg text-white text-[11px] outline-none font-mono"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-[#e6e3df]/60 font-bold uppercase block mb-1">Адрес Prowlarr URL</label>
                        <input
                          type="text"
                          placeholder="http://localhost:9696"
                          value={prowlarrUrlInput}
                          onChange={(e) => setProwlarrUrlInput(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="w-full px-3 py-1.5 bg-[#171615] border border-[#e6e3df]/20 rounded-lg text-white text-[11px] outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#e6e3df]/60 font-bold uppercase block mb-1">Prowlarr API Key</label>
                        <input
                          type="password"
                          placeholder="API Ключ Prowlarr..."
                          value={prowlarrKeyInput}
                          onChange={(e) => setProwlarrKeyInput(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="w-full px-3 py-1.5 bg-[#171615] border border-[#e6e3df]/20 rounded-lg text-white text-[11px] outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isUpdatingSettings}
                      className="px-4 py-2 bg-[#d4b581] hover:bg-[#c4a571] text-black font-bold text-[11px] rounded-lg cursor-pointer disabled:opacity-50 transition-all uppercase tracking-wider"
                    >
                      {isUpdatingSettings ? 'Сохранение...' : 'Сохранить настройки'}
                    </button>
                  </div>

                  {settingsUpdateError && (
                    <div className="text-[10px] text-red-400 font-bold flex items-center gap-1 leading-normal">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /> {settingsUpdateError}
                    </div>
                  )}
                  {settingsUpdateSuccess && (
                    <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 leading-normal">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {settingsUpdateSuccess}
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>

          {/* Sync Status Banner */}
          {syncStatus && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-emerald-300 font-mono text-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>{syncStatus}</span>
            </div>
          )}

          {/* TMDB & TVDB Refresh & Progress Panel */}
          <div className="p-6 bg-[#0f0e0d] border border-[#d4b581]/30 rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <RefreshCw className={`w-5 h-5 text-[#d4b581] ${syncProgress.isSyncing ? 'animate-spin' : ''}`} />
                  <span>Обновление API TMDB и TVDB</span>
                </h3>
                <p className="text-xs text-[#e6e3df]/60 mt-1">
                  Загрузка трендов, новинок, описаний и подробной диагностики подсоединения к внешним API.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCheckApisOnly}
                  disabled={syncProgress.isSyncing}
                  className="px-3 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider bg-[#1c1b18] hover:bg-[#282622] text-[#e6e3df] border border-[#e6e3df]/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Быстрая диагностика без запуска полного импорта"
                >
                  <Activity className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Проверить API</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerSync}
                  disabled={syncProgress.isSyncing}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                    syncProgress.isSyncing
                      ? 'bg-[#1c1b18] text-[#e6e3df]/40 border border-[#e6e3df]/10 cursor-not-allowed'
                      : 'bg-[#d4b581] hover:bg-[#c3a470] text-black shadow-lg shadow-[#d4b581]/20 active:scale-95'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${syncProgress.isSyncing ? 'animate-spin' : ''}`} />
                  <span>{syncProgress.isSyncing ? 'Синхронизация...' : 'Обновить API TMDB и TVDB'}</span>
                </button>
              </div>
            </div>

            {/* Live Progress Indicator */}
            {(syncProgress.isSyncing || syncProgress.progressPercent > 0) && (
              <div className="space-y-3 pt-3 border-t border-[#e6e3df]/10 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#d4b581] font-semibold flex items-center gap-2">
                    {syncProgress.isSyncing && <span className="w-2 h-2 rounded-full bg-[#d4b581] animate-ping" />}
                    <span>{syncProgress.currentStep}</span>
                  </span>
                  <span className="text-white font-bold text-sm ml-2">{syncProgress.progressPercent}%</span>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full bg-[#1c1b18] h-3.5 rounded-full overflow-hidden border border-[#e6e3df]/10 relative">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#d4b581] via-[#e5c793] to-[#38bdf8] transition-all duration-300 relative"
                    style={{ width: `${Math.max(3, syncProgress.progressPercent)}%` }}
                  >
                    {syncProgress.isSyncing && (
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-[#e6e3df]/60 gap-2 pt-1 border-t border-[#e6e3df]/5">
                  <div>
                    Добавлено элементов: <span className="text-emerald-400 font-bold">{syncProgress.itemsAdded}</span>
                  </div>
                  <div>
                    Всего в каталоге: <span className="text-[#d4b581] font-bold">{syncProgress.totalCatalogCount || metaResults.length || 0}</span>
                  </div>
                  {syncProgress.lastSyncTimestamp && (
                    <div>
                      Время обновления: <span className="text-[#e6e3df]/40">{new Date(syncProgress.lastSyncTimestamp).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>

                {syncProgress.error && (
                  <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Ошибка синхронизации: {syncProgress.error}</span>
                  </div>
                )}
              </div>
            )}

            {/* API Health Reports Grid (Explicit indication of working / non-working APIs) */}
            {syncProgress.apiReports && syncProgress.apiReports.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-[#e6e3df]/10 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#d4b581] font-bold uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#38bdf8]" />
                    <span>Диагностический отчет API ({syncProgress.apiReports.length} провайдеров)</span>
                  </span>

                  {syncProgress.apiReports.some(r => r.status === 'error') ? (
                    <span className="px-2.5 py-1 bg-red-950/80 border border-red-500/60 text-red-400 rounded-lg text-[10px] font-bold flex items-center gap-1.5 animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Обнаружены неработающие API!
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Все API работают
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {syncProgress.apiReports.map((report, idx) => {
                    const isOk = report.status === 'ok';
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border font-mono transition-all ${
                          isOk
                            ? 'bg-[#121110] border-emerald-500/30 text-emerald-200'
                            : 'bg-red-950/40 border-red-500/70 text-red-200 shadow-lg shadow-red-950/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            {isOk ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <h5 className="text-xs font-bold text-white leading-snug">{report.name}</h5>
                              {report.details && (
                                <span className="text-[10px] text-[#e6e3df]/40 block mt-0.5">{report.details}</span>
                              )}
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase shrink-0 ${
                              isOk
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-red-500/30 text-red-300 border border-red-500/60'
                            }`}
                          >
                            {isOk ? `OK (${report.pingMs ?? 0}ms)` : 'НЕ РАБОТАЕТ'}
                          </span>
                        </div>

                        {!isOk && report.error && (
                          <div className="mt-2.5 p-2 bg-red-950/90 border border-red-500/50 rounded-lg text-[11px] text-red-200 flex items-start gap-1.5 leading-snug">
                            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-red-300">Причина: </span>
                              <span>{report.error}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Search External Catalog Form */}
          <div className="p-6 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-[#d4b581]" />
              <span>Поиск и импорт фильмов / сериалов из базы TMDB</span>
            </h3>

            <form onSubmit={handleMetadataSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Введите название фильма (Оппенгеймер, Матрица, Дюна)..."
                value={metaSearchQuery}
                onChange={e => setMetaSearchQuery(e.target.value)}
                onKeyDown={e => e.stopPropagation()}
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
                        + Добавить в каталог
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
              <span>Прямое добавление HLS потока или Magnet-ссылки</span>
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
                    onKeyDown={e => e.stopPropagation()}
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
                <label className="text-[#e6e3df]/60 block mb-1">Ссылка на поток (HLS m3u8 или magnet):</label>
                <input
                  type="text"
                  required
                  placeholder="https://.../stream.m3u8 или magnet:?xt=urn:btih:..."
                  value={manualStream}
                  onChange={e => setManualStream(e.target.value)}
                  onKeyDown={e => e.stopPropagation()}
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
                  onKeyDown={e => e.stopPropagation()}
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
      {/* 3. TAB: USER & ACCESS MANAGEMENT */}
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
              <span className="text-xs text-[#e6e3df]/50">АДМИНИСТРАТОРЫ</span>
              <p className="text-2xl font-bold text-[#d4b581] mt-1">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <div className="p-4 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl">
              <span className="text-xs text-[#e6e3df]/50">SMART TV УСТРОЙСТВ</span>
              <p className="text-2xl font-bold text-[#38bdf8] mt-1">
                {users.reduce((acc, u) => acc + (u.connected_devices_count || 1), 0)}
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
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value)}
                className="px-3 py-2.5 bg-[#171615] border border-[#e6e3df]/15 rounded-xl text-white outline-none text-xs cursor-pointer"
              >
                <option value="all">Все роли</option>
                <option value="user">Пользователь</option>
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
                    <th className="py-3.5 px-4">Устройства</th>
                    <th className="py-3.5 px-4">Статус</th>
                    <th className="py-3.5 px-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e3df]/5">
                  {filteredUsers.map(u => (
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
                              : 'bg-white/5 text-[#e6e3df]/70 border-white/10'
                          }`}
                        >
                          {u.role === 'admin' ? 'Админ' : 'Пользователь'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className="text-white font-bold">{u.connected_devices_count || 1}</span>
                        <span className="text-[#e6e3df]/40"> привязано</span>
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
                            setEditModalTab('role');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#1c1b18] hover:bg-[#d4b581] hover:text-black border border-[#e6e3df]/15 font-mono text-xs font-bold transition-all cursor-pointer"
                        >
                          Настройки
                        </button>
                      </td>
                    </tr>
                  ))}
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
                    Smart TV Устройства
                  </button>
                </div>

                {/* Edit Tab: Role & Security */}
                {editModalTab === 'role' && (
                  <div className="space-y-4 font-mono text-xs">
                    <div>
                      <label className="text-[#e6e3df]/60 block mb-2 font-bold uppercase">Уровень доступа (Роль):</label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['user', 'admin'] as UserRole[]).map(roleId => {
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
                              {roleId === 'admin' ? 'Администратор' : 'Пользователь'}
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
                        <p className="text-[11px] text-[#e6e3df]/50">Полное удаление профиля</p>
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

                {/* Edit Tab: Devices */}
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
                        Сбросить устройства
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

      {/* 4. TAB: INSTALLATION & DEPLOYMENT GUIDE */}
      {activeTab === 'guide' && <InstallationGuideTab />}

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
