import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Film,
  Home,
  Search,
  TrendingUp,
  Grid,
  Tv,
  Heart,
  History,
  User,
  Shield,
  Pin,
  Menu,
  X
} from 'lucide-react';
import { useTVNavigation } from '../../navigation/useTVNavigation';
import { useSpatialNavigation } from '../../navigation/SpatialNavigationContext';

interface SidebarProps {
  activeTab?: string;
  currentTab?: string;
  onSelectTab: (tab: string) => void;
  isAdmin?: boolean;
}

interface SidebarItemProps {
  id: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  rightTarget?: string;
  downTarget?: string;
  upTarget?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  id,
  label,
  icon: Icon,
  isActive,
  isExpanded,
  onSelect,
  rightTarget = 'hero-play-btn',
  downTarget,
  upTarget
}) => {
  const { ref, isFocused } = useTVNavigation({
    id,
    right: rightTarget,
    down: downTarget,
    up: upTarget,
    onEnter: onSelect
  });

  return (
    <div className="relative group/item flex items-center justify-center">
      <div
        id={id}
        ref={ref}
        tabIndex={0}
        onClick={onSelect}
        className={`flex items-center cursor-pointer transition-all duration-200 outline-none select-none ${
          isExpanded
            ? 'w-full gap-3.5 px-3.5 py-2.5 rounded-xl'
            : 'w-11 h-11 justify-center rounded-xl'
        } ${
          isFocused
            ? 'bg-[#d4b581] text-black font-bold scale-[1.04] shadow-[0_0_20px_rgba(212,181,129,0.45)] ring-2 ring-white/50'
            : isActive
            ? 'bg-[#d4b581]/15 text-[#d4b581] font-semibold border border-[#d4b581]/40'
            : 'text-[#f5f3ef]/65 hover:text-[#f5f3ef] hover:bg-[#f5f3ef]/10'
        }`}
      >
        <Icon className="w-5 h-5 shrink-0 transition-transform duration-200" />
        
        {/* Expanded Label */}
        <span
          className={`text-[13.5px] font-medium tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${
            isExpanded ? 'opacity-100 max-w-[180px] ml-0' : 'opacity-0 max-w-0 pointer-events-none'
          }`}
        >
          {label}
        </span>
      </div>

      {/* Floating Tooltip when Collapsed on Desktop Hover */}
      {!isExpanded && (
        <div className="hidden md:group-hover/item:flex absolute left-full ml-3 px-3 py-1.5 bg-[#171615] text-[#f5f3ef] text-xs font-medium rounded-lg border border-[#f5f3ef]/15 shadow-xl whitespace-nowrap pointer-events-none z-50 animate-in fade-in duration-150">
          <span>{label}</span>
          <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-[1px] border-4 border-transparent border-r-[#171615]" />
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  currentTab,
  onSelectTab,
  isAdmin = false
}) => {
  const effectiveTab = activeTab || currentTab || 'home';
  const { currentFocusId, focusContent } = useSpatialNavigation();
  const isSidebarFocused = currentFocusId.startsWith('sidebar-');

  const sidebarRef = useRef<HTMLElement | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isExpanded = isSidebarFocused || isHovered || isPinned || isMobileOpen;

  const collapseSidebar = useCallback(() => {
    setIsHovered(false);
    setIsPinned(false);
    setIsMobileOpen(false);
    focusContent();
  }, [focusContent]);

  // Handle click / touch outside sidebar to auto-collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        collapseSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [collapseSidebar]);

  // Idle timer to auto-collapse sidebar after 4 seconds of mouse inactivity
  const resetIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 4000);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    resetIdleTimer();
  };

  const handleMouseMove = () => {
    if (isHovered) {
      resetIdleTimer();
    }
  };

  const handleMouseLeave = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    setIsHovered(false);
    focusContent();
  };

  const handleItemSelect = (tab: string) => {
    onSelectTab(tab);
    collapseSidebar();
  };

  return (
    <>
      {/* Mobile Toggle Button for Smartphones / Small Screens */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          id="mobile-sidebar-toggle-btn"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2.5 rounded-full bg-[#0f0e0d]/90 text-[#d4b581] border border-[#d4b581]/30 shadow-xl backdrop-blur-md outline-none cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* State-Managed Overlay Backdrop for Click-Outside & Visual Focus */}
      {isExpanded && (
        <div
          id="sidebar-overlay-backdrop"
          onClick={collapseSidebar}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 cursor-pointer"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Aside Container */}
      <aside
        id="main-sidebar-aside"
        ref={sidebarRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`fixed top-0 left-0 bottom-0 z-40 bg-[#0c0b0a]/95 backdrop-blur-2xl border-r border-[#f5f3ef]/10 flex flex-col py-4 px-2.5 transition-all duration-300 ease-out ${
          isExpanded ? 'w-64 shadow-[0_0_50px_rgba(0,0,0,0.85)]' : 'w-20'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1.5 mb-4">
          <div className="flex items-center gap-3">
            {/* Cinematic Brand Logo (Distinct from Home Tab) */}
            <div
              id="sidebar-brand-logo-btn"
              onClick={() => handleItemSelect('home')}
              className="w-11 h-11 bg-gradient-to-br from-[#d4b581]/25 to-[#d4b581]/5 rounded-xl border border-[#d4b581]/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(212,181,129,0.2)] cursor-pointer hover:border-[#d4b581] transition-colors"
              title="Editorial Alex HD Cinema"
            >
              <Film className="w-5 h-5 text-[#d4b581]" />
            </div>

            {/* Brand Title (Revealed on Expand) */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isExpanded ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 pointer-events-none'
              }`}
            >
              <h1 className="font-cinematic font-bold text-sm text-[#f5f3ef] tracking-wider leading-none">
                ALEX HD
              </h1>
              <p className="text-[8.5px] text-[#d4b581] font-mono-code uppercase tracking-[0.2em] mt-1 font-semibold">
                MEDIA MARKET
              </p>
            </div>
          </div>

          {/* Desktop Pin Toggle */}
          {isExpanded && (
            <button
              id="sidebar-pin-btn"
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? 'Открепить меню' : 'Закрепить меню'}
              className={`hidden md:flex p-1.5 rounded-lg transition-all text-xs ${
                isPinned
                  ? 'text-[#d4b581] bg-[#d4b581]/20 border border-[#d4b581]/40'
                  : 'text-[#f5f3ef]/40 hover:text-[#f5f3ef] hover:bg-[#f5f3ef]/10'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Navigation Groups Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3.5 py-1">
          {/* Tier 1: Catalog */}
          <div className="space-y-1">
            {isExpanded && (
              <p className="px-3 text-[9px] uppercase tracking-[0.25em] text-[#d4b581]/75 font-mono-code font-semibold mb-1">
                Каталог
              </p>
            )}
            <SidebarItem
              id="sidebar-home"
              label="Главная"
              icon={Home}
              isActive={effectiveTab === 'home'}
              isExpanded={isExpanded}
              onSelect={() => handleItemSelect('home')}
              downTarget="sidebar-search"
            />
            <SidebarItem
              id="sidebar-search"
              label="Поиск"
              icon={Search}
              isActive={effectiveTab === 'search'}
              isExpanded={isExpanded}
              onSelect={() => handleItemSelect('search')}
              upTarget="sidebar-home"
              downTarget="sidebar-trending"
            />
            <SidebarItem
              id="sidebar-trending"
              label="Сейчас смотрят"
              icon={TrendingUp}
              isActive={effectiveTab === 'trending'}
              isExpanded={isExpanded}
              onSelect={() => handleItemSelect('trending')}
              upTarget="sidebar-search"
              downTarget="sidebar-collections"
            />
            <SidebarItem
              id="sidebar-collections"
              label="Подборки"
              icon={Grid}
              isActive={effectiveTab === 'collections'}
              isExpanded={isExpanded}
              onSelect={() => handleItemSelect('collections')}
              upTarget="sidebar-trending"
              downTarget="sidebar-4k"
            />
            <SidebarItem
              id="sidebar-4k"
              label="4K Ultra HDR"
              icon={Tv}
              isActive={effectiveTab === '4k'}
              isExpanded={isExpanded}
              onSelect={() => handleItemSelect('4k')}
              upTarget="sidebar-collections"
              downTarget="sidebar-favorites"
            />
          </div>

          {/* Divider between Tiers */}
          <div className="h-px bg-white/5 mx-2 my-1" />

          {/* Tier 2: My Content */}
          <div className="space-y-1">
            {isExpanded && (
              <p className="px-3 text-[9px] uppercase tracking-[0.25em] text-[#d4b581]/75 font-mono-code font-semibold mb-1">
                Моё
              </p>
            )}
            <SidebarItem
              id="sidebar-favorites"
              label="Буду смотреть"
              icon={Heart}
              isActive={effectiveTab === 'favorites'}
              isExpanded={isExpanded}
              onSelect={() => handleItemSelect('favorites')}
              upTarget="sidebar-4k"
              downTarget="sidebar-history"
            />
            <SidebarItem
              id="sidebar-history"
              label="История"
              icon={History}
              isActive={effectiveTab === 'history'}
              isExpanded={isExpanded}
              onSelect={() => handleItemSelect('history')}
              upTarget="sidebar-favorites"
              downTarget="sidebar-profile"
            />
          </div>

          {/* Divider between Tiers */}
          <div className="h-px bg-white/5 mx-2 my-1" />

          {/* Tier 3: Profile & Admin */}
          <div className="space-y-1">
            {isExpanded && (
              <p className="px-3 text-[9px] uppercase tracking-[0.25em] text-[#d4b581]/75 font-mono-code font-semibold mb-1">
                Сервис
              </p>
            )}
            <SidebarItem
              id="sidebar-profile"
              label="Аккаунт"
              icon={User}
              isActive={effectiveTab === 'profile'}
              isExpanded={isExpanded}
              onSelect={() => handleItemSelect('profile')}
              upTarget="sidebar-history"
              downTarget={isAdmin ? "sidebar-admin" : undefined}
            />
            {isAdmin && (
              <SidebarItem
                id="sidebar-admin"
                label="Управление"
                icon={Shield}
                isActive={effectiveTab === 'admin'}
                isExpanded={isExpanded}
                onSelect={() => handleItemSelect('admin')}
                upTarget="sidebar-profile"
              />
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
