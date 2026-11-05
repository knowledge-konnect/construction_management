import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeContext, THEME_STORAGE_KEY, type ResolvedTheme, type ThemePreference } from './context';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    /* storage unavailable (private mode) — fall back to system */
  }
  return 'system';
}

function resolve(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
  return preference;
}

function applyToDocument(theme: ResolvedTheme, animate: boolean) {
  const root = document.documentElement;
  if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 250);
  }
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#09090B' : '#0F172A');
}

/**
 * Light / dark / system, persisted. The inline script in index.html sets the
 * initial class before first paint; this provider keeps it in sync afterwards
 * (OS changes while on "system", changes made in another tab) with no reload.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolve(readPreference()));

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* non-fatal: preference just won't persist */
    }
    const nextResolved = resolve(next);
    applyToDocument(nextResolved, true);
    setPreferenceState(next);
    setResolved(nextResolved);
  }, []);

  // Follow the OS while on "system".
  useEffect(() => {
    if (preference !== 'system') return;
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => {
      const next = resolve('system');
      applyToDocument(next, true);
      setResolved(next);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [preference]);

  // Keep other tabs in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const next = readPreference();
      const nextResolved = resolve(next);
      applyToDocument(nextResolved, true);
      setPreferenceState(next);
      setResolved(nextResolved);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(() => ({ preference, resolved, setPreference }), [preference, resolved, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
