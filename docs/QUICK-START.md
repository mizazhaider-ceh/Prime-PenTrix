# Quick Start Guide — Prime PenTrix

> Get the platform running in under 5 minutes

---

## Prerequisites

| Requirement | Minimum | Recommended |
|------------|---------|-------------|
| Node.js | 20+ | 22 LTS |
| Python | 3.11+ | 3.12 |
| PostgreSQL | 16 (with pgvector) | 16+ |
| Docker | 24+ | Latest Desktop |
| Git | 2.x | Latest |
| Clerk account | — | [clerk.com](https://clerk.com) |
| AI API key | 1 provider | Cerebras (fastest) |

---

## Option 1: Docker (Recommended)

The fastest path — runs PostgreSQL, the Brain API, and the Web app in containers.

### Step 1: Clone

```powershell
git clone https://github.com/MIHx0/prime-pentrix.git
cd sentinel-v3
```

### Step 2: Configure Environment

```powershell
# Copy the template
cp web/.env.example web/.env.local
```

Edit `web/.env.local` and fill in:

```env
# Database (Docker will use this)
DATABASE_URL="postgresql://postgres:password@primepentrix-postgres:5432/primepentrix_v3?schema=public"

# Clerk Authentication (get from clerk.com dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# AI Provider (at least one)
CEREBRAS_API_KEY="csk-..."
```

### Step 3: Start

```powershell
# Windows PowerShell
.\docker-start.ps1

# Linux/Mac
cd infrastructure && docker-compose up --build -d
```

### Step 4: Initialize Database (First Time Only)

```powershell
docker exec -it primepentrix-web npx prisma db push
docker exec -it primepentrix-web npx prisma db seed
```

### Step 5: Open

- **App:** http://localhost:3000
- **Brain API:** http://localhost:8000/docs
- **Database:** localhost:5432

---

## Option 2: Local Development

### Step 1: Start PostgreSQL

**Via Docker (easiest):**
```bash
docker run -d \
  --name pg16-vector \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=primepentrix_v3 \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

**Or install locally** and enable pgvector:
```sql
CREATE DATABASE primepentrix_v3;
\c primepentrix_v3
CREATE EXTENSION vector;
```

### Step 2: Setup Web (Next.js)

```bash
cd web

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

Edit `web/.env.local`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/primepentrix_v3?schema=public"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CEREBRAS_API_KEY="csk-..."
```

```bash
# Setup database
npm run db:generate     # Generate Prisma client
npm run db:push         # Create all 12 tables
npm run db:seed         # Seed 8 subjects

# Start development server
npm run dev             # http://localhost:3000
```

### Step 3: Setup Brain (Optional — Enhanced RAG)

```bash
cd brain

# Create virtual environment
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Download NLP data
python -m nltk.downloader punkt stopwords

# Start
uvicorn main:app --reload   # http://localhost:8000
```

---

## Getting Your API Keys

### Clerk (Required)

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Go to **API Keys** in the dashboard
4. Copy **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
5. Copy **Secret Key** → `CLERK_SECRET_KEY`
6. (Optional) Set up webhook at `/api/webhooks/clerk` for user sync

### Cerebras (Recommended — Fastest)

1. Go to [cloud.cerebras.ai](https://cloud.cerebras.ai)
2. Create an account and generate an API key
3. Copy key → `CEREBRAS_API_KEY`
4. Models: `llama-3.3-70b` (default), `llama-4-scout-17b-16e-instruct`

### Google Gemini (Fallback)

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Get an API key
3. Copy key → `GOOGLE_GEMINI_API_KEY`

### OpenAI (Optional)

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create API key → `OPENAI_API_KEY`
3. Also used for document embeddings in the Brain service

---

## Verify Everything Works

### Check Health
```bash
curl http://localhost:3000/api/health
# { "status": "healthy", "database": "connected", ... }
```

### Check AI Providers
```bash
curl http://localhost:3000/api/ai-providers
# { "providers": { "cerebras": true, "gemini": false, "openai": false } }
```

### Open Prisma Studio (Database GUI)
```bash
cd web && npm run db:studio
# Opens at http://localhost:5555
```

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| `DATABASE_URL` not set | Ensure `.env.local` exists in `web/` with valid connection string |
| `Error: P1001 Can't reach database` | Start PostgreSQL: `docker start pg16-vector` |
| `Module not found: prisma` | Run `npm run db:generate` |
| `Error: Context not found` | Ensure `@prisma/adapter-pg` and `pg` are installed |
| Port 3000 in use | `npx kill-port 3000` or use `npm run dev -- -p 3001` |
| Brain API not connecting | Check `NEXT_PUBLIC_BACKEND_URL` in `.env.local` |
| Clerk redirect loops | Verify `NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"` is set |
| pgvector extension missing | `docker exec -it pg16-vector psql -U postgres -d primepentrix_v3 -c "CREATE EXTENSION vector;"` |
| `npm run dev` exits with code 1 | Try `npx next build` first to check for errors, then retry `npm run dev` |

---

## Next Steps

1. Sign in at `http://localhost:3000/sign-in`
2. Explore the 8 subjects on the dashboard
3. Open a subject workspace and start chatting
4. Upload a PDF in the Documents tab
5. Try the AI Quiz system
6. Explore the Security Toolkit
7. Switch themes via the palette icon in the header

---

## Useful Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm test                 # Run 55 unit tests
npm run test:e2e         # Run E2E tests
npm run lint             # ESLint check

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:seed          # Seed subjects
npm run db:studio        # GUI database browser
npm run db:migrate       # Create migration

# Docker
.\docker-start.ps1      # Start all services
.\docker-stop.ps1       # Stop all services
.\docker-restart.ps1    # Restart services
```
