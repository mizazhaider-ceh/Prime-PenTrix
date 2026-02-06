import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

function createPrismaClient() {
  // Create a PostgreSQL connection pool
  const pool =
    globalForPrisma.pool ??
    new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });

  // Create Prisma adapter
  const adapter = new PrismaPg(pool);

  // Create Prisma Client with adapter
  return new PrismaClient({ adapter });
}

// Prisma 7 with driver adapter for PostgreSQL
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
}
