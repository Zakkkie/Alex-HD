import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SpatialNavigationProvider } from './navigation/SpatialNavigationContext';
import { Sidebar } from './components/layout/Sidebar';
import { Home } from './pages/Home';
import { MovieDetail } from './pages/MovieDetail';
import { SeriesDetail } from './pages/SeriesDetail';
import { SearchPage } from './pages/SearchPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { CategoryPage } from './pages/CategoryPage';
import { TVPlayer } from './components/player/TVPlayer';
import { ToastContainer, ToastMessage } from './components/ui/Toast';
import { normalizeKey } from './navigation/keycodes';
import { api } from './api/client';
import { HomePayload, ContentItem, HistoryItem, UserProfile, StreamInfo } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<
    'home' | 'search' | 'trending' | 'collections' | '4k' | 'favorites' | 'watchlist' | 'history' | 'profile' | 'admin'
  >('home');
  const [homeData, setHomeData] = useState<HomePayload | null>(null);
  const [favorites, setFavorites] = useState<ContentItem[]>([]);
  const [watchlist, setWatchlist] = useState<ContentItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('alexhd_current_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      id: 'usr-user-01',
      username: 'alex_viewer',
      displayName: 'Пользователь Alex HD',
      email: 'user@alexhd.app',
      role: 'user',
      plan: 'standard',
      subscription_expires_at: null,
      connected_devices_count: 1,
      isSubscribed: false
    };
  });

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, message?: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, title, message, type };
    setToasts((prev) => [...prev.slice(-2), newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const mainRef = useRef<HTMLElement | null>(null);

  // Selected Detail Item
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  // Scroll main container to top whenever selectedContent or activeTab changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [selectedContent, activeTab]);

  // Active Video Stream Player
  const [playingStream, setPlayingStream] = useState<{
    info: StreamInfo;
    content: ContentItem;
    episodeTitle?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Load catalog on start
  useEffect(() => {
    loadCatalog();
    loadUserData();
  }, []);

  const loadCatalog = async () => {
    try {
      setIsLoading(true);
      const data = await api.getHome();
      setHomeData(data);
    } catch (err) {
      console.error('Failed to fetch home catalog', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const [favs, watch, hist] = await Promise.all([
        api.getFavorites(),
        api.getWatchlist(),
        api.getHistory()
      ]);
      setFavorites(favs);
      setWatchlist(watch);
      setHistory(hist);
    } catch (err) {
      console.error('Failed to load user data', err);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const isFav = favorites.some((f) => f.id === id);
      const isWatch = watchlist.some((w) => w.id === id);
      
      await Promise.all([
        api.toggleFavorite(id),
        isFav === isWatch ? api.toggleWatchlist(id) : Promise.resolve()
      ]);
      
      loadUserData();
      showToast(
        isFav ? 'Удалено из списка' : 'Добавлено в список',
        isFav ? 'Больше не запланировано к просмотру' : 'Добавлено в раздел «Буду смотреть»',
        isFav ? 'info' : 'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Ошибка', 'Не удалось обновить список', 'warning');
    }
  };

  const handleToggleWatchlist = async (id: string) => {
    try {
      const isFav = favorites.some((f) => f.id === id);
      const isWatch = watchlist.some((w) => w.id === id);
      
      await Promise.all([
        api.toggleFavorite(id),
        isFav === isWatch ? api.toggleWatchlist(id) : Promise.resolve()
      ]);
      
      loadUserData();
      showToast(
        isWatch ? 'Удалено из списка' : 'Добавлено в список',
        isWatch ? 'Больше не запланировано к просмотру' : 'Добавлено в раздел «Буду смотреть»',
        isWatch ? 'info' : 'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Ошибка', 'Не удалось обновить список', 'warning');
    }
  };

  const handleStartPlay = async (item: ContentItem, episodeTitle?: string) => {
    try {
      const streamInfo = await api.getStream(item.id);
      setPlayingStream({
        info: streamInfo,
        content: item,
        episodeTitle
      });
    } catch (err) {
      console.error('Failed to start stream playback', err);
      // Fallback stream if offline
      setPlayingStream({
        info: {
          content_id: item.id,
          title: item.title,
          stream_url: item.stream_url || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          subtitles: item.subtitles || [],
          audio_tracks: [
            { id: 'ru', language: 'Русский', label: 'Дубляж 5.1' },
            { id: 'en', language: 'English', label: 'Original Dolby Atmos' }
          ]
        },
        content: item,
        episodeTitle
      });
    }
  };

  const handleSavePlaybackProgress = async (seconds: number, percentage: number) => {
    if (!playingStream) return;
    try {
      await api.saveProgress(playingStream.content.id, seconds, percentage);
      loadUserData();
    } catch (err) {
      console.error(err);
    }
  };

  // Global TV remote back button handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTextInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable);

      if (isTextInput) {
        return;
      }

      const action = normalizeKey(e.keyCode, e.key);
      if (action === 'ACT_BACK') {
        if (playingStream) {
          e.preventDefault();
          setPlayingStream(null);
        } else if (selectedContent) {
          e.preventDefault();
          setSelectedContent(null);
        } else if (activeTab !== 'home') {
          e.preventDefault();
          setActiveTab('home');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [playingStream, selectedContent, activeTab]);

  return (
    <SpatialNavigationProvider>
      {playingStream ? (
        <TVPlayer
          stream={playingStream.info}
          content={playingStream.content}
          onBack={() => setPlayingStream(null)}
          onSaveProgress={handleSavePlaybackProgress}
        />
      ) : (
        <div className="w-full h-screen bg-[#0f0e0d] text-[#e6e3df] flex flex-row overflow-hidden relative font-serif-body select-none">
          {/* Editorial Ambient Orbs */}
          <div className="fixed w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,_rgba(212,181,129,0.05)_0%,_transparent_70%)] -top-[200px] -left-[200px] pointer-events-none z-0" />
          <div className="fixed w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,_rgba(212,181,129,0.05)_0%,_transparent_70%)] -bottom-[200px] -right-[200px] pointer-events-none z-0" />

          {/* Sidebar Left Navigation */}
          <div className="z-50 shrink-0">
            <Sidebar
              activeTab={activeTab}
              isAdmin={user.role === 'admin'}
              onSelectTab={(tab) => {
                setActiveTab(tab as any);
                setSelectedContent(null);
              }}
            />
          </div>

          {/* Global Toast Container */}
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />

          {/* Main Workspace Scroll Area */}
          <main ref={mainRef} className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-10 lg:px-12 md:ml-20 pt-16 md:pt-8 pb-20 z-10 no-scrollbar max-w-[1920px] w-full">
            {isLoading && !homeData ? (
              <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-2 border-[#d4b581] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-mono-code tracking-[0.2em] text-[#d4b581] uppercase">
                  Загрузка каталога Alex HD...
                </p>
              </div>
            ) : selectedContent ? (
              selectedContent.type === 'series' ? (
                <SeriesDetail
                  content={selectedContent}
                  onPlayEpisode={(content, episode, season, extraOpts) => {
                    if (extraOpts?.streamUrl) {
                      setPlayingStream({
                        info: {
                          content_id: content.id,
                          title: `${content.title} - ${episode.title}`,
                          stream_url: extraOpts.streamUrl,
                          subtitles: [],
                          audio_tracks: [
                            { id: 'ru', language: 'Русский', label: extraOpts.voiceover || 'TorrServer Stream' }
                          ]
                        },
                        content,
                        episodeTitle: episode.title
                      });
                    } else {
                      handleStartPlay(content, `${episode.title}`);
                    }
                  }}
                  onBack={() => setSelectedContent(null)}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleWatchlist={handleToggleWatchlist}
                  onSelectContent={setSelectedContent}
                />
              ) : (
                <MovieDetail
                  content={selectedContent}
                  onPlay={handleStartPlay}
                  onBack={() => setSelectedContent(null)}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleWatchlist={handleToggleWatchlist}
                  onSelectContent={setSelectedContent}
                />
              )
            ) : (
              <>
                {activeTab === 'home' && homeData && (
                  <Home
                    data={homeData}
                    onPlay={handleStartPlay}
                    onSelectContent={setSelectedContent}
                    onToggleFavorite={handleToggleFavorite}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                )}

                {(activeTab === 'trending' || activeTab === 'collections' || activeTab === '4k') && homeData && (
                  <CategoryPage
                    mode={activeTab}
                    data={homeData}
                    onSelectContent={setSelectedContent}
                  />
                )}

                {activeTab === 'search' && (
                  <SearchPage onSelectContent={setSelectedContent} />
                )}

                {activeTab === 'favorites' && (
                  <FavoritesPage
                    favorites={favorites}
                    onSelectContent={setSelectedContent}
                  />
                )}

                {activeTab === 'watchlist' && (
                  <WatchlistPage
                    watchlist={watchlist}
                    onSelectContent={setSelectedContent}
                  />
                )}

                {activeTab === 'history' && (
                  <HistoryPage history={history} onPlay={handleStartPlay} />
                )}

                {activeTab === 'profile' && (
                  <ProfilePage
                    user={user}
                    onUserUpdate={setUser}
                  />
                )}

                {activeTab === 'admin' && (
                  user.role === 'admin' ? (
                    <AdminPage />
                  ) : (
                    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
                      <div className="max-w-md w-full bg-[#121110] border border-[#d4b581]/30 rounded-3xl p-8 shadow-2xl space-y-6">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-serif text-xl font-bold text-white">Вход в панель администратора</h3>
                          <p className="text-xs text-[#e6e3df]/70 font-mono mt-1">
                            Раздел управления серверами и нодами защищен мастер-паролем.
                          </p>
                        </div>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const pwd = formData.get('adminPassword')?.toString() || '';
                            if (pwd === 'admin123' || pwd === 'StrongAlexHdPass2026!' || pwd === 'alexhd2026') {
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
                              setUser(adminProfile);
                              localStorage.setItem('alexhd_current_profile', JSON.stringify(adminProfile));
                              showToast('Авторизация успешна', 'Доступ к панели управления предоставлен', 'success');
                            } else {
                              showToast('Ошибка доступа', 'Неверный пароль администратора', 'warning');
                            }
                          }}
                          className="space-y-4"
                        >
                          <input
                            type="password"
                            name="adminPassword"
                            placeholder="Введите пароль администратора..."
                            required
                            className="w-full px-4 py-3 bg-black/40 border border-[#e6e3df]/20 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#d4b581] transition-colors"
                          />
                          <button
                            type="submit"
                            className="w-full py-3 bg-[#d4b581] hover:bg-[#c3a470] text-black font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer"
                          >
                            Подтвердить доступ
                          </button>
                        </form>
                      </div>
                    </div>
                  )
                )}
              </>
            )}
          </main>
        </div>
      )}
    </SpatialNavigationProvider>
  );
}

export default App;

