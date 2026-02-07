# Prime PenTrix — Web Application

> Next.js 16 frontend for the Prime PenTrix AI-powered study platform

## Quick Start

```bash
# Prerequisites: Node.js 22+, PostgreSQL 16 with pgvector

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL, Clerk keys, and AI API keys

# Setup database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to PostgreSQL
npm run db:seed         # Seed 8 subjects

# Start development server
npm run dev             # http://localhost:3000
```

Or use the interactive server menu:

```bash
.\server.bat            # Windows — interactive menu with 10 options
```

---

## Requirements

- **Node.js** 22+ (LTS recommended)
- **PostgreSQL** 16 with `pgvector` extension
- **Clerk account** for authentication ([clerk.com](https://clerk.com))
- **AI API key** — at least one of: Cerebras, Google Gemini, or OpenAI

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.1.6 (App Router, Server Components, Turbopack) |
| **UI** | React 19.2.3, TypeScript 5, Tailwind CSS v4, shadcn/ui (Radix UI) |
| **Database** | PostgreSQL 16 + pgvector, Prisma 7.3.0 (driver adapter) |
| **Authentication** | Clerk (OAuth, webhooks, server-side `auth()`) |
| **AI Providers** | Cerebras (Llama 3.3-70B), Google Gemini, OpenAI |
| **State** | Zustand (client), TanStack Query (server state, staleTime: 60s) |
| **Theming** | 12 themes via CSS custom properties + `data-theme` attribute |
| **Styling** | 13 modular CSS files (themes, glass, animations, prose, etc.) |
| **Notifications** | Sonner toast library |
| **Markdown** | react-markdown + remark-gfm + remark-math + rehype-katex + rehype-highlight |
| **Testing** | Jest 30 (55 tests), Playwright (E2E), ESLint, Prettier |

---

## Environment Variables

Create `web/.env.local` from `.env.example`:

```env
# Database (PostgreSQL with pgvector)
DATABASE_URL="postgresql://postgres:password@localhost:5432/primepentrix_v3?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# AI Providers (at least one required)
CEREBRAS_API_KEY="csk-..."            # Primary — fastest (1000+ tok/s)
GOOGLE_GEMINI_API_KEY="AIza..."       # Fallback
OPENAI_API_KEY="sk-..."              # Optional third provider

# Brain Backend (optional — for enhanced RAG)
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
```

---

## NPM Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev --turbopack` | Start dev server with Turbopack |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `lint` | `next lint` | ESLint check |
| `test` | `jest` | Run unit tests (55 tests) |
| `test:watch` | `jest --watch` | Watch mode testing |
| `test:coverage` | `jest --coverage` | Coverage report |
| `test:e2e` | `playwright test` | End-to-end tests |
| `db:generate` | `prisma generate` | Generate Prisma client |
| `db:push` | `prisma db push` | Push schema to DB |
| `db:seed` | `prisma db seed` | Seed 8 subjects |
| `db:studio` | `prisma studio` | Open Prisma Studio GUI |
| `db:migrate` | `prisma migrate dev` | Create migration |

---

## Project Structure

```
web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (Clerk, QueryProvider, ThemeProvider)
│   │   ├── page.tsx                  # Landing/redirect page
│   │   ├── globals.css               # CSS import orchestrator
│   │   ├── dashboard/page.tsx        # Subject grid, stats
│   │   ├── dashboard/analytics/      # Analytics dashboard
│   │   ├── workspace/[slug]/         # Subject workspace (Chat, Docs, Quiz, Tools)
│   │   ├── info/                     # About page
│   │   ├── sign-in/, sign-up/        # Clerk auth pages
│   │   └── api/                      # 17 API route handlers
│   │
│   ├── components/                   # 40+ React components
│   │   ├── chat/                     # ChatInterface, ChatMessage, ConversationSidebar
│   │   ├── documents/                # DocumentsTab, DocumentUpload, DocumentChatInterface
│   │   ├── quiz/                     # QuizInterface, QuizResults, QuizTab, ReviewDashboard
│   │   ├── tools/                    # ToolsTab, ToolExecutor
│   │   ├── ui/                       # 22 shadcn/ui components
│   │   ├── providers/                # React Query + Theme providers
│   │   ├── ai-settings-modal.tsx     # AI provider/model selection
│   │   ├── subject-card.tsx          # Equal-height subject cards
│   │   ├── theme-switcher.tsx        # 12-theme dropdown
│   │   └── footer.tsx                # App footer
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useChatActions.ts         # Chat CRUD operations
│   │   ├── useDocumentActions.ts     # Document upload/search
│   │   └── useSessionTracking.ts     # Study session tracking
│   │
│   ├── lib/                          # Core libraries
│   │   ├── ai/                       # AIManager, providers (Cerebras, Gemini, OpenAI)
│   │   ├── prompts/builder.ts        # Subject-aware prompt engineering
│   │   ├── tools/                    # Tool registry + executor (24+ tools)
│   │   ├── prisma.ts                 # Prisma singleton
│   │   ├── auth.ts, security.ts      # Auth & security utilities
│   │   └── cache.ts, utils.ts        # Caching, helpers
│   │
│   ├── store/                        # Zustand state stores
│   │   ├── chatStore.ts              # Chat state (conversations, messages, streaming)
│   │   └── documentStore.ts          # Document state
│   │
│   ├── styles/                       # 13 modular CSS files
│   │   ├── themes.css                # 12 theme definitions
│   │   ├── glass.css                 # Glassmorphic effects
│   │   ├── animations.css            # Keyframes & transitions
│   │   └── ... (10 more modules)
│   │
│   └── types/                        # TypeScript definitions
│
├── prisma/
│   ├── schema.prisma                 # 12 database models + pgvector
│   └── seed.ts                       # Subject seeding
│
├── e2e/                              # Playwright E2E tests
├── public/                           # Static assets
├── jest.config.js                    # Jest 30 configuration
├── playwright.config.ts              # Playwright configuration
├── next.config.ts                    # Next.js + Turbopack config
├── tsconfig.json                     # TypeScript config
└── Dockerfile                        # Production build
```

---

## Key Architectural Decisions

### Prisma 7 Driver Adapter
Prisma 7 dropped the Rust engine in favour of pure JavaScript. Configuration moved to `prisma.config.ts` with `@prisma/adapter-pg` for PostgreSQL connections.

### CSS Architecture
The original 1283-line `globals.css` was refactored into **13 focused CSS modules** for maintainability:
- `themes.css` — 12 theme variable sets
- `glass.css` — Glassmorphic `backdrop-filter` effects
- `animations.css` — All keyframes and transitions
- `base.css`, `components.css`, `chat.css`, `prose.css`, etc.

### rem-Based Sizing
All sizing uses `rem`/`em` units (no `px`) for accessibility and consistent scaling.

### Theme System
Themes use CSS custom properties via `data-theme` attribute on `<html>`. An inline `<script>` in `layout.tsx` restores the saved theme from `localStorage` before React hydrates — eliminating FOUC.

### AI Provider Architecture
`AIManager` orchestrates multiple providers with automatic fallback. The settings modal disables providers without valid API keys and auto-redirects to the first available provider.

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Port 3000 in use | `npx kill-port 3000` or change port in `package.json` |
| Prisma client error | Run `npm run db:generate` after any schema change |
| Lock file error | Delete `package-lock.json` + `node_modules/`, run `npm install` |
| TypeScript errors | Run `npx tsc --noEmit` to see all errors |
| Build fails | Run `npx next build 2>&1` instead of `npm run dev` for clearer errors |
| Clerk auth issues | Verify `CLERK_SECRET_KEY` and webhook URL configuration |
| pgvector missing | Run `CREATE EXTENSION vector;` in your PostgreSQL database |

---

## Production Build

```bash
# Build (0 TypeScript errors)
npx next build

# Start production server
npm start

# Or use Docker
docker build -t primepentrix-web .
docker run -p 3000:3000 --env-file .env.local primepentrix-web
```

---

## Related Documentation

- **[Main README](../README.md)** — Full project overview
- **[Architecture](../docs/ARCHITECTURE.md)** — System design deep-dive
- **[API Reference](../docs/API-REFERENCE.md)** — All 17 endpoints
- **[Docker Setup](../DOCKER.md)** — Container orchestration
- **[SERVER.md](./SERVER.md)** — Server management & `server.bat` reference
