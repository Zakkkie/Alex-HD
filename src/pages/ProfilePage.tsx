import React, { useState, useEffect } from 'react';
import { UserProfile, TorrServerStatus, SubscriptionPlanId } from '../types';
import { 
  User, Tv, Radio, Cpu, Sliders, ShieldAlert, KeyRound, 
  Settings, CheckCircle2, Lock, Sparkles, RefreshCw, Smartphone,
  Server, HardDrive, Wifi, ShieldCheck, DownloadCloud, Play, Globe, Check,
  CreditCard, Zap, Shield, ChevronRight, AlertCircle, ArrowUpRight, Star
} from 'lucide-react';
import { api } from '../api/client';
import { adminStore, SUBSCRIPTION_PLANS } from '../data/adminStore';

interface ProfilePageProps {
  user: UserProfile;
  onUserUpdate?: (updated: UserProfile) => void;
  onLogout?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUserUpdate, onLogout }) => {
  // Active Profile Tab
  const [activeTab, setActiveTab] = useState<'plans' | 'playback' | 'torrserver' | 'devices' | 'security'>('plans');

  // Current User Plan and Role State
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('alexhd_current_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      id: user.id || 'usr-admin-01',
      username: user.username || 'alex_admin',
      displayName: user.displayName || 'Алексей (Администратор)',
      email: user.email || 'admin@smarttv.com',
      role: user.role || 'admin',
      plan: user.plan || '4k',
      subscription_expires_at: user.subscription_expires_at || new Date(Date.now() + 365 * 86400000).toISOString(),
      connected_devices_count: 3,
      isSubscribed: true
    };
  });

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!localStorage.getItem('tv_access_token') || localStorage.getItem('demo_logged_in') !== 'false';
  });

  // Checkout modal state for subscription plan upgrade
  const [selectedPlanForPurchase, setSelectedPlanForPurchase] = useState<SubscriptionPlanId | null>(null);
  const [purchaseMonths, setPurchaseMonths] = useState<number>(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'sbp' | 'mir' | 'card' | 'tpay' | 'crypto'>('sbp');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);

  // Settings state
  const [subtitleSize, setSubtitleSize] = useState<number>(() => {
    return Number(localStorage.getItem('setting_subtitle_size')) || 18;
  });
  const [autoplayNext, setAutoplayNext] = useState<boolean>(() => {
    return localStorage.getItem('setting_autoplay_next') !== 'false';
  });
  const [defaultAudio, setDefaultAudio] = useState<string>(() => {
    return localStorage.getItem('setting_default_audio') || 'ru';
  });
  const [playerEngine, setPlayerEngine] = useState<string>(() => {
    return localStorage.getItem('setting_player_engine') || 'cinema_hls';
  });
  const [animationSpeed, setAnimationSpeed] = useState<string>(() => {
    return localStorage.getItem('setting_animation_speed') || 'normal';
  });
  const [isSaved, setIsSaved] = useState(false);

  // TorrServer & Cluster state
  const [torrServerUrl, setTorrServerUrl] = useState<string>(() => {
    return localStorage.getItem('setting_torrserver_url') || 'http://localhost:8090';
  });
  const [streamingMode, setStreamingMode] = useState<string>(() => {
    return localStorage.getItem('setting_streaming_mode') || 'direct_torrserver';
  });
  const [torrStatus, setTorrStatus] = useState<TorrServerStatus | null>(null);
  const [isTestingTorr, setIsTestingTorr] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('alexhd_current_profile', JSON.stringify(currentUser));
    if (onUserUpdate) onUserUpdate(currentUser);
  }, [currentUser, onUserUpdate]);

  // Check TorrServer on initial load
  useEffect(() => {
    handleTestTorrServer(torrServerUrl, false);
  }, []);

  const handleTestTorrServer = async (urlToTest: string, showToast = true) => {
    setIsTestingTorr(true);
    setTestResult(null);
    try {
      const res = await api.testTorrServer(urlToTest);
      setTorrStatus(res);
      if (showToast) {
        setTestResult(`Подключено! Версия: ${res.version} • Задержка: ${res.latencyMs}ms`);
        setTimeout(() => setTestResult(null), 4000);
      }
    } catch (err: any) {
      if (showToast) {
        setTestResult(`Ошибка подключения к ${urlToTest}`);
        setTimeout(() => setTestResult(null), 4000);
      }
    } finally {
      setIsTestingTorr(false);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('setting_subtitle_size', subtitleSize.toString());
    localStorage.setItem('setting_autoplay_next', autoplayNext.toString());
    localStorage.setItem('setting_default_audio', defaultAudio);
    localStorage.setItem('setting_player_engine', playerEngine);
    localStorage.setItem('setting_animation_speed', animationSpeed);
    localStorage.setItem('setting_torrserver_url', torrServerUrl);
    localStorage.setItem('setting_streaming_mode', streamingMode);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Subscription Checkout Flow
  const handleConfirmPurchase = () => {
    if (!selectedPlanForPurchase) return;
    setIsProcessingPayment(true);

    setTimeout(() => {
      adminStore.recordPayment(currentUser.id, selectedPlanForPurchase, selectedPaymentMethod, purchaseMonths);

      const updatedExp = new Date(Date.now() + purchaseMonths * 30 * 86400000).toISOString();
      const updatedProfile: UserProfile = {
        ...currentUser,
        plan: selectedPlanForPurchase,
        subscription_expires_at: selectedPlanForPurchase === 'standard' ? null : updatedExp,
        isSubscribed: selectedPlanForPurchase !== 'standard'
      };

      setCurrentUser(updatedProfile);
      setIsProcessingPayment(false);
      setSelectedPlanForPurchase(null);
      setPaymentSuccessMessage(`Подписка "${SUBSCRIPTION_PLANS[selectedPlanForPurchase].name}" успешно активирована!`);
      setTimeout(() => setPaymentSuccessMessage(null), 5000);
    }, 1200);
  };

  // Role Switcher for quick testing Admin features
  const handleSwitchAccountRole = (targetRole: 'admin' | 'user') => {
    if (targetRole === 'admin') {
      const adminProfile: UserProfile = {
        id: 'usr-admin-01',
        username: 'alex_admin',
        displayName: 'Алексей (Администратор)',
        email: 'admin@smarttv.com',
        role: 'admin',
        plan: '4k',
        subscription_expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
        connected_devices_count: 3,
        isSubscribed: true
      };
      setCurrentUser(adminProfile);
    } else {
      const userProfile: UserProfile = {
        id: 'usr-user-04',
        username: 'dmitry_p',
        displayName: 'Дмитрий Панов (Пользователь)',
        email: 'dmitriy.panov@mail.ru',
        role: 'user',
        plan: 'standard',
        subscription_expires_at: null,
        connected_devices_count: 1,
        isSubscribed: false
      };
      setCurrentUser(userProfile);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tv_access_token');
    localStorage.setItem('demo_logged_in', 'false');
    setIsLoggedIn(false);
    if (onLogout) onLogout();
  };

  const currentPlanObj = SUBSCRIPTION_PLANS[currentUser.plan || 'standard'];

  return (
    <div className="pb-16 pt-4 text-[#e6e3df] max-w-6xl mx-auto space-y-8 font-sans">
      {/* -------------------- LOGGED IN VIEW -------------------- */}
      {isLoggedIn && (
        <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
          {/* Top Profile Header Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-3xl shadow-xl">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4b581]/30 to-[#d4b581]/5 border border-[#d4b581]/40 flex items-center justify-center text-[#d4b581] shrink-0 shadow-[0_0_20px_rgba(212,181,129,0.2)]">
                <User className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-serif text-3xl font-bold tracking-tight text-white">
                    {currentUser.displayName || currentUser.username}
                  </h1>
                  <span
                    className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border"
                    style={{
                      backgroundColor: `${currentPlanObj.color}20`,
                      borderColor: `${currentPlanObj.color}50`,
                      color: currentPlanObj.color
                    }}
                  >
                    {currentPlanObj.name}
                  </span>
                  {currentUser.role === 'admin' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-[10px] font-bold">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs text-[#e6e3df]/70 mt-1 flex flex-wrap items-center gap-2">
                  <span>{currentUser.email}</span>
                  <span>•</span>
                  <span>Лимит: {currentPlanObj.maxDevices} устр.</span>
                  <span>•</span>
                  <span>Качество: {currentPlanObj.maxResolutionLabel}</span>
                </p>
              </div>
            </div>

            {/* Switch Demo Role & Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center bg-[#171615] border border-[#e6e3df]/15 rounded-xl p-1 font-mono text-xs">
                <span className="px-2 text-[10px] text-[#e6e3df]/50">Режим:</span>
                <button
                  onClick={() => handleSwitchAccountRole('admin')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    currentUser.role === 'admin'
                      ? 'bg-[#d4b581] text-black shadow-sm'
                      : 'text-[#e6e3df]/70 hover:text-white'
                  }`}
                >
                  Администратор
                </button>
                <button
                  onClick={() => handleSwitchAccountRole('user')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    currentUser.role === 'user'
                      ? 'bg-[#38bdf8] text-black shadow-sm'
                      : 'text-[#e6e3df]/70 hover:text-white'
                  }`}
                >
                  Обычный юзер
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition rounded-xl font-mono text-xs uppercase cursor-pointer"
              >
                Выйти
              </button>
            </div>
          </div>

          {/* Payment Success Toast */}
          {paymentSuccessMessage && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-emerald-300 font-mono text-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>{paymentSuccessMessage}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
            {[
              { id: 'plans', label: 'Тарифы и Подписка (3 плана)', icon: CreditCard },
              { id: 'playback', label: 'Воспроизведение и Плеер', icon: Sliders },
              { id: 'torrserver', label: 'Серверы и TorrServer', icon: Server },
              { id: 'devices', label: `Устройства (${currentUser.connected_devices_count || 1}/${currentPlanObj.maxDevices})`, icon: Tv },
              { id: 'security', label: 'Безопасность', icon: ShieldCheck }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition cursor-pointer ${
                    isActive
                      ? 'bg-[#d4b581] text-black shadow-lg shadow-[#d4b581]/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* TAB: PLANS & SUBSCRIPTION COMPARISON */}
          {/* ========================================================================= */}
          {activeTab === 'plans' && (
            <div className="space-y-8 animate-[fadeIn_0.2s_ease-out]">
              {/* Active Subscription Status Banner */}
              <div className="p-6 bg-gradient-to-r from-[#171615] via-[#121110] to-[#1a1916] border border-[#d4b581]/30 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#d4b581]" />
                    <span className="font-mono text-xs uppercase tracking-widest text-[#d4b581] font-bold">
                      ТЕКУЩИЙ ТАРИФНЫЙ ПЛАН
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-3">
                    <span>{currentPlanObj.name}</span>
                    <span className="text-sm font-mono font-normal text-[#e6e3df]/60">
                      ({currentPlanObj.period})
                    </span>
                  </h3>
                  <p className="font-mono text-xs text-[#e6e3df]/70">
                    {currentUser.plan === 'standard' ? (
                      'Базовый бесплатный доступ (до 720p HD на 1 устройстве)'
                    ) : currentUser.subscription_expires_at ? (
                      <>
                        Активна до:{' '}
                        <span className="text-emerald-400 font-bold">
                          {new Date(currentUser.subscription_expires_at).toLocaleDateString('ru-RU')}
                        </span>{' '}
                        • Безлимитный стриминг
                      </>
                    ) : (
                      'Бессрочная VIP-подписка'
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {currentUser.plan !== '4k' ? (
                    <button
                      onClick={() => setSelectedPlanForPurchase('4k')}
                      className="px-6 py-3 bg-[#d4b581] hover:bg-[#c4a571] text-black font-mono text-xs font-bold uppercase rounded-xl shadow-[0_0_20px_rgba(212,181,129,0.3)] transition-all cursor-pointer"
                    >
                      Перейти на 4K Ultra (349 ₽)
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedPlanForPurchase('4k')}
                      className="px-5 py-2.5 bg-[#1c1b18] hover:bg-[#282724] border border-[#d4b581]/40 text-[#d4b581] font-mono text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Продлить подписку
                    </button>
                  )}
                </div>
              </div>

              {/* 3 Plans Comparison Grid */}
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h2 className="font-serif text-2xl font-bold text-white">Тарифные планы Alex HD</h2>
                  <p className="text-xs font-mono text-[#e6e3df]/60">
                    Выберите оптимальный план для ваших домашних Smart TV устройств
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  {/* Plan 1: Standard (0 RUB) */}
                  <div
                    className={`p-6 rounded-3xl border flex flex-col justify-between transition-all ${
                      currentUser.plan === 'standard'
                        ? 'bg-[#121110] border-[#9e9e9e] ring-1 ring-[#9e9e9e]/50'
                        : 'bg-[#0f0e0d] border-[#e6e3df]/10 hover:border-[#e6e3df]/30'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold uppercase text-[#9e9e9e]">Базовый</span>
                        {currentUser.plan === 'standard' && (
                          <span className="px-2 py-0.5 bg-white/10 text-white rounded-full font-mono text-[10px] font-bold">
                            ВАШ ТЕКУЩИЙ
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-serif text-2xl font-bold text-white">Стандарт</h3>
                        <p className="text-3xl font-mono font-bold text-white mt-2">
                          0 ₽ <span className="text-xs text-[#e6e3df]/50 font-normal">/ навсегда</span>
                        </p>
                      </div>

                      <div className="space-y-2 py-4 border-y border-[#e6e3df]/10 font-mono text-xs">
                        <div className="flex items-center justify-between text-[#e6e3df]/80">
                          <span>Качество видео:</span>
                          <span className="font-bold text-white">до 720p HD</span>
                        </div>
                        <div className="flex items-center justify-between text-[#e6e3df]/80">
                          <span>Подключений:</span>
                          <span className="font-bold text-white">1 устройство</span>
                        </div>
                        <div className="flex items-center justify-between text-[#e6e3df]/80">
                          <span>Звук:</span>
                          <span className="text-white">Стерео 2.0</span>
                        </div>
                        <div className="flex items-center justify-between text-[#e6e3df]/80">
                          <span>CDN Маршрут:</span>
                          <span className="text-[#e6e3df]/50">Базовый</span>
                        </div>
                      </div>

                      <ul className="space-y-2 text-xs text-[#e6e3df]/70">
                        {SUBSCRIPTION_PLANS.standard.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleConfirmPurchase()}
                      disabled={currentUser.plan === 'standard'}
                      className={`w-full mt-6 py-3 rounded-xl font-mono text-xs font-bold uppercase transition cursor-pointer ${
                        currentUser.plan === 'standard'
                          ? 'bg-white/5 text-[#e6e3df]/40 cursor-default'
                          : 'bg-[#1c1b18] hover:bg-[#252422] text-white border border-[#e6e3df]/20'
                      }`}
                    >
                      {currentUser.plan === 'standard' ? 'Текущий план' : 'Выбрать Стандарт'}
                    </button>
                  </div>

                  {/* Plan 2: HD (179 RUB) */}
                  <div
                    className={`p-6 rounded-3xl border flex flex-col justify-between relative transition-all ${
                      currentUser.plan === 'hd'
                        ? 'bg-[#0e161c] border-[#38bdf8] ring-2 ring-[#38bdf8]/40 shadow-[0_0_30px_rgba(56,189,248,0.15)]'
                        : 'bg-[#0f0e0d] border-[#38bdf8]/30 hover:border-[#38bdf8]/70'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold uppercase text-[#38bdf8]">
                          ПОПУЛЯРНЫЙ
                        </span>
                        {currentUser.plan === 'hd' && (
                          <span className="px-2 py-0.5 bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40 rounded-full font-mono text-[10px] font-bold">
                            ВАШ ТЕКУЩИЙ
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-serif text-2xl font-bold text-white">Доступ HD</h3>
                        <p className="text-3xl font-mono font-bold text-[#38bdf8] mt-2">
                          179 ₽ <span className="text-xs text-[#e6e3df]/50 font-normal">/ месяц</span>
                        </p>
                      </div>

                      <div className="space-y-2 py-4 border-y border-[#e6e3df]/10 font-mono text-xs">
                        <div className="flex items-center justify-between text-[#e6e3df]/80">
                          <span>Качество видео:</span>
                          <span className="font-bold text-[#38bdf8]">1080p Full HD (60 fps)</span>
                        </div>
                        <div className="flex items-center justify-between text-[#e6e3df]/80">
                          <span>Подключений:</span>
                          <span className="font-bold text-white">до 3 устройств</span>
                        </div>
                        <div className="flex items-center justify-between text-[#e6e3df]/80">
                          <span>Звук:</span>
                          <span className="text-white">Dolby Digital 5.1</span>
                        </div>
                        <div className="flex items-center justify-between text-[#e6e3df]/80">
                          <span>Буфер TorrServer:</span>
                          <span className="text-[#38bdf8]">Приоритетный 128 MB</span>
                        </div>
                      </div>

                      <ul className="space-y-2 text-xs text-[#e6e3df]/80">
                        {SUBSCRIPTION_PLANS.hd.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => setSelectedPlanForPurchase('hd')}
                      className={`w-full mt-6 py-3 rounded-xl font-mono text-xs font-bold uppercase transition cursor-pointer ${
                        currentUser.plan === 'hd'
                          ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40 hover:bg-[#38bdf8]/30'
                          : 'bg-[#38bdf8] hover:bg-[#259ed4] text-black shadow-lg shadow-[#38bdf8]/20'
                      }`}
                    >
                      {currentUser.plan === 'hd' ? 'Продлить Доступ HD' : 'Оформить HD за 179 ₽'}
                    </button>
                  </div>

                  {/* Plan 3: 4K Ultra VIP (349 RUB) */}
                  <div
                    className={`p-6 rounded-3xl border flex flex-col justify-between relative transition-all ${
                      currentUser.plan === '4k'
                        ? 'bg-[#17140f] border-[#d4b581] ring-2 ring-[#d4b581]/50 shadow-[0_0_35px_rgba(212,181,129,0.25)]'
                        : 'bg-[#0f0e0d] border-[#d4b581]/40 hover:border-[#d4b581]'
                    }`}
                  >
                    <div className="absolute -top-3.5 right-6 px-3 py-1 bg-gradient-to-r from-[#d4b581] to-[#e2c694] text-black font-mono text-[10px] font-bold uppercase rounded-full shadow-md flex items-center gap-1">
                      <Star className="w-3 h-3 fill-black" /> МАКСИМАЛЬНЫЙ VIP
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold uppercase text-[#d4b581]">
                          ULTRA 4K HDR
                        </span>
                        {currentUser.plan === '4k' && (
                          <span className="px-2 py-0.5 bg-[#d4b581]/20 text-[#d4b581] border border-[#d4b581]/40 rounded-full font-mono text-[10px] font-bold">
                            ВАШ ТЕКУЩИЙ
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-serif text-2xl font-bold text-white">Доступ 4K Ultra</h3>
                        <p className="text-3xl font-mono font-bold text-[#d4b581] mt-2">
                          349 ₽ <span className="text-xs text-[#e6e3df]/50 font-normal">/ месяц</span>
                        </p>
                      </div>

                      <div className="space-y-2 py-4 border-y border-[#e6e3df]/10 font-mono text-xs">
                        <div className="flex items-center justify-between text-[#e6e3df]/80">
                          <span>Качество видео:</span>
                          <span className="font-bold text-[#d4b581]">4K HDR10+ / Dolby Vision</span>
                        </div>
                        <div className="flex items-center justify-between text-[#e6e3df]/80">
                          <span>Подключений:</span>
                          <span className="font-bold text-[#d4b581]">до 5 устройств</span>
                        </div>
                        <div className="flex items-center justify-between text-[#e6e3df]/80">
                          <span>Звук:</span>
                          <span className="text-white">Dolby Atmos 7.1 Surround</span>
                        </div>
                        <div className="flex items-center justify-between text-[#e6e3df]/80">
                          <span>Стриминг:</span>
                          <span className="text-[#d4b581]">Выделенный CDN узел (1 Gbps)</span>
                        </div>
                      </div>

                      <ul className="space-y-2 text-xs text-[#e6e3df]/80">
                        {SUBSCRIPTION_PLANS['4k'].features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-[#d4b581] shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => setSelectedPlanForPurchase('4k')}
                      className={`w-full mt-6 py-3 rounded-xl font-mono text-xs font-bold uppercase transition cursor-pointer ${
                        currentUser.plan === '4k'
                          ? 'bg-[#d4b581]/20 text-[#d4b581] border border-[#d4b581]/40 hover:bg-[#d4b581]/30'
                          : 'bg-[#d4b581] hover:bg-[#c4a571] text-black shadow-lg shadow-[#d4b581]/30'
                      }`}
                    >
                      {currentUser.plan === '4k' ? 'Продлить Доступ 4K' : 'Оформить 4K за 349 ₽'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Checkout / Payment Modal */}
              {selectedPlanForPurchase && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                  <div className="bg-[#121110] border border-[#d4b581]/40 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-[scaleIn_0.2s_ease-out]">
                    <div className="flex items-center justify-between pb-3 border-b border-[#e6e3df]/10">
                      <div>
                        <h3 className="font-serif text-xl font-bold text-white">Оформление подписки</h3>
                        <p className="font-mono text-xs text-[#d4b581]">
                          Тариф: {SUBSCRIPTION_PLANS[selectedPlanForPurchase].name}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedPlanForPurchase(null)}
                        className="text-[#e6e3df]/40 hover:text-white font-mono text-sm px-2 py-1 rounded-lg bg-[#1c1b18] cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Period Selector */}
                    <div className="space-y-2 font-mono text-xs">
                      <label className="text-[#e6e3df]/60 font-bold uppercase block">Период подписки:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { months: 1, label: '1 месяц', discount: '' },
                          { months: 3, label: '3 месяца', discount: '-10%' },
                          { months: 12, label: '1 год', discount: '-25%' }
                        ].map(per => (
                          <button
                            key={per.months}
                            onClick={() => setPurchaseMonths(per.months)}
                            className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                              purchaseMonths === per.months
                                ? 'bg-[#d4b581] text-black font-bold'
                                : 'bg-[#171615] border-[#e6e3df]/10 text-[#e6e3df]/70 hover:border-[#e6e3df]/30'
                            }`}
                          >
                            <p>{per.label}</p>
                            {per.discount && (
                              <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                                {per.discount}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payment Gateway Options */}
                    <div className="space-y-2 font-mono text-xs">
                      <label className="text-[#e6e3df]/60 font-bold uppercase block">Способ оплаты:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'sbp', label: 'СБП (QR-код)' },
                          { id: 'mir', label: 'Карта МИР' },
                          { id: 'tpay', label: 'T-Pay' },
                          { id: 'card', label: 'Visa / Mastercard' },
                          { id: 'crypto', label: 'USDT (TRC20 / TON)' }
                        ].map(m => (
                          <button
                            key={m.id}
                            onClick={() => setSelectedPaymentMethod(m.id as any)}
                            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2 ${
                              selectedPaymentMethod === m.id
                                ? 'bg-[#d4b581]/20 border-[#d4b581] text-white font-bold'
                                : 'bg-[#171615] border-[#e6e3df]/10 text-[#e6e3df]/60 hover:border-[#e6e3df]/30'
                            }`}
                          >
                            <CreditCard className="w-3.5 h-3.5 text-[#d4b581]" />
                            <span>{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Total Amount & Submit */}
                    <div className="p-4 bg-[#171615] rounded-2xl border border-[#e6e3df]/10 flex items-center justify-between font-mono">
                      <div>
                        <span className="text-xs text-[#e6e3df]/50">Итого к оплате:</span>
                        <p className="text-2xl font-bold text-emerald-400">
                          {SUBSCRIPTION_PLANS[selectedPlanForPurchase].priceRub * purchaseMonths} ₽
                        </p>
                      </div>

                      <button
                        onClick={handleConfirmPurchase}
                        disabled={isProcessingPayment}
                        className="px-6 py-3 bg-[#d4b581] hover:bg-[#c4a571] text-black font-bold text-xs uppercase rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(212,181,129,0.3)]"
                      >
                        {isProcessingPayment ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Проведение транзакции...</span>
                          </>
                        ) : (
                          <span>Оплатить и подключить</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: PLAYBACK & INTERFACE */}
          {/* ========================================================================= */}
          {activeTab === 'playback' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6 bg-[#0f0e0d] border border-[#e6e3df]/10 p-6 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-2 pb-3 border-b border-[#e6e3df]/10">
                  <Sliders className="w-5 h-5 text-[#d4b581]" />
                  <h2 className="text-lg font-serif font-bold text-white">Параметры плеера и декодирования</h2>
                </div>

                {/* Engine Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-300 font-bold uppercase">
                    Движок видеоплеера
                  </label>
                  <select
                    value={playerEngine}
                    onChange={(e) => setPlayerEngine(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-[#d4b581] transition"
                  >
                    <option value="cinema_hls" className="bg-slate-900 text-white">
                      Cinema HLS Hardware Core (Tizen Native / webOS Native AVPlay)
                    </option>
                    <option value="videojs_adaptive" className="bg-slate-900 text-white">
                      VideoJS Adaptive Multi-Bitrate (Low Memory)
                    </option>
                    <option value="dash_4k" className="bg-slate-900 text-white">
                      MPEG-DASH 4K Ultra Engine (High Bitrate 60+ Mbps)
                    </option>
                  </select>
                </div>

                {/* Subtitle Size Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300 font-bold uppercase">Размер субтитров</span>
                    <span className="text-[#d4b581] font-bold">{subtitleSize} px</span>
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="32"
                    value={subtitleSize}
                    onChange={(e) => setSubtitleSize(Number(e.target.value))}
                    className="w-full accent-[#d4b581] cursor-pointer"
                  />
                </div>

                {/* Default Audio Track */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-300 font-bold uppercase">
                    Язык аудиодорожки по умолчанию
                  </label>
                  <select
                    value={defaultAudio}
                    onChange={(e) => setDefaultAudio(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-[#d4b581] transition"
                  >
                    <option value="ru" className="bg-slate-900 text-white">Русский (Дубляж / Закадровый 5.1)</option>
                    <option value="en" className="bg-slate-900 text-white">English (Original Audio Dolby Atmos)</option>
                  </select>
                </div>

                {/* Autoplay toggle */}
                <div className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-white">Автовоспроизведение следующей серии</p>
                    <p className="text-[11px] text-slate-400">Автоматический переход через 10 секунд после титров</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoplayNext}
                    onChange={(e) => setAutoplayNext(e.target.checked)}
                    className="w-5 h-5 accent-[#d4b581] cursor-pointer"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    className="px-6 py-2.5 bg-[#d4b581] text-black hover:bg-[#e2c694] transition rounded-xl font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    {isSaved ? 'Настройки сохранены!' : 'Сохранить настройки'}
                  </button>
                </div>
              </div>

              {/* Hardware Spec Card */}
              <div className="space-y-4">
                <div className="p-6 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl space-y-4 shadow-xl">
                  <h3 className="font-mono text-xs font-bold text-[#d4b581] flex items-center gap-2 uppercase tracking-wider">
                    <Cpu className="w-4 h-4" />
                    Аппаратный профиль Smart TV
                  </h3>

                  <div className="space-y-2.5 text-xs font-mono">
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-slate-400">ПЛАТФОРМА:</span>
                      <span className="text-white font-bold">Media Station X / Tizen</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-slate-400">РАЗРЕШЕНИЕ:</span>
                      <span className="text-emerald-400 font-bold">{currentPlanObj.maxResolutionLabel}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-slate-400">ДЕКОДЕР:</span>
                      <span className="text-[#d4b581] font-bold">HEVC / H.265 Main 10</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl space-y-3">
                  <h3 className="font-mono text-xs font-bold text-[#d4b581] flex items-center gap-2 uppercase tracking-wider">
                    <Radio className="w-4 h-4" />
                    Media Station X (MSX)
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    URL-адрес для быстрого запуска портала на телевизоре через Media Station X:
                  </p>
                  <div className="p-2.5 bg-black/60 border border-white/10 rounded-xl font-mono text-[11px] text-[#d4b581] select-all break-all">
                    http://alexhd.cloud/msx/start.json
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: TORRSERVER & CLUSTER */}
          {/* ========================================================================= */}
          {activeTab === 'torrserver' && (
            <div className="space-y-6">
              <div className="bg-[#0f0e0d] border border-[#e6e3df]/10 p-6 rounded-2xl shadow-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                      <DownloadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Интеграция с TorrServer & BitTorrent</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Прямая трансляция торрентов без предварительного скачивания с мгновенной предзагрузкой
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTestTorrServer(torrServerUrl, true)}
                    disabled={isTestingTorr}
                    className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingTorr ? 'animate-spin' : ''}`} />
                    {isTestingTorr ? 'Проверка...' : 'Проверить статус'}
                  </button>
                </div>

                {testResult && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono rounded-xl">
                    {testResult}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-300 font-bold uppercase">
                      Адрес TorrServer инстанса (URL / IP)
                    </label>
                    <input
                      type="text"
                      value={torrServerUrl}
                      onChange={(e) => setTorrServerUrl(e.target.value)}
                      placeholder="http://localhost:8090"
                      className="w-full bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-[#d4b581] transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-300 font-bold uppercase">
                      Режим стриминга
                    </label>
                    <select
                      value={streamingMode}
                      onChange={(e) => setStreamingMode(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-[#d4b581] transition"
                    >
                      <option value="direct_torrserver" className="bg-slate-900 text-white">
                        Прямой TorrServer (P2P поток напрямую в плеер)
                      </option>
                      <option value="edge_cluster" className="bg-slate-900 text-white">
                        Распределенный Edge CDN Кластер (Кэширование на серверах)
                      </option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    className="px-6 py-2.5 bg-[#d4b581] text-black hover:bg-[#e2c694] transition rounded-xl font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Применить параметры сервера
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: ACTIVE DEVICES */}
          {/* ========================================================================= */}
          {activeTab === 'devices' && (
            <div className="p-6 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Tv className="w-5 h-5 text-[#d4b581]" />
                  <h3 className="text-base font-bold text-white">
                    Привязанные устройства (Тариф {currentPlanObj.name}: лимит {currentPlanObj.maxDevices} устр.)
                  </h3>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  {currentUser.connected_devices_count || 1} из {currentPlanObj.maxDevices} слотов занято
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: 'Samsung QN90B 75" 4K TV', platform: 'Tizen OS 6.5', ip: '192.168.1.104', active: true },
                  { name: 'LG G3 OLED 65"', platform: 'webOS 23', ip: '192.168.1.112', active: false },
                  { name: 'NVIDIA Shield TV Pro', platform: 'Android TV 11', ip: '192.168.1.140', active: false }
                ].slice(0, currentPlanObj.maxDevices).map((d, i) => (
                  <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <Tv className="w-5 h-5 text-[#d4b581]" />
                      {d.active ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                          ТЕКУЩЕЕ
                        </span>
                      ) : (
                        <button
                          onClick={() => alert(`Устройство ${d.name} отключено`)}
                          className="text-[10px] font-mono text-rose-400 hover:underline cursor-pointer"
                        >
                          Отвязать
                        </button>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">{d.name}</p>
                      <p className="text-[11px] text-slate-400">{d.platform}</p>
                      <p className="text-[10px] font-mono text-slate-500 mt-1">{d.ip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: SECURITY */}
          {/* ========================================================================= */}
          {activeTab === 'security' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Защита пользовательских данных</h3>
                </div>

                <div className="space-y-3 text-xs font-mono text-slate-300">
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                    <span className="text-emerald-400 font-bold block">1. Хэширование паролей (Bcrypt 10 Rounds)</span>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Пароли никогда не хранятся в открытом виде. Используется криптографическое хэширование с солью.
                    </p>
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                    <span className="text-emerald-400 font-bold block">2. Защищенные JWT токены</span>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Сессии подписываются секретным ключом с ротацией access-токенов каждые 15 минут.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[#0f0e0d] border border-[#e6e3df]/10 rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <HardDrive className="w-5 h-5 text-[#d4b581]" />
                  <h3 className="text-base font-bold text-white">Локальное хранилище и кэш</h3>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Все настройки субтитров, истории просмотра и TorrServer сохраняются в безопасном защищенном хранилище.
                </p>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      localStorage.clear();
                      alert('Кэш приложения очищен');
                      window.location.reload();
                    }}
                    className="px-4 py-2 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl font-mono text-xs font-bold transition cursor-pointer"
                  >
                    Очистить локальный кэш
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
