'use client';

import { UserButton } from '@clerk/nextjs';
import { ThemeSwitcher } from './theme-switcher';
import { Sparkles, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 glass">
      {/* Accent top border */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo & Branding */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary/20">
            <Sparkles className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 rounded-xl bg-primary/5 animate-pulse-glow" />
          </div>
          <div>
            <h1 className="font-outfit text-xl font-bold tracking-tight">
              Prime <span className="text-gradient">PenTrix</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">AI Study Platform</p>
          </div>
        </Link>

        {/* Center - Navigation (future) */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary bg-primary/10 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <div className="h-6 w-px bg-border/50" />
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-9 w-9 ring-2 ring-primary/20 ring-offset-2 ring-offset-background',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
