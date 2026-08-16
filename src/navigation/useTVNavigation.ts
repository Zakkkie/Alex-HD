import { useEffect, useRef } from 'react';
import { useSpatialNavigation } from './SpatialNavigationContext';

interface UseTVNavigationOptions {
  id: string;
  up?: string;
  down?: string;
  left?: string;
  right?: string;
  onEnter?: () => void;
  onBack?: () => void;
  onFocus?: () => void;
  autoFocus?: boolean;
}

export const useTVNavigation = <T extends HTMLElement = HTMLDivElement>({
  id,
  up,
  down,
  left,
  right,
  onEnter,
  onBack,
  onFocus,
  autoFocus = false
}: UseTVNavigationOptions) => {
  const ref = useRef<T | null>(null);
  const { currentFocusId, setFocus, registerNode, unregisterNode } = useSpatialNavigation();

  useEffect(() => {
    if (ref.current) {
      registerNode({
        id,
        element: ref.current,
        up,
        down,
        left,
        right,
        onEnter,
        onBack,
        onFocus
      });

      if (autoFocus) {
        setFocus(id);
      }
    }

    return () => {
      unregisterNode(id);
    };
  }, [id, up, down, left, right, onEnter, onBack, onFocus, autoFocus, registerNode, unregisterNode, setFocus]);

  const isFocused = currentFocusId === id;

  return { ref, isFocused, setFocus: () => setFocus(id) };
};
