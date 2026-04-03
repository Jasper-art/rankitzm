import React, { createContext, useState, useEffect, ReactNode } from 'react';

// RankIT ZM Theme Colors
export const LIGHT = {
  bg: '#FAFAFA', surface: '#FFFFFF', surfaceAlt: '#F5F5F5',
  border: '#E0E0E0', borderSub: '#F0F0F0',
  text: '#1B1B1B', textSub: '#333333', textMuted: '#666666',
  accent: '#2D7D4D', accentBg: '#E8F5E9', accentText: '#1B5E20',
  red: '#D32F2F', redBg: '#FFEBEE', redText: '#B71C1C',
  orange: '#F57C00', orangeBg: '#FFF3E0', orangeText: '#E65100',
  sidebar: '#FFFFFF', sidebarBorder: '#E0E0E0',
  topbar: '#FFFFFF', statCard: '#FFFFFF', tableHead: '#F5F5F5',
  shadow: 'rgba(45,125,77,0.10)',
};

export const DARK = {
  bg: '#0F1419', surface: '#1A1F26', surfaceAlt: '#232A34',
  border: '#2D3A47', borderSub: '#1F272F',
  text: '#E8EBED', textSub: '#B8BEC6', textMuted: '#7A8290',
  accent: '#4CAF50', accentBg: '#1B5E20', accentText: '#81C784',
  red: '#EF5350', redBg: '#B71C1C', redText: '#EF9A9A',
  orange: '#FFA726', orangeBg: '#E65100', orangeText: '#FFB74D',
  sidebar: '#1A1F26', sidebarBorder: '#2D3A47',
  topbar: '#1A1F26', statCard: '#232A34', tableHead: '#1A1F26',
  shadow: 'rgba(76,175,80,0.12)',
};

export type Theme = typeof LIGHT;

interface ThemeContextType {
  dark: boolean;
  setDark: (value: boolean) => void;
  t: Theme;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [dark, setDarkState] = useState<boolean>(() => {
    // Check localStorage first
    const saved = localStorage.getItem('rankitz-theme');
    if (saved) {
      return saved === 'dark';
    }
    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Update localStorage and apply theme when dark mode changes
  useEffect(() => {
    localStorage.setItem('rankitz-theme', dark ? 'dark' : 'light');
    // Optional: apply theme to document root if using CSS variables
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const setDark = (value: boolean) => {
    setDarkState(value);
  };

  const t = dark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ dark, setDark, t }}>
      {children}
    </ThemeContext.Provider>
  );
}