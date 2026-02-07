<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=32&duration=3000&pause=1000&color=00F3FF&center=true&vCenter=true&width=700&lines=Prime+PenTrix+%E2%9A%A1;AI-Powered+Study+Platform;Sentinel+V3+%E2%80%94+Full+Stack" alt="Typing SVG" />

<br>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=400&size=18&duration=4000&pause=800&color=00FF9D&center=true&vCenter=true&width=600&lines=Where+Penetration+Testing+Meets+Intelligence;Next.js+16+%7C+React+19+%7C+PostgreSQL+%7C+RAG;Built+from+Scratch+%E2%80%94+No+Templates" alt="Subtitle" />

<br><br>

**A production-ready, AI-powered study platform for cybersecurity & CS engineering — built from scratch with modern full-stack architecture**

*Developed for Howest University Belgium CS Engineering • Semester 2*

<br>

![Version](https://img.shields.io/badge/version-3.2.0-emerald?style=for-the-badge)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+pgvector-4169E1?style=for-the-badge&logo=postgresql)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

</div>

---

## Overview

Prime PenTrix (Sentinel V3) is a modern full-stack AI-powered learning platform built specifically for CS Engineering students specialising in cybersecurity. It combines context-aware AI chat, RAG document intelligence, AI-generated quizzes with spaced repetition, and 24+ cybersecurity toolkits — all within a glassmorphic, responsive UI with 12 themes.

This is the **third major version** of the Sentinel Copilot project. V1/V2 was a vanilla JavaScript SPA; V3 is a complete ground-up rewrite using Next.js 16, React 19, TypeScript, Prisma 7, PostgreSQL with pgvector, and Clerk authentication.

### Key Highlights

| Category | Details |
|----------|---------|
| **AI Chat** | Multi-provider (Cerebras, Gemini, OpenAI) with SSE streaming, provider fallback, subject-aware prompts |
| **RAG Engine** | Upload PDFs → chunk → embed (pgvector) → BM25 + vector hybrid search → citation-backed answers |
| **Quiz System** | AI-generated MCQ/True-False/Open questions, deterministic + AI grading, spaced repetition scheduling |
| **Security Toolkit** | 24+ tools across networks, pentesting, CTF, scripting, Linux, backend, and privacy |
| **12 Themes** | Glass, Hacker, Cyber, Midnight, Ocean, Aurora, Nebula, Forest, Sunset, Lavender, Prime Dark, Light |
| **8 Subjects** | Networks, Pentesting, Backend, Linux, CTF, Scripting, Privacy Law, General (AI Security) |
| **Auth** | Clerk OAuth with webhook-based user sync |
| **Database** | PostgreSQL 16 + pgvector, 12 Prisma models, Prisma 7 with driver adapter |
| **Testing** | Jest 30 (55 unit tests), Playwright E2E, ESLint |
| **Infrastructure** | Docker Compose (3 services), Turbopack dev server |

---

## Architecture

```
sentinel-v3/
├── web/                  # Next.js 16 Frontend + API Routes
│   ├── src/
│   │   ├── app/          # App Router — pages, layouts, 17 API routes
│   │   ├── components/   # 40+ React components (chat, quiz, docs, tools, UI)
│   │   ├── hooks/        # Custom hooks (useChatActions, useDocumentActions, useSessionTracking)
│   │   ├── lib/          # Core libs (AI manager, prompts, tools, security, cache)
│   │   ├── store/        # Zustand stores (chatStore, documentStore)
│   │   ├── styles/       # 13 modular CSS files (themes, glass, animations, etc.)
│   │   ├── types/        # TypeScript type definitions
│   │   └── middleware.ts  # Rate limiting, auth middleware
│   └── prisma/           # Schema (12 models) + seed script
│
├── brain/                # Python FastAPI Backend (RAG Engine)
│   ├── rag/              # BM25, chunker, embeddings, query expander, extractor
│   ├── main.py           # FastAPI app
│   └── Dockerfile
│
├── infrastructure/       # Docker Compose orchestration
├── docs/                 # Comprehensive documentation
└── tests/                # Integration & E2E tests
```

### Tech Stack

#### Frontend (`web/`)

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.1.6 | App Router, Server Components, API Routes |
| React | 19.2.3 | UI rendering with Suspense, dynamic imports |
| TypeScript | 5.x | Type safety across the entire codebase |
| Tailwind CSS | v4 | Utility-first CSS with `@theme inline` config |
| Prisma | 7.3.0 | ORM with PostgreSQL driver adapter |
| Clerk | Latest | OAuth authentication, webhook user sync |
| Zustand | Latest | Lightweight client state management |
| TanStack Query | Latest | Server state, caching (staleTime: 60s) |
| Radix UI / shadcn/ui | Latest | Accessible, composable UI primitives |
| Lucide React | Latest | Icon system |
| Sonner | Latest | Toast notifications |
| react-markdown | Latest | Markdown rendering with KaTeX, syntax highlighting |

#### Backend (`brain/`)

| Technology | Version | Purpose |
|-----------|---------|---------|
| FastAPI | 0.115.0 | Async Python API server |
| Python | 3.11+ | RAG pipeline runtime |
| rank-bm25 | Latest | BM25 keyword search ranking |
| PyPDF / python-docx | Latest | Document text extraction |
| NLTK | Latest | Tokenisation, stopword removal |
| psycopg2 | Latest | PostgreSQL driver |

#### Infrastructure

| Technology | Purpose |
|-----------|---------|
| PostgreSQL 16 | Primary database with pgvector extension |
| Docker Compose | 3-service orchestration (postgres, brain, web) |
| Turbopack | Next.js development bundler |
| Jest 30 | Unit testing (55 tests) |
| Playwright | E2E browser testing |
| ESLint + Prettier | Code quality & formatting |

---

## Quick Start

### Prerequisites

- **Node.js** 22+
- **Python** 3.11+
- **PostgreSQL** 16 with pgvector extension
- **Docker Desktop** (recommended)
- **Clerk account** → [clerk.com](https://clerk.com)

### Option 1: Docker Compose (Recommended)

```powershell
# Clone and enter the project
git clone https://github.com/MIHx0/prime-pentrix.git
cd sentinel-v3

# Set up environment variables
cp web/.env.example web/.env.local
# Edit web/.env.local — add Clerk keys, AI API keys, DATABASE_URL

# Start all services
.\docker-start.ps1        # Windows PowerShell
# or: cd infrastructure && docker-compose up --build -d

# Initialize database (first time only)
docker exec -it primepentrix-web npx prisma db push
docker exec -it primepentrix-web npx prisma db seed

# Access the app
# Frontend:  http://localhost:3000
# Brain API: http://localhost:8000
# DB:        localhost:5432
```

### Option 2: Local Development

```bash
# 1. Start PostgreSQL (via Docker or local install)
docker run -d --name pg16 -e POSTGRES_PASSWORD=password -p 5432:5432 pgvector/pgvector:pg16

# 2. Setup frontend
cd web
npm install
cp .env.example .env.local   # Edit with your keys
npm run db:generate           # Generate Prisma client
npm run db:push               # Create tables
npm run db:seed               # Seed 8 subjects
npm run dev                   # Start at localhost:3000

# 3. Setup brain (optional — for enhanced RAG)
cd ../brain
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python -m nltk.downloader punkt stopwords
uvicorn main:app --reload     # Start at localhost:8000
```

### Docker Management (Windows)

```powershell
.\docker-start.ps1       # Build + start all services
.\docker-stop.ps1        # Stop all services
.\docker-restart.ps1     # Restart without rebuild
```

> For detailed setup instructions, see **[Quick Start Guide](./docs/QUICK-START.md)** and **[Docker Setup](./DOCKER.md)**.

---

## Environment Variables

### Frontend (`web/.env.local`)

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/primepentrix_v3?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# AI Providers (at least one required)
CEREBRAS_API_KEY="csk-..."           # Primary — fastest inference
GOOGLE_GEMINI_API_KEY="AIza..."      # Fallback
OPENAI_API_KEY="sk-..."              # Optional

# Brain Backend
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
```

### Backend (`brain/.env`)

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/primepentrix_v3"
OPENAI_API_KEY="sk-..."   # For embeddings (text-embedding-3-small)
```

---

## Features

### AI-Powered Chat
- Multi-provider support with automatic fallback (Cerebras → Gemini → OpenAI)
- SSE streaming with real-time markdown rendering
- Subject-aware prompts with pedagogy styles (Packet-First, Attack-Chain, CLI-First, etc.)
- Conversation history with search, filter, and continuation
- Model badge shows which AI responded to each message

### RAG Document Intelligence
- Upload PDFs and documents per subject
- Automatic chunking, embedding (pgvector), and BM25 indexing
- Hybrid search: BM25 keyword + vector semantic fusion
- Citation-backed answers grounded in your study materials
- Dedicated doc-chat interface separate from regular chat

### AI Quiz System
- AI-generated questions: MCQ, True/False, Fill-in-the-blank, Open-ended
- Robust grading: 5-strategy deterministic MCQ matching + strict AI grading
- Spaced repetition scheduling (ease factor, interval, next review date)
- Dashboard stats update immediately after quiz completion
- Per-subject quiz history and review dashboard

### Security Toolkit (24+ Tools)
- **Networks**: Subnet calculator, CIDR converter, port reference, DNS lookup
- **Pentesting**: JWT decoder, header analyzer, hash identifier, encoding tools
- **CTF**: Base converter, cipher tools, steganography helpers
- **Scripting**: Regex tester, JSON validator, diff viewer
- **Linux**: Permission calculator, cron generator, command reference
- **Backend**: SQL formatter, API tester, session analyzer
- **Privacy**: GDPR lookup, data classification tools

### 12 Themes
Glass (default), Prime Dark, Hacker, Midnight, Cyber, Ocean, Forest, Nebula, Aurora, Sunset, Lavender, and Light — each fully glassmorphic with CSS custom properties and `data-theme` attribute switching.

### Analytics & Progress
- Study session tracking (time, mode, subject)
- Quiz performance trends
- Streak tracking and achievements
- Global stats dashboard with learning metrics

---

## Database Schema

**12 Prisma models** powered by PostgreSQL 16 + pgvector:

| Model | Purpose |
|-------|---------|
| `User` | Clerk-synced accounts with theme preferences |
| `Subject` | 8 subjects with pedagogy config, toolkit, prompt styles |
| `Conversation` | Chat sessions (modes: chat, doc-chat) |
| `Message` | Messages with role, model, token count, context flag |
| `Document` | Uploaded PDFs/docs with processing status |
| `DocumentChunk` | Chunked text with pgvector embeddings (vector(384)) + BM25 term frequency |
| `Analytics` | Event tracking (eventType + JSON eventData) |
| `StudySession` | Duration, mode, subject tracking |
| `QuizScore` | Quiz attempts with topic, difficulty, score, grade |
| `QuizReview` | Spaced repetition: easeFactor, interval, nextReviewAt |
| `ToolHistory` | Tool usage records (input/output) |
| `GlobalStats` | Streaks, achievements, totals per user |

### Database Commands

```bash
cd web
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:seed        # Seed 8 subjects
npm run db:studio      # Open Prisma Studio GUI
npm run db:migrate     # Create production migration
```

---

## API Routes

17 API route handlers across 11 domains:

| Endpoint | Method(s) | Purpose |
|----------|-----------|---------|
| `/api/ai-providers` | GET | List available AI providers + key status |
| `/api/analytics/dashboard` | GET | Dashboard stats (quizzes, sessions, streaks) |
| `/api/analytics/session` | POST | Track study sessions |
| `/api/chat` | POST | SSE streaming chat with AI |
| `/api/conversations` | GET, POST | List/create conversations |
| `/api/conversations/[id]` | GET, PATCH, DELETE | Single conversation CRUD |
| `/api/documents` | GET, POST | List/upload documents |
| `/api/documents/[id]` | GET, DELETE | Single document operations |
| `/api/documents/search` | POST | RAG hybrid search (BM25 + vector) |
| `/api/health` | GET | Health check |
| `/api/messages` | GET, POST | List/create messages |
| `/api/messages/[id]` | PATCH, DELETE | Message operations |
| `/api/quiz/generate` | POST | AI quiz generation |
| `/api/quiz/submit` | POST | Quiz submission + grading |
| `/api/subjects` | GET | List all subjects |
| `/api/tools/execute` | POST | Execute toolkit tools |
| `/api/webhooks/clerk` | POST | Clerk user sync webhook |

> See **[API Reference](./docs/API-REFERENCE.md)** for detailed request/response schemas.

---

## Testing

```bash
cd web

# Unit tests (Jest 30 — 55 tests)
npm test
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# E2E tests (Playwright)
npm run test:e2e

# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Production build (0 errors)
npx next build
```

---

## Themes

12 carefully designed themes, each with glassmorphic effects:

| Theme | Style |
|-------|-------|
| Glass (Default) | Deep emerald gradient with frosted glass |
| Prime Dark | Tactical command centre, dark emerald |
| Hacker | Matrix green terminal aesthetic |
| Midnight | Ultra-dark indigo |
| Cyber | High-contrast neon yellow/black |
| Ocean | Deep blue gradient |
| Forest | Mysterious dark green |
| Nebula | Cosmic purple/pink |
| Aurora | Northern lights teal |
| Sunset | Warm pink/purple gradient |
| Lavender | Soft dreamy purple |
| Light | Clean minimal light mode |

---

## Development Roadmap

All phases are **complete**:

| Phase | Name | Status |
|-------|------|--------|
| 1 | Core Infrastructure | ✅ Complete |
| 2 | AI Chat & Streaming | ✅ Complete |
| 3 | RAG Document Intelligence | ✅ Complete |
| 4 | Quiz System & Grading | ✅ Complete |
| 5 | Tools, Analytics & Polish | ✅ Complete |
| 6 | Testing, Docker & Production | ✅ Complete |

### Post-Launch Improvements
- ✅ Security audit & hardening
- ✅ Performance optimisation (dynamic imports, Suspense boundaries)
- ✅ CSS modular architecture (1283-line globals.css → 13 focused modules)
- ✅ px → rem conversion for accessibility
- ✅ UI/UX audit (7+ components refined)
- ✅ Bug fix rounds (12+ issues resolved across multiple sessions)

---

## Documentation

| Document | Description |
|----------|-------------|
| **[Quick Start Guide](./docs/QUICK-START.md)** | Get running in 5 minutes |
| **[Architecture](./docs/ARCHITECTURE.md)** | Deep-dive into system design, data flow, and patterns |
| **[API Reference](./docs/API-REFERENCE.md)** | All 17 API endpoints with request/response schemas |
| **[Features Guide](./docs/FEATURES.md)** | Detailed feature documentation |
| **[RAG Architecture](./docs/RAG-ARCHITECTURE.md)** | Why hybrid RAG with OpenAI embeddings |
| **[Docker Setup](./DOCKER.md)** | Docker Compose orchestration guide |

---

## Evolution: V1 → V2 → V3

| Version | Architecture | LOC | Key Change |
|---------|-------------|-----|------------|
| **V1** | Vanilla JS SPA | ~5,000 | Browser-only, IndexedDB, no backend |
| **V2** | Vanilla JS + Python backend | ~11,700 | Added ChromaDB RAG, 24 tools, modular history |
| **V3** | Next.js 16 full-stack | ~25,000+ | Complete rewrite — TypeScript, Prisma, pgvector, Clerk auth, SSE streaming, Docker |

The older V1/V2 codebase lives in `S2-Sentinel-Copilot/` within this workspace.

---

## Author

**Muhammad Izaz Haider (MIHx0)**

- CS Engineering Student — Howest University Belgium 🇧🇪
- Specialisation: Cybersecurity & AI Security
- GitHub: [@MIHx0](https://github.com/MIHx0)
- LinkedIn: [muhammadizazhaider](https://linkedin.com/in/muhammadizazhaider)
- Website: [thepentrix.com](https://thepentrix.com)

---

## License

This project is licensed under the MIT License.

---

<div align="center">

**Built with passion for the Howest CS Engineering community**

*Prime PenTrix — Where Penetration Testing Meets Intelligence*

</div>
