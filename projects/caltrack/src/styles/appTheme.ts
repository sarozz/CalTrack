import React from 'react';

export type Scheme = 'light' | 'dark';

export type AppColors = {
  bg: string;
  card: string;
  card2: string;
  text: string;
  subtext: string;
  border: string;
  accent: string;
  accentSoft: string;
};

export function colorsForScheme(scheme: Scheme): AppColors {
  if (scheme === 'dark') {
    // Discord-ish bluish dark
    return {
      bg: '#0B1220',
      card: '#111827',
      card2: '#0F172A',
      text: 'rgba(255,255,255,0.92)',
      subtext: 'rgba(255,255,255,0.62)',
      border: 'rgba(255,255,255,0.10)',
      accent: 'rgba(236, 72, 153, 0.95)',
      accentSoft: 'rgba(236, 72, 153, 0.16)',
    };
  }

  return {
    bg: '#f6f6f6',
    card: '#ffffff',
    card2: '#fafafa',
    text: '#111111',
    subtext: 'rgba(17,17,17,0.60)',
    border: 'rgba(0,0,0,0.10)',
    accent: 'rgba(236, 72, 153, 0.9)',
    accentSoft: 'rgba(236, 72, 153, 0.12)',
  };
}

export const ThemeCtx = React.createContext<{
  scheme: Scheme;
  setScheme: (s: Scheme) => void;
  colors: AppColors;
} | null>(null);

export function useAppTheme() {
  const v = React.useContext(ThemeCtx);
  if (!v) throw new Error('ThemeCtx missing');
  return v;
}
