# 🚀 Server Management Guide

Quick reference for starting, stopping, and managing the Prime PenTrix development server.

---

## Quick Commands

### Unified Server Manager (Recommended)
```cmd
# Run the interactive menu
server.bat

# Or double-click server.bat in File Explorer
```

**Available Options:**
- **[1]** Start Server - Launch Next.js dev server on port 3000
- **[2]** Stop Server - Kill all Node.js processes and clean locks
- **[3]** Restart Server - Stop then start fresh
- **[4]** Check Status - See running processes, ports, and files
- **[5]** Clean Cache - Remove .next directory and lock files
- **[6]** Database Generate - Regenerate Prisma Client
- **[7]** Database Push - Push schema changes to database
- **[8]** Database Seed - Load initial subject data
- **[9]** Install Dependencies - Run npm install
- **[0]** Exit - Close the menu

### NPM Scripts
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database commands
npm run db:generate    # Generate Prisma Client
npm run db:push        # Push schema to database
npm run db:seed        # Seed database with subjects
```

---

## Common Issues

### ❌ Port Already in Use
**Problem:** `Port 3000 is in use by process XXXX`

**Solution:**
```cmd
# Option 1: Use server manager
server.bat → Select [2] Stop Server

# Option 2: Manual kill
taskkill /F /IM node.exe
```

### ❌ Lock File Error
**Problem:** `Unable to acquire lock at .next/dev/lock`

**Solution:**
```cmd
# Option 1: Use server manager
server.bat → Select [5] Clean Cache

# Option 2: Manual cleanup
server.bat → Select [2] Stop Server
```

### ❌ TypeScript/Prisma Errors
**Problem:** Type errors or Prisma Client outdated

**Solution:**
```bash
# Regenerate Prisma Client
npm run db:generate

# Clear Next.js cache
npm run build:clean
```

---

## Development Workflow

### First Time Setup
```cmd
# Run server manager
server.bat

# Then select:
# [9] Install Dependencies
# [7] Database Push
# [8] Database Seed
# [1] Start Server
```

### Daily Development
```cmd
# 1. Run server manager
server.bat

# 2. Select [1] Start Server
# Server runs on http://localhost:3000
# Auto-reloads on file changes

# 3. Press Ctrl+C to stop or run server.bat again
#    and select [2] Stop Server
```

### After Schema Changes
```cmd
# 1. Update schema.prisma

# 2. Run server.bat
# 3. Select [7] Database Push
# 4. Select [6] Database Generate
# 5. Select [3] Restart Server
```

---

## Server URLs

| Environment | URL |
|------------|-----|
| **Local** | http://localhost:3000 |
| **Network** | http://172.25.112.1:3000 |
| **Backend API** | http://localhost:8000 |
| **Database** | postgresql://localhost:5432/prime_pentrix |

---

## Environment Variables

Required in `web/.env.local`:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/prime_pentrix?schema=public"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# AI Providers (at least one required)
CEREBRAS_API_KEY="your_cerebras_key"
GOOGLE_GEMINI_API_KEY="your_gemini_key"
PREFERRED_AI_PROVIDER="cerebras"  # or "gemini"
```

---

## Troubleshooting

### Server won't start
1. Run `server.bat` → [4] Check Status (see what's blocking)
2. Run `server.bat` → [2] Stop Server (kill processes)
3. Run `server.bat` → [5] Clean Cache (remove .next)
4. Run `server.bat` → [1] Start Server (fresh start)

### Database connection errors
1. Verify PostgreSQL is running
2. Check DATABASE_URL in `.env.local`
3. Test connection: `npm run db:push`

### Module not found errors
1. Install dependencies: `npm install`
2. Regenerate Prisma: `npm run db:generate`
3. Clear cache: `Remove-Item .next -Recurse -Force`

---

## Production Deployment

### Build
```bash
# Build optimized production bundle
npm run build

# Test production build locally
npm start
```

### Environment Setup
- Set `NODE_ENV=production` in `.env`
- Use production database URL
- Add production API keys
- Configure proper CORS settings

---

## Performance Tips

### Development
- Keep dev server running (uses Turbopack Fast Refresh)
- Use `console.log()` sparingly
- Clear `.next` cache if build feels slow

### Production
- Enable caching headers
- Optimize images with Next.js Image
- Use dynamic imports for large components
- Monitor bundle size: `npm run build -- --analyze`

---

## Server Manager Reference

| Option | Command | Description |
|--------|---------|-------------|
| **1** | Start Server | Launch Next.js dev server |
| **2** | Stop Server | Kill all Node.js processes |
| **3** | Restart Server | Stop and start fresh |
| **4** | Check Status | View processes, ports, files |
| **5** | Clean Cache | Remove .next and locks |
| **6** | Database Generate | Regenerate Prisma Client |
| **7** | Database Push | Push schema to database |
| **8** | Database Seed | Load subject data |
| **9** | Install Dependencies | Run npm install |
| **0** | Exit | Close the menu |

---

## Need Help?

- **Documentation:** See `/docs` folder
- **API Routes:** Check `/src/app/api`
- **Components:** Browse `/src/components`
- **Database Schema:** Review `prisma/schema.prisma`

---

**Happy Coding! 🚀**
