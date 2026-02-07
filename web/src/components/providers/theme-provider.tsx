'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="glass"
      themes={[
        'glass',
        'prime-dark',
        'hacker',
        'midnight',
        'cyber',
        'ocean',
        'forest',
        'nebula',
        'aurora',
        'sunset',
        'lavender',
        'light',
      ]}
      enableSystem={false}
      storageKey="prime-pentrix-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
