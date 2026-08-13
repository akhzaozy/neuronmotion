'use client';
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import themeStyles from './theme.module.css';

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

/**
 * Pengalih tema.
 *
 * Dunia visual ini tidak memakai ikon, jadi tombolnya menyebut tema tujuannya
 * dengan kata. Bentuk ikon matahari dan bulan punya masalah lain juga: ia
 * ambigu, karena separuh pengguna membacanya sebagai keadaan sekarang dan
 * separuh lagi sebagai tujuan. Kata tidak punya ambiguitas itu.
 *
 * Prop `size` dipertahankan agar pemanggil lama tetap berjalan; keduanya kini
 * memenuhi lantai sentuh 44px.
 */
export function ThemeToggle({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { theme, toggleTheme } = useTheme();
  const goingDark = theme === 'light';
  const label = goingDark ? 'Ganti ke mode gelap' : 'Ganti ke mode terang';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      className={themeStyles.toggle}
      data-compact={size === 'sm' ? '' : undefined}
    >
      <span aria-hidden="true">{goingDark ? 'Gelap' : 'Terang'}</span>
    </button>
  );
}
