import { ReactNode } from 'react';

// Force dynamic rendering for all authenticated routes to avoid Clerk validation during static generation in CI
export const dynamic = 'force-dynamic';

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
