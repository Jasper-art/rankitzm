import { useContext } from 'react';
import { ThemeContext, Theme } from '../context/ThemeContext';

interface UseThemeReturn {
  t: Theme;
  dark: boolean;
  setDark: (value: boolean) => void;
}

/**
 * Custom hook to access theme in any component
 * 
 * Usage:
 * const { t, dark, setDark } = useTheme();
 * 
 * Then use:
 * - t.accent - accent color
 * - t.bg - background color
 * - dark - boolean for dark mode check
 * - setDark(true) - toggle dark mode
 */
export function useTheme(): UseThemeReturn {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used within a ThemeProvider. ' +
      'Make sure your component is wrapped with <ThemeProvider> in your App component.'
    );
  }

  return context;
}