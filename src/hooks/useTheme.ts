import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';

export const OLD_THEME_STORAGE_KEY = 'mailcheck_theme';
export const THEME_STORAGE_KEY = 'mailscope_theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      let saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (!saved) {
        const oldSaved = localStorage.getItem(OLD_THEME_STORAGE_KEY) as Theme | null;
        if (oldSaved === 'dark' || oldSaved === 'light') {
          localStorage.setItem(THEME_STORAGE_KEY, oldSaved);
          localStorage.removeItem(OLD_THEME_STORAGE_KEY);
          saved = oldSaved;
        }
      }
      if (saved === 'dark' || saved === 'light') return saved;
      // Default to dark navy theme
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        document.body.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        document.body.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
    } catch {
      // ignore localStorage errors
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme, setTheme };
}
