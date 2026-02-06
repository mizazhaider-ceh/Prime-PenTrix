import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load .env.local first, then .env as fallback
dotenv.config({ path: '.env.local' });
dotenv.config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Use process.env directly to allow prisma generate without DATABASE_URL
    url: process.env.DATABASE_URL || '',
  },
});
