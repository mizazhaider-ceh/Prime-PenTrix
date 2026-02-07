'use client';

import Link from 'next/link';
import { Footer } from '@/components/footer';
import {
  Sparkles,
  ArrowLeft,
  Shield,
  Brain,
  MessageSquare,
  FileText,
  Zap,
  GraduationCap,
  Code2,
  Globe,
  Database,
  Lock,
  Layers,
  Cpu,
  BookOpen,
  Terminal,
  Network,
  Bug,
  Server,
  KeyRound,
  Palette,
  Github,
  Linkedin,
  MonitorSmartphone,
  Rocket,
  Heart,
} from 'lucide-react';
import { UserButton, SignedIn, SignedOut } from '@/components/clerk/UserButton';
import { ThemeSwitcher } from '@/components/theme-switcher';

/* ─── Data ─── */

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Chat',
    description:
      'Context-aware conversations using RAG (Retrieval-Augmented Generation) with multi-provider support — Cerebras, Gemini, and OpenAI.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: FileText,
    title: 'Document Intelligence',
    description:
      'Upload PDFs and documents. The RAG engine chunks, embeds, and indexes them for precise, citation-backed answers.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    icon: GraduationCap,
    title: 'AI Quiz System',
    description:
      'Auto-generated quizzes with AI grading. Practice MCQs, true/false, and open-ended questions per subject.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    icon: Code2,
    title: 'Security Toolkit',
    description:
      'Built-in tools for networks, pentesting, CTF, scripting, Linux, backend, and privacy — all subject-aware.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  {
    icon: Palette,
    title: '12+ Themes',
    description:
      'From Prime Emerald to Hacker, Cyber, Nebula, Aurora — every theme is glassmorphic and fully responsive.',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
  },
  {
    icon: MonitorSmartphone,
    title: 'Fully Responsive',
    description:
      'Modern rem-based CSS, fluid layouts, and mobile-first design. Works beautifully on every screen size.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
] as const;

const subjects = [
  { icon: Network, name: 'Networks', color: 'text-blue-400', border: 'border-blue-400/30' },
  { icon: Bug, name: 'Pentesting', color: 'text-red-400', border: 'border-red-400/30' },
  { icon: Server, name: 'Backend', color: 'text-green-400', border: 'border-green-400/30' },
  { icon: Terminal, name: 'Linux', color: 'text-amber-400', border: 'border-amber-400/30' },
  { icon: Shield, name: 'CTF', color: 'text-purple-400', border: 'border-purple-400/30' },
  { icon: Code2, name: 'Scripting', color: 'text-cyan-400', border: 'border-cyan-400/30' },
  { icon: KeyRound, name: 'Privacy', color: 'text-pink-400', border: 'border-pink-400/30' },
  { icon: BookOpen, name: 'General', color: 'text-gray-400', border: 'border-gray-400/30' },
] as const;

const techStack = [
  { category: 'Frontend', items: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'Radix UI', 'shadcn/ui'] },
  { category: 'AI / ML', items: ['RAG Engine', 'Cerebras', 'Gemini', 'OpenAI', 'BM25 + Vector Search', 'AI Grading', 'Prompt Engineering'] },
  { category: 'Backend', items: ['Next.js API Routes', 'Prisma ORM', 'PostgreSQL + pgvector', 'Clerk Auth'] },
  { category: 'Security', items: ['Cybersecurity Knowledge', 'Pentesting Tools', 'CTF Toolkit', 'Network Analysis', 'Linux Hardening'] },
  { category: 'DevOps', items: ['Turbopack', 'Jest 30', 'Playwright', 'Docker', 'ESLint'] },
] as const;

/* ─── Page ─── */

export default function InfoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass">
        <div className="h-[0.125rem] w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <SignedIn>
              <div className="h-6 w-px bg-border/50" />
              <UserButton
                appearance={{
                  elements: {
                    avatarBox:
                      'h-9 w-9 ring-2 ring-primary/20 ring-offset-2 ring-offset-background',
                  },
                }}
              />
            </SignedIn>
            <SignedOut>
              <Link
                href="/sign-in"
                className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              >
                Sign In
              </Link>
            </SignedOut>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          {/* Background decorations */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-primary/3 blur-3xl" />
          </div>

          <div className="container relative mx-auto px-4 sm:px-6 text-center">
            {/* Logo */}
            <div className="animate-fade-in-up mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 shadow-lg shadow-primary/20">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>

            <h1
              className="animate-fade-in-up font-outfit text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl"
              style={{ animationDelay: '0.1s' }}
            >
              Prime{' '}
              <span className="text-gradient-animated">PenTrix</span>
            </h1>

            <p
              className="animate-fade-in-up mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
              style={{ animationDelay: '0.2s' }}
            >
              Where Penetration Testing Meets Intelligence — an AI-Powered
              Study Platform for CS Engineering at{' '}
              <a
                href="https://howest.be"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary transition-colors hover:underline"
              >
                Howest University Belgium
              </a>
            </p>

            {/* Version badge */}
            <div
              className="animate-fade-in-up mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary"
              style={{ animationDelay: '0.3s' }}
            >
              <Zap className="h-3.5 w-3.5" />
              Sentinel v3 — Full-Stack AI Platform
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mb-10 text-center">
              <h2 className="font-outfit text-2xl font-bold sm:text-3xl">
                Core <span className="text-gradient">Features</span>
              </h2>
              <p className="mt-2 text-muted-foreground">
                Everything you need to master cybersecurity & CS engineering
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="animate-fade-in-up glass card-hover group rounded-2xl border border-border/30 p-6"
                >
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-outfit text-lg font-bold">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Subjects */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mb-10 text-center">
              <h2 className="font-outfit text-2xl font-bold sm:text-3xl">
                Semester 2{' '}
                <span className="text-gradient">Subjects</span>
              </h2>
              <p className="mt-2 text-muted-foreground">
                Howest CS Engineering — specialised AI assistance for every course
              </p>
            </div>

            <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              {subjects.map((subject) => (
                <div
                  key={subject.name}
                  className={`flex flex-col items-center gap-2.5 rounded-xl border ${subject.border} bg-background/30 p-4 transition-all duration-200 hover:bg-background/50 hover:shadow-md`}
                >
                  <subject.icon
                    className={`h-7 w-7 ${subject.color}`}
                  />
                  <span className="text-sm font-medium">
                    {subject.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mb-10 text-center">
              <h2 className="font-outfit text-2xl font-bold sm:text-3xl">
                Tech <span className="text-gradient">Stack</span>
              </h2>
              <p className="mt-2 text-muted-foreground">
                Modern, performant, production-ready
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {techStack.map((group) => (
                <div
                  key={group.category}
                  className="glass rounded-2xl border border-border/30 p-5"
                >
                  <h3 className="mb-3 font-outfit text-sm font-bold uppercase tracking-wider text-primary">
                    {group.category}
                  </h3>
                  <ul className="space-y-1.5">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <span className="h-1 w-1 rounded-full bg-primary/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Architecture */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border/30 glass">
              <div className="border-b border-border/20 px-6 py-4">
                <h2 className="font-outfit text-xl font-bold">
                  <Layers className="mr-2 inline-block h-5 w-5 text-primary" />
                  Architecture
                </h2>
              </div>
              <div className="grid gap-px bg-border/10 sm:grid-cols-3">
                {[
                  {
                    icon: Globe,
                    title: 'Frontend',
                    desc: 'Next.js 16 + React 19 with Tailwind v4, Radix UI, glassmorphic themes, dynamic imports',
                  },
                  {
                    icon: Cpu,
                    title: 'AI Engine',
                    desc: 'RAG pipeline — PDF chunking, vector embeddings (pgvector), BM25 + semantic search, AI grading',
                  },
                  {
                    icon: Database,
                    title: 'Data Layer',
                    desc: 'PostgreSQL + pgvector, Prisma ORM, Clerk auth, RESTful API routes, IndexedDB caching',
                  },
                ].map((layer) => (
                  <div
                    key={layer.title}
                    className="bg-background/20 p-5"
                  >
                    <layer.icon className="mb-3 h-6 w-6 text-primary" />
                    <h3 className="font-outfit text-sm font-bold">
                      {layer.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {layer.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* About the Creator */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-outfit text-2xl font-bold sm:text-3xl">
                Built by{' '}
                <span className="text-gradient">MIHx0</span>
              </h2>

              <div className="mt-8 glass rounded-2xl border border-border/30 p-6 sm:p-8">
                {/* Avatar placeholder */}
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10">
                  <span className="font-outfit text-2xl font-black text-primary">
                    MI
                  </span>
                </div>

                <h3 className="font-outfit text-xl font-bold">
                  Muhammad Izaz Haider
                </h3>
                <p className="mt-1 text-sm text-primary font-medium">
                  CS Engineering Student — Howest University Belgium
                </p>
                <p className="mt-4 mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                  Full-stack engineer specialising in AI/ML, cybersecurity, and
                  modern web platforms. Creator of Sentinel Copilot (v1-v3), The
                  PenTrix, and Damno Solutions.
                </p>

                {/* Social links */}
                <div className="mt-6 flex justify-center gap-3">
                  {[
                    {
                      href: 'https://github.com/MIHx0',
                      icon: Github,
                      label: 'GitHub',
                    },
                    {
                      href: 'https://linkedin.com/in/muhammadizazhaider',
                      icon: Linkedin,
                      label: 'LinkedIn',
                    },
                    {
                      href: 'https://thepentrix.com',
                      icon: Globe,
                      label: 'Website',
                    },
                  ].map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/30 bg-background/30 text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:text-primary hover:shadow-md hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <social.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>

              {/* University badge */}
              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border/30 bg-background/30 px-5 py-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 text-primary" />
                Howest University Belgium 🇧🇪 — Semester 2 CS Engineering
              </div>
            </div>
          </div>
        </section>

        {/* Why I Built This */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <div className="mb-10 text-center">
                <h2 className="font-outfit text-2xl font-bold sm:text-3xl">
                  Why I <span className="text-gradient">Built This</span>
                </h2>
                <p className="mt-2 text-muted-foreground">
                  The story behind Prime PenTrix
                </p>
              </div>

              <div className="glass rounded-2xl border border-border/30 p-6 sm:p-8 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Rocket className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-outfit text-base font-bold mb-1">Pushing My Boundaries</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      I believe growth happens outside the comfort zone. This project was my way of pushing every boundary I knew
                      — from building a full-stack AI platform from scratch to implementing RAG pipelines, vector databases, 
                      real-time streaming, and production-grade architecture. Every challenge taught me something new.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-outfit text-base font-bold mb-1">Learning by Building</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      I love to learn practically — not just reading docs but actually building something real. Sentinel V3 
                      evolved through three major versions, each one more ambitious than the last. From a simple copilot 
                      to a full AI-powered study platform with quiz generation, document intelligence, and cybersecurity toolkits.
                      This project taught me more about AI, security, and engineering than any course ever could.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-outfit text-base font-bold mb-1">Bridging AI &amp; Cybersecurity</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      As a CS engineering student specialising in cybersecurity at Howest, I saw a gap — no single platform 
                      combined AI assistance with deep cybersecurity knowledge for students. Prime PenTrix fills that gap:
                      subject-aware chat, pentesting toolkits, CTF helpers, Linux guides, network analysis — all powered 
                      by modern AI with proper context and grounding through RAG.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-outfit text-2xl font-bold sm:text-3xl">
              Ready to <span className="text-gradient">Learn</span>?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Jump back in and start exploring
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-outfit text-sm font-bold text-primary-foreground transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Sparkles className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
