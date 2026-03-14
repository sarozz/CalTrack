import { DefaultTheme, DarkTheme, type Theme } from '@react-navigation/native';

export function makeNavTheme(mode: 'light' | 'dark'): Theme {
  const base = mode === 'dark' ? DarkTheme : DefaultTheme;

  if (mode === 'dark') {
    return {
      ...base,
      colors: {
        ...base.colors,
        background: '#0B0F1A',
        card: '#111827',
        text: '#FFFFFF',
        border: 'rgba(255,255,255,0.12)',
        primary: 'rgba(236, 72, 153, 0.95)',
        notification: 'rgba(236, 72, 153, 0.95)',
      },
    };
  }

  return {
    ...base,
    colors: {
      ...base.colors,
      background: '#f6f6f6',
      card: '#ffffff',
      text: '#111111',
      border: 'rgba(0,0,0,0.10)',
      primary: 'rgba(236, 72, 153, 0.9)',
      notification: 'rgba(236, 72, 153, 0.9)',
    },
  };
}
