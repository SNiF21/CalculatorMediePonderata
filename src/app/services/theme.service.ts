import { Injectable, signal, computed, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private static readonly STORAGE_KEY = 'calculator_app_theme';

  readonly theme = signal<ThemeMode>(this.getInitialTheme());
  private readonly systemPrefersDark = signal<boolean>(this.getSystemDarkPreference());

  readonly isDark = computed<boolean>(() => {
    const mode = this.theme();
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return this.systemPrefersDark();
  });

  constructor() {
    // Listen to OS prefers-color-scheme changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        this.systemPrefersDark.set(e.matches);
      });
    }

    // Reactively update HTML documentElement class and color-scheme
    effect(() => {
      const dark = this.isDark();
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (dark) {
          root.classList.add('dark');
          root.style.colorScheme = 'dark';
        } else {
          root.classList.remove('dark');
          root.style.colorScheme = 'light';
        }
      }
    });

    // Reactively persist theme selection
    effect(() => {
      const current = this.theme();
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(ThemeService.STORAGE_KEY, current);
        } catch {
          // ignore storage errors
        }
      }
    });
  }

  private getInitialTheme(): ThemeMode {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(ThemeService.STORAGE_KEY) as ThemeMode | null;
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          return stored;
        }
      } catch {
        // ignore
      }
    }
    return 'system';
  }

  private getSystemDarkPreference(): boolean {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }

  setTheme(mode: ThemeMode) {
    this.theme.set(mode);
  }

  toggleTheme() {
    const next = this.isDark() ? 'light' : 'dark';
    this.theme.set(next);
  }
}
