'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode, useEffect, useState } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

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
