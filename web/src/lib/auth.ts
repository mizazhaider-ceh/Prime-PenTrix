import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════
// AUTH WRAPPER — Eliminates boilerplate in API routes
// Usage: export const POST = withAuth(async (req, user) => { ... });
// ═══════════════════════════════════════════════════════════════

type AuthenticatedHandler = (
  req: NextRequest,
  user: User
) => Promise<Response | NextResponse>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest) => {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req, user);
  };
}

/**
 * Get the authenticated user from the database, auto-creating if needed.
 * This ensures the user exists in our DB even without the Clerk webhook.
 */
export async function getAuthUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Try to find existing user first
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (user) return user;

  // User not in DB yet — auto-sync from Clerk
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  try {
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
        name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || 'User',
        avatarUrl: clerkUser.imageUrl ?? null,
      },
    });
  } catch (error) {
    console.error('Error creating user from Clerk data:', error);
    // Try to find user again in case of race condition
    user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user) throw error;
  }

  return user;
}
