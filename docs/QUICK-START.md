# 🚀 Quick Start Guide - Prime PenTrix

This guide gets you up and running in 5 minutes.

---

## ✅ Prerequisites

- **Node.js 20+** ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/downloads))

---

## 🏃 Quick Start (Local Dev)

### 1. Start PostgreSQL

```bash
cd prime-pentrix/infrastructure
docker-compose up -d postgres
```

✅ PostgreSQL is now running at `localhost:5432`

### 2. Setup Frontend

```bash
cd ../web
npm install
```

### 3. Configure Environment

Edit `web/.env.local` with your database URL:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/prime_pentrix?schema=public"
```

### 4. Initialize Database

```bash
npm run db:generate  # Generate Prisma Client
npm run db:push      # Create tables
npm run db:seed      # Add 8 subjects
```

✅ Output should show:
```
✅ Created/Updated: Computer Networks (CS-NET-S2)
✅ Created/Updated: Web Pentesting Fundamentals (CS-PENTEST-S2)
... (6 more subjects)
```

### 5. Get Clerk Keys

1. Go to [clerk.com](https://clerk.com) and sign up
2. Create a new application
3. Copy these keys to `web/.env.local`:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

### 6. Start Dev Server

```bash
npm run dev
```

🚀 Open http://localhost:3000

---

## 🐳 Docker Full Stack (Alternative)

### 1. Configure Environment

Add your Clerk keys to `infrastructure/.env`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 2. Build & Start

```bash
cd prime-pentrix/infrastructure
docker-compose up --build
```

### 3. Initialize Database

In a new terminal:

```bash
cd ../web
npm run db:generate
npm run db:push
npm run db:seed
```

🚀 Open http://localhost:3000

---

## 🔧 Troubleshooting

### "Connection url is empty"

**Problem:** Prisma can't find DATABASE_URL.

**Solution:** Make sure `.env.local` exists in `web/` directory and contains:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/prime_pentrix?schema=public"
```

### "Module not found: @prisma/client"

**Solution:**
```bash
cd web
npm install
npm run db:generate
```

### Docker build fails with "context not found"

**Solution:** Make sure you're running `docker-compose` from the `infrastructure/` directory, not the project root.

### "Port 5432 already in use"

**Solution:** You have PostgreSQL already running locally. Either:
- Stop your local PostgreSQL: `brew services stop postgresql` (macOS) or `sudo systemctl stop postgresql` (Linux)
- OR change the port in `docker-compose.yml`: `"5433:5432"`

---

## 📋 Development Commands

### Database

```bash
npm run db:generate  # Generate Prisma Client
npm run db:push      # Sync schema (no migrations)
npm run db:migrate   # Create migration files
npm run db:seed      # Seed with subjects
npm run db:studio    # Open Prisma Studio GUI
```

### Development

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

---

## 📚 Next Steps

1. **Read the docs**: See `docs/PHASE-1-COMPLETE.md` for full Phase 1 details
2. **Configure Clerk webhook**: See README.md "Clerk Setup" section
3. **Explore the codebase**: Start with `web/src/app/page.tsx`
4. **Check database**: Run `npm run db:studio` to see seeded data

---

## 🆘 Need Help?

- **Phase 1 Complete**: `docs/PHASE-1-COMPLETE.md`
- **Prisma 7 Fixes**: `docs/PHASE-1-FIXES.md`
- **Technical Details**: `docs/TECHNICAL.md`
- **Architecture**: `docs/HOW_IT_WORKS.md`

---

**Happy coding! 🎉**
