'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

// Force dynamic rendering to avoid Clerk validation during static generation in CI
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="mx-auto max-w-md space-y-8 px-4 text-center">
        {/* 404 Illustration */}
        <div className="relative">
          <h1 className="text-9xl font-black text-muted-foreground/20">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-24 rounded-full bg-destructive/10 animate-pulse" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" onClick={() => window.history.back()}>
            <button type="button">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </button>
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-sm text-muted-foreground">
          Need help?{' '}
          <Link href="/dashboard" className="font-medium text-primary hover:underline">
            Visit the dashboard
          </Link>{' '}
          or check your URL.
        </p>
      </div>
    </div>
  );
}
