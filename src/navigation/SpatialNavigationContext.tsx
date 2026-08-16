import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { normalizeKey, UnifiedAction, registerTizenMediaKeys } from './keycodes';
import { soundFx } from '../utils/audioFeedback';

export interface FocusableNode {
  id: string;
  parentId?: string | null;
  element: HTMLElement;
  up?: string;
  down?: string;
  left?: string;
  right?: string;
  onEnter?: () => void;
  onBack?: () => void;
  onFocus?: () => void;
}

interface SpatialNavigationContextType {
  currentFocusId: string;
  setFocus: (id: string) => void;
  registerNode: (node: FocusableNode) => void;
  unregisterNode: (id: string) => void;
  activeZone: 'sidebar' | 'content' | 'modal' | 'player';
  setActiveZone: (zone: 'sidebar' | 'content' | 'modal' | 'player') => void;
  focusContent: () => boolean;
}

const SpatialNavigationContext = createContext<SpatialNavigationContextType | null>(null);

export const SpatialNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentFocusId, setCurrentFocusId] = useState<string>('sidebar-home');
  const [activeZone, setActiveZone] = useState<'sidebar' | 'content' | 'modal' | 'player'>('sidebar');
  const nodesMap = useRef<Map<string, FocusableNode>>(new Map());

  // Register Tizen Media Keys on mount
  useEffect(() => {
    registerTizenMediaKeys();
  }, []);

  const registerNode = useCallback((node: FocusableNode) => {
    nodesMap.current.set(node.id, node);
  }, []);

  const unregisterNode = useCallback((id: string) => {
    nodesMap.current.delete(id);
  }, []);

  const setFocus = useCallback((id: string) => {
    const node = nodesMap.current.get(id);
    if (node) {
      setCurrentFocusId(id);
      node.element.focus({ preventScroll: true });
      node.element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      soundFx.playFocusClick();
      if (node.onFocus) {
        node.onFocus();
      }
    }
  }, []);

  const focusContent = useCallback(() => {
    for (const [id, node] of nodesMap.current.entries()) {
      if (!id.startsWith('sidebar-')) {
        setCurrentFocusId(id);
        if (node.element) {
          node.element.focus({ preventScroll: true });
        }
        if (node.onFocus) {
          node.onFocus();
        }
        return true;
      }
    }
    setCurrentFocusId('content');
    return false;
  }, []);

  // Spatial direction calculation (Geometric center distance + angular penalty)
  const findNextFocusNode = (direction: 'NAV_UP' | 'NAV_DOWN' | 'NAV_LEFT' | 'NAV_RIGHT'): string | null => {
    const currNode = nodesMap.current.get(currentFocusId);
    if (!currNode) return null;

    // Direct override
    if (direction === 'NAV_UP' && currNode.up) return currNode.up;
    if (direction === 'NAV_DOWN' && currNode.down) return currNode.down;
    if (direction === 'NAV_LEFT' && currNode.left) return currNode.left;
    if (direction === 'NAV_RIGHT' && currNode.right) return currNode.right;

    const currRect = currNode.element.getBoundingClientRect();
    const currCenter = {
      x: currRect.left + currRect.width / 2,
      y: currRect.top + currRect.height / 2
    };

    let bestId: string | null = null;
    let minDistance = Infinity;

    nodesMap.current.forEach((node, id) => {
      if (id === currentFocusId) return;
      const rect = node.element.getBoundingClientRect();
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      const dx = center.x - currCenter.x;
      const dy = center.y - currCenter.y;

      let isCandidate = false;
      let primaryOffset = 0;
      let secondaryOffset = 0;

      if (direction === 'NAV_UP' && dy < -5) {
        isCandidate = true;
        primaryOffset = Math.abs(dy);
        secondaryOffset = Math.abs(dx);
      } else if (direction === 'NAV_DOWN' && dy > 5) {
        isCandidate = true;
        primaryOffset = Math.abs(dy);
        secondaryOffset = Math.abs(dx);
      } else if (direction === 'NAV_LEFT' && dx < -5) {
        isCandidate = true;
        primaryOffset = Math.abs(dx);
        secondaryOffset = Math.abs(dy);
      } else if (direction === 'NAV_RIGHT' && dx > 5) {
        isCandidate = true;
        primaryOffset = Math.abs(dx);
        secondaryOffset = Math.abs(dy);
      }

      if (isCandidate) {
        // Distance formula D = sqrt(dx^2 + dy^2) + omega * secondaryOffset
        const dist = Math.sqrt(dx * dx + dy * dy) + 2.5 * secondaryOffset;
        if (dist < minDistance) {
          minDistance = dist;
          bestId = id;
        }
      }
    });

    return bestId;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTextInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable);

      const action: UnifiedAction = normalizeKey(e.keyCode, e.key);

      if (action === 'UNKNOWN') return;

      // Allow natural keyboard navigation inside text input fields
      if (isTextInput) {
        if (action === 'ACT_BACK' || e.key === 'Escape') {
          (activeEl as HTMLElement).blur();
          return;
        }
        // Let user type and use arrow keys / enter within input fields
        if (action !== 'NAV_DOWN' && action !== 'NAV_UP') {
          return;
        }
      }

      const currNode = nodesMap.current.get(currentFocusId);

      if (action === 'ACT_ENTER') {
        if (currNode && currNode.onEnter) {
          e.preventDefault();
          currNode.onEnter();
        }
        return;
      }

      if (action === 'ACT_BACK') {
        if (currNode && currNode.onBack) {
          e.preventDefault();
          currNode.onBack();
        }
        return;
      }

      if (['NAV_UP', 'NAV_DOWN', 'NAV_LEFT', 'NAV_RIGHT'].includes(action)) {
        e.preventDefault();
        const nextId = findNextFocusNode(action as any);
        if (nextId) {
          setFocus(nextId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFocusId, setFocus]);

  return (
    <SpatialNavigationContext.Provider
      value={{
        currentFocusId,
        setFocus,
        registerNode,
        unregisterNode,
        activeZone,
        setActiveZone,
        focusContent
      }}
    >
      {children}
    </SpatialNavigationContext.Provider>
  );
};

export const useSpatialNavigation = () => {
  const ctx = useContext(SpatialNavigationContext);
  if (!ctx) {
    throw new Error('useSpatialNavigation must be used within SpatialNavigationProvider');
  }
  return ctx;
};
