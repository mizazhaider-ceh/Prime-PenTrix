import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

// Mock ClerkProvider for E2E tests - bypasses Clerk validation
function MockClerkProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

interface ClerkProviderWrapperProps {
  children: ReactNode;
  appearance?: any;
  signInUrl?: string;
  signUpUrl?: string;
  afterSignInUrl?: string;
  afterSignUpUrl?: string;
}

// Check if running in E2E test mode (server-side env var)
export const isE2EMode = () => process.env.E2E_TEST === 'true';

export function ClerkProviderWrapper({
  children,
  appearance,
  signInUrl,
  signUpUrl,
  afterSignInUrl,
  afterSignUpUrl,
}: ClerkProviderWrapperProps) {
  // Use mock provider in E2E test environment
  if (isE2EMode()) {
    return <MockClerkProvider>{children}</MockClerkProvider>;
  }

  return (
    <ClerkProvider
      appearance={appearance}
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      afterSignInUrl={afterSignInUrl}
      afterSignUpUrl={afterSignUpUrl}
    >
      {children}
    </ClerkProvider>
  );
}
