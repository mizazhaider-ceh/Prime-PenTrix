'use client';

import Link from 'next/link';
import {
  Sparkles,
  Github,
  Linkedin,
  Globe,
  GraduationCap,
  Shield,
  BookOpen,
  MessageSquare,
  Cpu,
  Heart,
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

const socialLinks = [
  {
    href: 'https://github.com/MIHx0',
    label: 'GitHub',
    icon: Github,
  },
  {
    href: 'https://linkedin.com/in/muhammadizazhaider',
    label: 'LinkedIn',
    icon: Linkedin,
  },
  {
    href: 'https://thepentrix.com',
    label: 'Website',
    icon: Globe,
  },
] as const;

const featureLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Sparkles },
  { href: '/info', label: 'About', icon: BookOpen },
] as const;

const resourceLinks = [
  {
    href: 'https://howest.be',
    label: 'Howest University',
    external: true,
  },
  {
    href: 'https://cloud.cerebras.ai',
    label: 'Cerebras AI',
    external: true,
  },
  {
    href: 'https://aistudio.google.com',
    label: 'Google AI Studio',
    external: true,
  },
  {
    href: 'https://github.com/MIHx0/S2-Sentinel-Copilot',
    label: 'Source Code',
    external: true,
  },
] as const;

const techStack = [
  { label: 'Next.js', icon: Globe },
  { label: 'Tailwind', icon: Sparkles },
  { label: 'AI/RAG', icon: Cpu },
  { label: 'PostgreSQL', icon: Shield },
] as const;

export function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-border/30">
      {/* Accent gradient line */}
      <div className="h-[0.125rem] w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="glass-dark">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Main grid — responsive: 1 col mobile, 2 cols tablet, 4 cols desktop */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand Column */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link
                href="/dashboard"
                className="group mb-4 inline-flex items-center gap-2.5"
              >
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary/20">
                  <Sparkles className="h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div>
                  <span className="font-outfit text-lg font-bold tracking-tight text-foreground">
                    Prime{' '}
                    <span className="text-gradient">PenTrix</span>
                  </span>
                </div>
              </Link>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                AI-Powered Study Platform for CS Engineering — Where
                Penetration Testing Meets Intelligence.
              </p>

              {/* Social Icons */}
              <div className="mt-5 flex gap-2.5">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/30 bg-background/30 text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:text-foreground hover:shadow-md hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <link.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Features Column */}
            <nav aria-label="Features">
              <h4 className="mb-4 font-outfit text-sm font-bold uppercase tracking-wider text-foreground">
                Features
              </h4>
              <ul className="space-y-2.5">
                {featureLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                    >
                      <link.icon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground/50">
                    <MessageSquare className="h-3.5 w-3.5" />
                    AI Chat
                  </span>
                </li>
                <li>
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground/50">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Quiz System
                  </span>
                </li>
              </ul>
            </nav>

            {/* Resources Column */}
            <nav aria-label="Resources">
              <h4 className="mb-4 font-outfit text-sm font-bold uppercase tracking-wider text-foreground">
                Resources
              </h4>
              <ul className="space-y-2.5">
                {resourceLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                    >
                      {link.label}
                      <svg
                        className="h-3 w-3 opacity-50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Tech Stack Column */}
            <div>
              <h4 className="mb-4 font-outfit text-sm font-bold uppercase tracking-wider text-foreground">
                Built With
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {techStack.map((tech) => (
                  <div
                    key={tech.label}
                    className="flex items-center gap-2 rounded-lg border border-border/20 bg-background/20 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:border-primary/30 hover:text-foreground"
                  >
                    <tech.icon className="h-3.5 w-3.5 text-primary/70" />
                    {tech.label}
                  </div>
                ))}
              </div>

              {/* Company */}
              <div className="mt-5">
                <h4 className="mb-3 font-outfit text-sm font-bold uppercase tracking-wider text-foreground">
                  Company
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="https://thepentrix.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                    >
                      The PenTrix
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://damno.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                    >
                      Damno Solutions
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/20 pt-6 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              &copy; {CURRENT_YEAR} Prime PenTrix. Created by{' '}
              <span className="font-semibold text-primary">
                Muhammad Izaz Haider (MIHx0)
              </span>
            </p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Powered by{' '}
              <span className="font-semibold text-primary">The PenTrix</span>
              <span className="mx-1">|</span>
              Built with <Heart className="inline h-3 w-3 text-red-400" /> for
              Howest University 🇧🇪
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
