import { useState, useEffect, useRef } from 'react';
import { STORAGE, DEFAULTS } from '@/lib/constants';

export interface PersistentStateError {
  type: 'quota_exceeded' | 'access_denied' | 'parse_error' | 'unknown';
  message: string;
}

export function usePersistentState<T>(key: string, initial: T) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<T>(initial);
  const [error, setError] = useState<PersistentStateError | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        // migration helpers
        if (key === STORAGE.settings && parsed && typeof parsed === "object") {
          if (parsed.defaultTaxPercent != null && parsed.taxPercent == null) {
            parsed.taxPercent = parsed.defaultTaxPercent;
          }
          if (parsed.invoiceFooter == null) {
            parsed.invoiceFooter = DEFAULTS.settings.invoiceFooter;
          }
          if (!parsed.accent) parsed.accent = DEFAULTS.settings.accent;
        }
        setState(parsed);
      }
    } catch (err) {
      console.warn('Failed to load from localStorage:', key, err);
      setError({
        type: 'parse_error',
        message: 'Failed to load saved data'
      });
    }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;

    // Debounce writes to batch quick successive updates
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      try {
        const serialized = JSON.stringify(state);
        localStorage.setItem(key, serialized);
        if (error) setError(null);
      } catch (err: any) {
        console.error('Failed to save to localStorage:', key, err);

        let errorType: PersistentStateError['type'] = 'unknown';
        let message = 'Failed to save data';

        if (err.name === 'QuotaExceededError' || err.code === 22) {
          errorType = 'quota_exceeded';
          message = 'Storage quota exceeded. Try reducing image sizes or clearing old data.';
        } else if (err.name === 'SecurityError') {
          errorType = 'access_denied';
          message = 'Access to storage denied. Check browser settings.';
        }

        setError({ type: errorType, message });
      }
    }, 150);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [key, ready, state, error]);

  // Enhanced setState that can handle save errors
  const setStateWithErrorHandling = (newState: T | ((prev: T) => T)) => {
    setState(newState);
    // Error will be set in the useEffect above if save fails
  };

  return [state, setStateWithErrorHandling, ready, error] as const;
}

