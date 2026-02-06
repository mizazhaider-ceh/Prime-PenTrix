'use client';

import { useTheme } from 'next-themes';
import { Monitor, Palette } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const themes = [
  { value: 'glass', label: 'Glass', icon: '💎' },
  { value: 'prime-dark', label: 'Prime Dark', icon: '⚡' },
  { value: 'hacker', label: 'Hacker', icon: '💻' },
  { value: 'midnight', label: 'Midnight', icon: '🌙' },
  { value: 'cyber', label: 'Cyber', icon: '⚡' },
  { value: 'ocean', label: 'Ocean', icon: '🌊' },
  { value: 'forest', label: 'Forest', icon: '🌲' },
  { value: 'nebula', label: 'Nebula', icon: '🌌' },
  { value: 'aurora', label: 'Aurora', icon: '🌈' },
  { value: 'sunset', label: 'Sunset', icon: '🌅' },
  { value: 'lavender', label: 'Lavender', icon: '💜' },
  { value: 'light', label: 'Light', icon: '☀️' },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 hover:bg-primary/10 transition-colors">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 p-1.5 glass border-border/30">
        <div className="mb-1 px-2 py-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Choose Theme</p>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {themes.map((t) => (
            <DropdownMenuItem
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`rounded-lg px-2.5 py-2 text-xs cursor-pointer transition-all ${
                theme === t.value
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'hover:bg-card/80'
              }`}
            >
              <span className="mr-1.5">{t.icon}</span>
              {t.label}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
