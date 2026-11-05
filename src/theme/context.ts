import { createContext } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  /** What the user picked (may be "system"). */
  preference: ThemePreference;
  /** What is actually showing right now. */
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
}

export const THEME_STORAGE_KEY = 'bd-theme';
export const ThemeContext = createContext<ThemeContextValue | null>(null);
