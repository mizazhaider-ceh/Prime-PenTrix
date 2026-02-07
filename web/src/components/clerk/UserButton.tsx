'use client';

import { UserButton as ClerkUserButton, SignedIn as ClerkSignedIn, SignedOut as ClerkSignedOut } from '@clerk/nextjs';
import { isE2EMode } from '@/components/providers/clerk-provider-wrapper';
import { ReactNode } from 'react';

// Mock UserButton for E2E tests
function MockUserButton() {
  return (
    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
      E2E
    </div>
  );
}

/**
 * Wrapper for Clerk's UserButton that returns mock UI in E2E test mode
 */
export function UserButton(props: any) {
  if (isE2EMode()) {
    return <MockUserButton />;
  }
  return <ClerkUserButton {...props} />;
}

/**
 * Wrapper for Clerk's SignedIn that shows children in E2E test mode (simulating signed-in state)
 */
export function SignedIn({ children }: { children: ReactNode }) {
  if (isE2EMode()) {
    return <>{children}</>;
  }
  return <ClerkSignedIn>{children}</ClerkSignedIn>;
}

/**
 * Wrapper for Clerk's SignedOut that hides children in E2E test mode (simulating signed-in state)
 */
export function SignedOut({ children }: { children: ReactNode }) {
  if (isE2EMode()) {
    return null;
  }
  return <ClerkSignedOut>{children}</ClerkSignedOut>;
}

