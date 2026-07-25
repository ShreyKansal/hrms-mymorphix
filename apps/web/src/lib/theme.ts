import { create } from 'zustand';

// Light/dark theming for the Supabase token layer (see styles/tailwind.css). The active theme
// is a single `data-theme` attribute on <html>; index.html applies the persisted value before
// first paint to avoid a flash, and this store keeps the attribute + localStorage in sync while
// the app runs. Light is the default; dark is available via the sidebar toggle.
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'hrms-theme';

function readInitial(): Theme {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
  }
  return 'light';
}

function apply(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* private mode / storage disabled — the attribute is still set, just not persisted */
  }
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readInitial(),
  setTheme: (theme) => {
    apply(theme);
    set({ theme });
  },
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    apply(next);
    set({ theme: next });
  },
}));
