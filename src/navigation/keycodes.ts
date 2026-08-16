export type UnifiedAction =
  | 'NAV_UP'
  | 'NAV_DOWN'
  | 'NAV_LEFT'
  | 'NAV_RIGHT'
  | 'ACT_ENTER'
  | 'ACT_BACK'
  | 'MEDIA_PLAY'
  | 'MEDIA_PAUSE'
  | 'MEDIA_PLAY_PAUSE'
  | 'MEDIA_STOP'
  | 'MEDIA_FF'
  | 'MEDIA_RW'
  | 'UNKNOWN';

export const normalizeKey = (code: number, keyName?: string): UnifiedAction => {
  // Arrow keys & D-Pad
  if (code === 38 || keyName === 'ArrowUp') return 'NAV_UP';
  if (code === 40 || keyName === 'ArrowDown') return 'NAV_DOWN';
  if (code === 37 || keyName === 'ArrowLeft') return 'NAV_LEFT';
  if (code === 39 || keyName === 'ArrowRight') return 'NAV_RIGHT';

  // Enter / OK
  if (code === 13 || keyName === 'Enter') return 'ACT_ENTER';

  // Back / Return keys across Tizen (10009/88), webOS (461/8), Android TV (27/8/4), Escape (27), Backspace (8)
  if (
    code === 10009 ||
    code === 88 ||
    code === 461 ||
    code === 27 ||
    code === 8 ||
    code === 4 ||
    keyName === 'GoBack' ||
    keyName === 'Escape' ||
    keyName === 'Backspace'
  ) {
    return 'ACT_BACK';
  }

  // Media Keys
  if (code === 415 || code === 10252 || keyName === 'MediaPlay') return 'MEDIA_PLAY';
  if (code === 19 || keyName === 'MediaPause') return 'MEDIA_PAUSE';
  if (code === 179 || keyName === 'MediaPlayPause') return 'MEDIA_PLAY_PAUSE';
  if (code === 413 || keyName === 'MediaStop') return 'MEDIA_STOP';
  if (code === 417 || code === 228 || keyName === 'MediaFastForward') return 'MEDIA_FF';
  if (code === 412 || code === 227 || keyName === 'MediaRewind') return 'MEDIA_RW';

  return 'UNKNOWN';
};

/**
  * Tizen TV Input Device Key Registration helper
  */
export const registerTizenMediaKeys = () => {
  if (typeof window !== 'undefined' && (window as any).tizen?.tvinputdevice) {
    const tizenDevice = (window as any).tizen.tvinputdevice;
    const supportedMediaKeys = [
      'MediaPlay',
      'MediaPause',
      'MediaPlayPause',
      'MediaFastForward',
      'MediaRewind',
      'MediaStop'
    ];
    supportedMediaKeys.forEach(key => {
      try {
        tizenDevice.registerKey(key);
      } catch (e) {
        console.warn(`Tizen key registration bypassed for: ${key}`, e);
      }
    });
  }
};
