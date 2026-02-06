import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

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
