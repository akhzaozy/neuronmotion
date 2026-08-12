'use client';
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', toggleTheme: () => {} });

/**
 * Script yang dijalankan sebelum React hydrate, supaya tema tersimpan langsung
 * terpasang di <html> dan tidak terjadi kedipan warna (flash) saat halaman dibuka.
 */
export const THEME_INIT_SCRIPT = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') as Theme | null;
    if (current === 'light' || current === 'dark') {
      setTheme(current);
      return;
    }
    const saved = localStorage.getItem('theme') as Theme | null;
    const resolved: Theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

export function ThemeToggle({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { theme, toggleTheme } = useTheme();
  const w = size === 'sm' ? 48 : 56;
  const h = size === 'sm' ? 26 : 30;
  const thumb = h - 6;

  return (
    <button
      onClick={toggleTheme}
      title={theme === 'light' ? 'Ganti ke mode gelap' : 'Ganti ke mode terang'}
      aria-label={theme === 'light' ? 'Ganti ke mode gelap' : 'Ganti ke mode terang'}
      style={{
        position: 'relative',
        width: w,
        height: h,
        borderRadius: h / 2,
        background: theme === 'light' ? '#e2e8f0' : '#1e293b',
        border: '1px solid',
        borderColor: theme === 'light' ? '#cbd5e1' : '#334155',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: theme === 'light' ? 2 : w - thumb - 4,
          width: thumb,
          height: thumb,
          background: '#fff',
          borderRadius: '50%',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          transition: 'left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          zIndex: 2,
        }}
      />
      <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', display: 'flex', zIndex: 1, color: theme === 'light' ? '#f59e0b' : '#64748b' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </span>
      <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', display: 'flex', zIndex: 1, color: theme === 'dark' ? '#60a5fa' : '#94a3b8' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
    </button>
  );
}
