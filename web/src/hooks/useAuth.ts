'use client';

import { useAuth as useClerkAuth } from '@clerk/nextjs';
import { isE2EMode } from '@/components/providers/clerk-provider-wrapper';

// Mock auth data for E2E tests
const mockAuth = {
  userId: 'e2e-test-user-id',
  sessionId: 'e2e-test-session-id',
  orgId: null,
  orgRole: null,
  orgSlug: null,
  isLoaded: true,
  isSignedIn: true,
  actor: null,
  has: () => false,
  getToken: async () => 'mock-token',
  signOut: async () => {},
};

/**
 * Wrapper hook for Clerk's useAuth that returns mock data in E2E test mode
 */
export function useAuth() {
  if (isE2EMode()) {
    return mockAuth;
  }
  return useClerkAuth();
}
