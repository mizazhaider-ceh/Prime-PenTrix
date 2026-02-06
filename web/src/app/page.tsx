import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap, Shield, Brain, ArrowRight, Terminal, BookOpen, Cpu } from 'lucide-react';

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Background decorative elements */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl animate-breathe" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-primary/8 blur-3xl animate-breathe" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-primary/5 blur-3xl animate-breathe" style={{ animationDelay: '3s' }} />
      </div>

      {/* Nav bar */}
      <nav className="relative z-10 border-b border-border/30 glass">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 animate-pulse-glow">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="font-outfit text-lg font-bold tracking-tight">Prime PenTrix</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="gap-2 shadow-lg shadow-primary/20">
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-20">
        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            Powered by Multi-AI Architecture
          </div>

          {/* Title */}
          <h1 className="animate-fade-in-up mb-6 font-outfit text-6xl font-black leading-[1.1] tracking-tight md:text-7xl" style={{ animationDelay: '0.1s' }}>
            Your <span className="text-gradient-animated">AI Study</span>
            <br />
            <span className="text-gradient-animated">Companion</span> for CS
          </h1>

          <p className="animate-fade-in-up mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground" style={{ animationDelay: '0.2s' }}>
            Hyper-intelligent platform for Semester 2 CS students at Howest University Belgium.
            Master Networks, Pentesting, Backend, Linux, CTF, Scripting, Privacy Law & AI Security.
          </p>

          {/* CTA */}
          <div className="animate-fade-in-up flex items-center justify-center gap-4" style={{ animationDelay: '0.3s' }}>
            <Link href="/sign-up">
              <Button size="lg" className="gap-2 px-8 shadow-xl shadow-primary/25 transition-all hover:shadow-2xl hover:shadow-primary/30">
                <Sparkles className="h-5 w-5" />
                Get Started Free
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5">
                <Terminal className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="animate-fade-in-up mt-16 flex items-center justify-center gap-8 md:gap-16" style={{ animationDelay: '0.4s' }}>
            {[
              { value: '8', label: 'Subjects' },
              { value: '24+', label: 'Tools' },
              { value: '12', label: 'Themes' },
              { value: 'Multi-AI', label: 'Engine' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-outfit text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Feature Cards */}
          <div className="mt-20 grid gap-6 md:grid-cols-3 stagger-children">
            {[
              {
                icon: Zap,
                title: 'AI-Powered Learning',
                desc: 'Context-aware AI that adapts to each subject\'s pedagogy and your learning style',
                gradient: 'from-yellow-500/20 to-orange-500/20',
              },
              {
                icon: Shield,
                title: 'Security-First Tools',
                desc: '24+ specialized cybersecurity tools for networks, pentesting, and privacy analysis',
                gradient: 'from-blue-500/20 to-cyan-500/20',
              },
              {
                icon: Brain,
                title: 'Smart Analytics',
                desc: 'Track progress, streaks, and quiz performance with intelligent spaced repetition',
                gradient: 'from-purple-500/20 to-pink-500/20',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="animate-fade-in-up glass card-hover group rounded-2xl border border-border/30 p-8 text-left"
              >
                <div className={`mb-5 inline-flex rounded-xl bg-gradient-to-br ${feature.gradient} p-3`}>
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-3 font-outfit text-xl font-bold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Subject pills */}
          <div className="mt-16">
            <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Covering All Your Courses
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { name: 'Networks', color: '#3b82f6' },
                { name: 'Pentesting', color: '#ef4444' },
                { name: 'Backend', color: '#22c55e' },
                { name: 'Linux', color: '#f59e0b' },
                { name: 'CTF', color: '#8b5cf6' },
                { name: 'Scripting', color: '#06b6d4' },
                { name: 'Privacy Law', color: '#ec4899' },
                { name: 'AI Security', color: '#f97316' },
              ].map((s) => (
                <span
                  key={s.name}
                  className="rounded-full border px-4 py-1.5 text-sm font-medium transition-all hover:scale-105"
                  style={{
                    borderColor: `${s.color}40`,
                    backgroundColor: `${s.color}10`,
                    color: s.color,
                  }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Built by <span className="text-primary font-semibold">MIHx0</span> (Muhammad Izaz
          Haider) • Howest University 🇧🇪 • Version 3.0.0
        </div>
      </footer>
    </div>
  );
}
