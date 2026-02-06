# 🔧 Phase 1 Fixes - Prisma 7 & Docker Migration

**Date:** February 6, 2026  
**Status:** ✅ All Issues Resolved

---

## 🐛 Issues Encountered

### 1. Docker Compose Build Context Errors
**Problem:**  
```
unable to prepare context: path "C:\\...\\sentinel-v3\\infrastructure\\brain" not found
```

**Root Cause:**  
Build contexts were using relative paths (`./brain`, `./web`) from the infrastructure directory, but the actual folders are at the monorepo root.

**Solution:**  
Updated all build contexts and volume mounts in `docker-compose.yml`:
- `context: ./brain` → `context: ../brain`
- `context: ./web` → `context: ../web`
- `./brain:/app` → `../brain:/app`
- `./web:/app` → `../web:/app`
- `./infrastructure/init-db.sql` → `./init-db.sql`

---

### 2. Prisma 7 Schema Validation Error
**Problem:**  
```
error: The datasource property `url` is no longer supported in schema files.
Error code: P1012
```

**Root Cause:**  
Prisma 7.x removed the `url` property from the `datasource` block in `schema.prisma`. Connection URLs must now be configured in a `prisma.config.ts` file.

**Solution:**

#### Step 1: Remove `url` from schema.prisma
```prisma
// Before
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // ❌ No longer supported
  extensions = [pgvector(map: "vector", schema: "public")]
}

// After
datasource db {
  provider = "postgresql"
  extensions = [pgvector(map: "vector", schema: "public")]
}
```

#### Step 2: Create `web/prisma.config.ts`
```typescript
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
    url: process.env.DATABASE_URL || '',
  },
});
```

#### Step 3: Install dotenv
```bash
npm install dotenv
```

**Key Points:**
- `prisma.config.ts` is now the source of truth for datasource URLs
- Must explicitly load `.env.local` using dotenv (default only loads `.env`)
- Use `process.env.DATABASE_URL || ''` instead of `env()` helper to allow `prisma generate` without DATABASE_URL

---

### 3. Prisma Schema Relation Error
**Problem:**  
```
The relation field `user` on model `GlobalStats` is missing an opposite relation field on the model `User`
```

**Solution:**  
Added the missing relation to the `User` model:
```prisma
model User {
  // ... other fields
  globalStats   GlobalStats?  // ✅ Added
}
```

---

### 4. Prisma 7 Client Initialization Error
**Problem:**  
```
PrismaClientConstructorValidationError: Using engine type "client" requires either "adapter" or "accelerateUrl"
```

**Root Cause:**  
Prisma 7.3.0 with `prisma.config.ts` uses the JavaScript-based engine ("client" engine type) instead of the Rust engine. This requires a driver adapter for PostgreSQL connections.

**Solution:**

#### Install PostgreSQL Driver Adapter
```bash
npm install @prisma/adapter-pg pg
```

#### Update `web/src/lib/prisma.ts`
```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

function createPrismaClient() {
  const pool = globalForPrisma.pool ?? new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
}
```

#### Update `web/prisma/seed.ts`
```typescript
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ... rest of seed script
```

---

## ✅ Testing Results

### Database Setup (Local)
```bash
cd prime-pentrix/infrastructure
docker-compose up -d postgres  # ✅ PostgreSQL started successfully

cd ../web
npm run db:generate  # ✅ Generated Prisma Client v7.3.0
npm run db:push      # ✅ Schema synced (12 models, pgvector extension)
npm run db:seed      # ✅ Seeded 8 subjects successfully
```

**Seed Output:**
```
✅ Created/Updated: Computer Networks (CS-NET-S2)
✅ Created/Updated: Web Pentesting Fundamentals (CS-PENTEST-S2)
✅ Created/Updated: Web Backend (CS-BACKEND-S2)
✅ Created/Updated: Linux for Ethical Hackers (CS-LINUX-S2)
✅ Created/Updated: Capture the Flag (CS-CTF-S2)
✅ Created/Updated: Scripting & Code Analysis (CS-SCRIPT-S2)
✅ Created/Updated: Data Privacy & IT Law (CS-LAW-S2)
✅ Created/Updated: AI x Cybersecurity (CS-AISEC-S2)
```

---

## 📦 New Dependencies Added

| Package | Version | Purpose |
|---------|---------|---------|
| `dotenv` | 17.x | Load environment variables in prisma.config.ts |
| `@prisma/adapter-pg` | Latest | PostgreSQL driver adapter for Prisma 7 |
| `pg` | Latest | PostgreSQL client library |

Total: **563 packages** installed (546 base + 17 new)

---

## 📚 Prisma 7 Migration Guide

### Key Changes from Prisma 6 → 7

1. **Datasource URL Configuration**  
   - ❌ Old: `url` in `schema.prisma`  
   - ✅ New: `datasource.url` in `prisma.config.ts`

2. **Client Initialization**  
   - ❌ Old: `new PrismaClient()` (empty constructor)  
   - ✅ New: Requires driver adapter: `new PrismaClient({ adapter })`

3. **Environment Variables**  
   - Must manually configure dotenv in `prisma.config.ts`  
   - Default only loads `.env`, not `.env.local`

4. **Engine Type**  
   - Prisma 7 defaults to JavaScript-based engine ("client")  
   - No more binary downloads in `node_modules/.prisma/client`  
   - Requires driver adapters for database connections

5. **Seed Command**  
   - No longer auto-runs after `migrate dev` or `migrate reset`  
   - Must explicitly run `npx prisma db seed`

### Recommended Commands

```bash
# Development workflow
npm run db:generate  # Generate Prisma Client
npm run db:push      # Sync schema (no migration files)
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio

# Production workflow
npm run db:migrate   # Create and apply migrations
npm run db:seed      # Seed production data
```

---

## 🚀 Next Steps

### For Local Development
1. ✅ PostgreSQL is running in Docker
2. ✅ Schema is pushed to database
3. ✅ Database is seeded with 8 subjects
4. ⏭️ Start Next.js dev server: `cd web && npm run dev`
5. ⏭️ Configure Clerk API keys in `.env.local`

### For Docker Compose Full Stack
1. ⏭️ Add API keys to `infrastructure/.env`
2. ⏭️ Build and start all services: `docker-compose up --build`
3. ⏭️ Access at:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000
   - Database: localhost:5432

---

## 📋 Files Modified

### Created
- `web/prisma.config.ts` - Prisma 7 configuration file
- `infrastructure/.env` - Docker Compose environment template

### Modified
- `infrastructure/docker-compose.yml` - Fixed build contexts and volume paths
- `web/prisma/schema.prisma` - Removed datasource URL, added GlobalStats relation
- `web/src/lib/prisma.ts` - Added PostgreSQL adapter initialization
- `web/prisma/seed.ts` - Added adapter for Prisma Client
- `web/package.json` - Added dotenv, @prisma/adapter-pg, pg (via npm install)

---

## 🔗 References

- [Prisma 7 Config Reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference)
- [Prisma 7 Driver Adapters](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/no-rust-engine)
- [PostgreSQL Adapter Documentation](https://www.prisma.io/docs/orm/overview/databases/database-drivers#postgresql)

---

**🎉 Phase 1 Complete with Prisma 7 Migration!**
