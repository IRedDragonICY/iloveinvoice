import { useEffect } from 'react';
import type { Settings } from '@/lib/types';

export function useTheme(settings: Settings) {
  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      const isDark = settings.theme === 'dark' || (settings.theme === 'system' && prefersDark);

      root.classList.toggle('dark', isDark);
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    };

    apply();

    if (settings.theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => apply();
      mql.addEventListener?.('change', handler);
      return () => mql.removeEventListener?.('change', handler);
    }
  }, [settings.theme]);
}

