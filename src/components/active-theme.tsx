'use client';

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

const COOKIE_NAME = 'active_theme';
const DEFAULT_THEME = 'default';

function setThemeCookie(theme: string) {
  if (typeof window === 'undefined') return;

  document.cookie = `${COOKIE_NAME}=${theme}; path=/; max-age=31536000; SameSite=Lax; ${window.location.protocol === 'https:' ? 'Secure;' : ''}`;
}

function getThemeCookie(): string | null {
  if (typeof window === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === COOKIE_NAME) {
      return value;
    }
  }
  return null;
}

function setThemeLocalStorage(theme: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COOKIE_NAME, theme);
  } catch (e) {
    console.error('Failed to save theme to localStorage:', e);
  }
}

function getThemeLocalStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(COOKIE_NAME);
  } catch (e) {
    console.error('Failed to get theme from localStorage:', e);
    return null;
  }
}

type ThemeContextType = {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ActiveThemeProvider({
  children,
  initialTheme
}: {
  children: ReactNode;
  initialTheme?: string;
}) {
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    // Priority: 1) cookies, 2) localStorage, 3) initialTheme, 4) DEFAULT_THEME
    if (typeof window !== 'undefined') {
      return (
        getThemeCookie() ||
        getThemeLocalStorage() ||
        initialTheme ||
        DEFAULT_THEME
      );
    }
    return initialTheme || DEFAULT_THEME;
  });

  useEffect(() => {
    // Save theme to cookies and localStorage on change
    setThemeCookie(activeTheme);
    setThemeLocalStorage(activeTheme);

    // Update body classes
    Array.from(document.body.classList)
      .filter((className) => className.startsWith('theme-'))
      .forEach((className) => {
        document.body.classList.remove(className);
      });
    document.body.classList.add(`theme-${activeTheme}`);
    if (activeTheme.endsWith('-scaled')) {
      document.body.classList.add('theme-scaled');
    }
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ activeTheme, setActiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeConfig() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error(
      'useThemeConfig must be used within an ActiveThemeProvider'
    );
  }
  return context;
}
