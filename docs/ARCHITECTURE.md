# Architecture — Prime PenTrix (Sentinel V3)

> Deep-dive into system design, data flow, component architecture, and engineering decisions

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [API Layer](#4-api-layer)
5. [AI Provider System](#5-ai-provider-system)
6. [RAG Pipeline](#6-rag-pipeline)
7. [Quiz & Grading System](#7-quiz--grading-system)
8. [Database Design](#8-database-design)
9. [State Management](#9-state-management)
10. [Theme System](#10-theme-system)
11. [CSS Architecture](#11-css-architecture)
12. [Authentication Flow](#12-authentication-flow)
13. [Security Considerations](#13-security-considerations)
14. [Performance Optimisations](#14-performance-optimisations)
15. [Evolution from V1/V2](#15-evolution-from-v1v2)

---

## 1. System Overview

Prime PenTrix is a **three-tier full-stack application**:

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  Next.js 16 App Router • React 19 • Tailwind v4 • Zustand      │
│  12 Themes • Glassmorphic UI • SSE Streaming • TanStack Query   │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTPS / SSE
┌──────────────────────────▼───────────────────────────────────────┐
│                    WEB SERVER (Next.js API Routes)                │
│  17 Route Handlers • Clerk Auth • Prisma 7 ORM • AI Manager     │
│  Prompt Builder • Tool Executor • Quiz Generator/Grader          │
└──────────────────────────┬───────────────────────────────────────┘
                           │ SQL / HTTP
┌──────────────────────────▼───────────────────────────────────────┐
│                    DATA LAYER                                     │
│  PostgreSQL 16 + pgvector │ Python FastAPI Brain (optional RAG)  │
│  12 Prisma Models         │ BM25 + Embeddings + Chunker          │
└──────────────────────────────────────────────────────────────────┘
```

### Design Principles
- **Full-stack TypeScript** — shared type safety from DB to UI
- **Server-first** — Server Components by default, client only when needed
- **rem-based sizing** — no `px` for accessibility and fluid scaling
- **Glassmorphic UI** — frosted glass effects across all 12 themes
- **Progressive enhancement** — brain backend is optional; core features work without it

---

## 2. High-Level Architecture

### Request Flow

```
Browser → Next.js Middleware (rate limit, auth check)
       → App Router (page.tsx / route.ts)
       → Clerk auth() verification
       → Prisma ORM → PostgreSQL
       → [Optional] AI Provider (Cerebras / Gemini / OpenAI)
       → [Optional] Brain API (FastAPI RAG)
       → SSE Stream / JSON Response → Client
```

### Service Map

| Service | Port | Role |
|---------|------|------|
| `web` (Next.js) | 3000 | Frontend + API routes |
| `brain` (FastAPI) | 8000 | RAG engine, document processing |
| `postgres` | 5432 | Primary database + pgvector |

### Docker Network

All three services run on `primepentrix-network` (Docker bridge). The web service connects to both postgres (direct) and brain (HTTP).

---

## 3. Frontend Architecture

### Page Structure (App Router)

```
src/app/
├── layout.tsx              # Root: Clerk → QueryProvider → ThemeProvider → {children}
├── page.tsx                # Landing → redirect to /dashboard
├── dashboard/
│   ├── page.tsx            # Subject grid (8 cards), stats bar, quick actions
│   └── analytics/page.tsx  # Full analytics dashboard
├── workspace/[slug]/
│   ├── page.tsx            # 4-tab workspace: Chat | Docs | Quiz | Tools
│   └── loading.tsx         # Suspense skeleton
├── info/page.tsx           # About: features, tech stack, "Why I Built This"
├── sign-in/, sign-up/      # Clerk authentication pages
└── api/                    # 17 server-side route handlers
```

### Component Hierarchy

```
RootLayout
├── ClerkProvider
│   └── ReactQueryProvider
│       └── ThemeProvider
│           └── Page Content
│               ├── DashboardHeader
│               │   ├── ThemeSwitcher
│               │   ├── AISettingsModal
│               │   └── UserButton (Clerk)
│               ├── SubjectCard[] (equal-height grid)
│               └── Workspace
│                   ├── ConversationSidebar (search, filter, CRUD)
│                   ├── ChatInterface (SSE streaming)
│                   │   └── ChatMessage[] (markdown, model badge)
│                   ├── DocumentsTab
│                   │   ├── DocumentUpload
│                   │   ├── DocumentList
│                   │   └── DocumentChatInterface (RAG)
│                   ├── QuizTab
│                   │   ├── QuizInterface (4 question types)
│                   │   ├── QuizResults (score, grade)
│                   │   └── ReviewDashboard (spaced repetition)
│                   └── ToolsTab
│                       └── ToolExecutor (24+ tools)
```

### Dynamic Imports

Heavy components are loaded lazily to reduce initial bundle size:

```typescript
// Workspace page uses dynamic imports for each tab
const QuizTab = dynamic(() => import('@/components/quiz/QuizTab'));
const ToolsTab = dynamic(() => import('@/components/tools/ToolsTab'));
const DocumentsTab = dynamic(() => import('@/components/documents'));
```

---

## 4. API Layer

### Route Architecture

All API routes live under `src/app/api/` and use Next.js Route Handlers:

```typescript
// Example: src/app/api/chat/route.ts
export async function POST(req: NextRequest) {
  const { userId } = await auth();           // Clerk auth
  const body = await req.json();             // Parse request
  // ... business logic
  return new Response(stream, {              // SSE stream
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

### SSE Streaming (Chat)

The chat endpoint uses Server-Sent Events for real-time AI responses:

```
Client POST /api/chat { message, conversationId, subjectId }
  → Auth check (Clerk)
  → Save user message to DB
  → Build prompt (subject context + history + RAG context)
  → AIManager.streamChat() → preferred provider with fallback
  → Stream chunks via SSE: data: {"content": "...", "done": false}
  → Final chunk: data: {"content": "", "done": true, "provider": "cerebras", "model": "llama-3.3-70b"}
  → Save assistant message to DB (with guard against double-save)
```

### Authentication Pattern

Every API route follows the same auth pattern:

```typescript
const { userId } = await auth();
if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const user = await prisma.user.findUnique({ where: { clerkId: userId } });
if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
```

---

## 5. AI Provider System

### Multi-Provider Architecture

```
AIManager
├── CerebrasProvider (Llama 3.3-70B — primary, fastest)
├── GeminiProvider (Gemini 1.5 Flash — fallback)
└── OpenAIProvider (GPT-4 — optional third)

Flow: Preferred → Fallback → Error
```

### AIManager (`src/lib/ai/manager.ts`)

```typescript
class AIManager {
  private providers: AIProvider[];
  private preferredProvider: string;

  async streamChat(messages: AIMessage[]): AsyncGenerator<AIStreamChunk> {
    // Try preferred provider first
    // If it fails, fall through to next available
    // Yield chunks with { content, done, provider, model }
  }
}
```

### Provider Interface

All providers implement the same interface:

```typescript
interface AIProvider {
  name: string;
  streamChat(messages: AIMessage[], config: AIConfig): AsyncGenerator<AIStreamChunk>;
}

interface AIStreamChunk {
  content: string;
  done: boolean;
  provider?: string;
  model?: string;
}
```

### Key Validation

The AI settings modal checks provider availability via `/api/ai-providers`:

```typescript
function isValidKey(key: string | undefined): boolean {
  if (!key) return false;
  const placeholders = ['your_key', 'sk-...', 'placeholder', 'test'];
  return !placeholders.some(p => key.includes(p));
}
```

Unavailable providers are **disabled** in the settings dropdown with NO KEY badges. Selecting one auto-redirects to the first available provider.

---

## 6. RAG Pipeline

### Document Processing Flow

```
Upload PDF/DOCX
  → POST /api/documents (save metadata, store file)
  → Brain API: /process (or local processing)
  → Extract text (PyPDF / python-docx)
  → Chunk text (semantic chunking with header detection)
  → Generate embeddings (OpenAI text-embedding-3-small → vector(384))
  → Store chunks in DocumentChunk table (text + embedding + BM25 terms)
```

### Hybrid Search (Query Time)

```
User question
  → POST /api/documents/search
  → Query expansion (synonyms, related terms)
  → BM25 keyword search (rank-bm25 on termFrequency)
  → Vector similarity search (pgvector cosine distance)
  → Score fusion (weighted combination)
  → Return top-k chunks with citations
  → Inject into AI prompt as context
```

### Why Hybrid RAG?

| Approach | Docker Image | Memory | Quality |
|----------|-------------|--------|---------|
| Local (Sentence Transformers) | 3.5 GB | 700 MB | Good |
| **Hybrid (BM25 + OpenAI)** | **450 MB** | **150 MB** | **Better** |

Cost: ~$0.20/student/month for embeddings. See [RAG-ARCHITECTURE.md](./RAG-ARCHITECTURE.md) for the full decision document.

---

## 7. Quiz & Grading System

### Quiz Generation

```
POST /api/quiz/generate { subjectId, topic, difficulty, count }
  → Build AI prompt with subject context + pedagogy style
  → AI generates questions (MCQ, True/False, Fill-in, Open-ended)
  → Parse structured JSON output
  → Return questions to client
```

### Grading Pipeline (5-Strategy MCQ Matching)

```
POST /api/quiz/submit { answers[] }
  → For each question:
    → checkDeterministicAnswer():
      1. Direct text match (both full option text)
      2. correctAnswer is letter (A/B/C/D) → map to option index
      3. userAnswer is letter → map to option index
      4. Letter-prefixed answer → strip prefix and compare
      5. Both found in options → compare indices
      6. Fuzzy containment (>3 chars)
      7. True/False normalisation (true/yes/1 → true)
    → If deterministic fails → AI grading (strict prompt)
  → Calculate score, grade, save QuizScore
  → Update spaced repetition (QuizReview)
  → Invalidate dashboard-stats query cache
```

### Spaced Repetition

The `QuizReview` model tracks per-question review scheduling:

```
easeFactor: 2.5 (adjusts based on performance)
interval: days until next review
nextReviewAt: calculated review date
```

---

## 8. Database Design

### Entity Relationship Overview

```
User (1) ──── (N) Conversation ──── (N) Message
  │                    │
  │                    └── Subject (M:1)
  │
  ├── (N) Document ──── (N) DocumentChunk [pgvector embedding]
  ├── (N) StudySession
  ├── (N) QuizScore
  ├── (N) QuizReview
  ├── (N) Analytics
  ├── (N) ToolHistory
  └── (1) GlobalStats
```

### Key Models

**Conversation** — Modes: `chat` (regular), `doc-chat` (RAG document chat). Doc-chat conversations are filtered out of the regular Chat tab sidebar.

**Message** — Stores `role` (user/assistant/system), `content`, `model` (which AI responded), `tokenCount`, and `contextUsed` (whether RAG context was injected).

**DocumentChunk** — Contains chunked text, a `vector(384)` embedding via pgvector's `Unsupported` type, and BM25 `termFrequency` as JSON for keyword search.

**GlobalStats** — Singleton per user tracking `currentStreak`, `longestStreak`, `totalStudyTime`, `totalQuizzes`, `totalSessions`, and JSON `achievements`.

### Prisma 7 Configuration

Prisma 7 uses a driver adapter instead of a Rust engine:

```typescript
// prisma.config.ts
import { defineConfig } from 'prisma/config';
import pg from 'pg';

export default defineConfig({
  earlyAccess: true,
  datasource: {
    url: process.env.DATABASE_URL,
    adapter: '@prisma/adapter-pg',
    adapterConfig: { pool: new pg.Pool({ connectionString: process.env.DATABASE_URL }) },
  },
});
```

---

## 9. State Management

### Client State (Zustand)

Two Zustand stores manage client-side state:

**chatStore.ts** — Manages conversations, messages, streaming state, and current conversation selection:

```typescript
interface ChatState {
  currentConversation: ConversationWithDetails | null;
  conversations: ConversationWithDetails[];
  messages: MessageWithUser[];
  isStreaming: boolean;
  streamingMessage: string;
  // ... actions: setConversation, addMessage, finalizeStreamingMessage, etc.
}
```

**documentStore.ts** — Manages uploaded documents, search results, and document processing state.

### Server State (TanStack Query)

API data is managed via React Query with strategic cache invalidation:

```typescript
// Dashboard stats — cached for 60 seconds
const { data } = useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: fetchDashboardStats,
  staleTime: 60_000,
});

// After quiz completion — immediate invalidation
queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
```

---

## 10. Theme System

### Implementation

```
12 themes defined in src/styles/themes.css
  → Each theme sets 30+ CSS custom properties
  → Applied via data-theme attribute on <html>
  → Inline <script> in layout.tsx reads localStorage before paint
  → ThemeSwitcher component updates attribute + localStorage
  → next-themes provides React integration
```

### FOUC Prevention

An inline script runs before React hydrates:

```html
<script>
  (function() {
    const theme = localStorage.getItem('theme') || 'glass';
    document.documentElement.setAttribute('data-theme', theme);
  })();
</script>
```

This eliminates the flash of unstyled content that would occur if themes were applied only after React mounts.

### Theme Variables (Example)

```css
[data-theme="hacker"] {
  --background: 120 10% 4%;
  --foreground: 120 100% 80%;
  --primary: 120 100% 50%;
  --card: 120 10% 7%;
  /* ... 25+ more variables */
}
```

---

## 11. CSS Architecture

The original 1283-line `globals.css` was refactored into **13 focused modules**:

| File | Purpose | Key Patterns |
|------|---------|-------------|
| `themes.css` | 12 theme variable definitions | CSS custom properties, `data-theme` selectors |
| `glass.css` | Glassmorphic effects | `backdrop-filter: blur()`, `will-change: transform` |
| `animations.css` | All keyframes | `fadeInUp`, `float`, `shimmer`, `typing-indicator` |
| `base.css` | Reset, typography, custom props | rem-based font sizes, system font stack |
| `components.css` | Buttons, cards, badges | Utility classes, hover states |
| `chat.css` | Chat-specific styles | Message bubbles, streaming indicators |
| `subjects.css` | Subject colour system | 8 subject colours with CSS vars |
| `prose.css` | Markdown rendering | Code blocks, tables, lists, headings |
| `scrollbar.css` | Custom scrollbars | Webkit + Firefox scrollbar styling |
| `effects.css` | Hover, glow, gradient effects | Card hover lifts, glow borders |
| `clerk.css` | Clerk component overrides | Match Clerk UI to current theme |
| `accessibility.css` | A11y utilities | Focus rings, screen reader helpers |
| `performance.css` | GPU, rendering hints | `will-change`, `contain`, `content-visibility` |

All imported via `globals.css` orchestrator:

```css
@import './styles/themes.css';
@import './styles/glass.css';
@import './styles/animations.css';
/* ... */
```

---

## 12. Authentication Flow

### Sign Up / Sign In

```
User → /sign-in (Clerk hosted component)
  → OAuth (Google, GitHub, etc.) or email/password
  → Clerk creates user session
  → Clerk fires webhook → POST /api/webhooks/clerk
  → Webhook handler creates/updates User in PostgreSQL
  → User redirected to /dashboard
```

### Middleware

```typescript
// src/middleware.ts
export default clerkMiddleware(async (auth, req) => {
  // Rate limiting
  // Protected route checks
  // Public routes: /sign-in, /sign-up, /api/health, /api/webhooks
});
```

### Server-Side Auth

```typescript
// In any API route or Server Component
const { userId } = await auth();
// userId is the Clerk user ID — used to find the User record in Prisma
```

---

## 13. Security Considerations

### API Security
- All API routes require Clerk authentication (except health + webhooks)
- Rate limiting via middleware
- Input validation with Zod schemas
- SQL injection prevention via Prisma parameterised queries
- CSRF protection via SameSite cookies (Clerk)

### Key Management
- AI API keys stored in server-side environment variables only
- Keys never exposed to the client
- `/api/ai-providers` returns only boolean availability, not actual keys
- `isValidKey()` rejects placeholder values

### Data Privacy
- User data scoped by `userId` in all queries
- Documents stored per-user with ownership checks
- Conversation data isolated between users
- Clerk handles password hashing and session management

---

## 14. Performance Optimisations

### Build & Bundle
- **Turbopack** dev server for fast HMR
- **Dynamic imports** for heavy components (quiz, tools, documents)
- **Tree-shaking** via ES modules throughout
- **Image optimisation** via Next.js `<Image>` component

### Runtime
- **SSE streaming** — AI responses appear incrementally, not after full generation
- **TanStack Query caching** — dashboard stats cached 60s, conversations cached
- **Suspense boundaries** — `loading.tsx` provides instant skeleton UI
- **CSS `will-change`** — GPU-accelerated transitions for glass effects
- **`content-visibility: auto`** — offscreen content deferred

### Database
- **pgvector indexes** — HNSW/IVFFlat for fast similarity search
- **Prisma connection pooling** — singleton client instance
- **Selective includes** — only fetch related data when needed

### CSS
- **13 focused modules** instead of one monolithic file
- **`contain: layout style`** on complex components
- **Scoped animations** — narrowed transition properties to avoid layout thrashing

---

## 15. Evolution from V1/V2

### V1: Vanilla JS SPA (~5,000 LOC)
- Browser-only, no backend
- IndexedDB for storage
- Hash-based routing (`#/dashboard`, `#/subject/:id`)
- Cerebras + Gemini via direct API calls from browser
- No authentication
- TF-IDF search in JavaScript

### V2: Vanilla JS + Python Backend (~11,700 LOC)
- Added FastAPI backend with ChromaDB vector store
- 24 tools across 7 subject modules
- Modular history system (5-file architecture)
- Multi-format export (JSON, HTML, PDF)
- 12 themes with CSS custom properties
- Still no build tools, no TypeScript, no auth

### V3: Next.js Full-Stack (~25,000+ LOC)
- Complete ground-up rewrite
- TypeScript strict mode
- Next.js 16 App Router + Server Components
- Prisma 7 ORM with PostgreSQL + pgvector
- Clerk authentication with webhook sync
- SSE streaming with multi-provider AI
- AI quiz generation with spaced repetition
- Docker Compose orchestration
- Jest 30 + Playwright testing
- 13 modular CSS files
- rem-based accessibility

The V1/V2 codebase (`S2-Sentinel-Copilot/`) remains in the workspace as a reference.

---

## Appendix: File Counts

| Directory | Files | Purpose |
|-----------|-------|---------|
| `src/app/` | ~25 | Pages + API routes |
| `src/components/` | ~40 | React components |
| `src/lib/` | ~15 | Core libraries |
| `src/hooks/` | 3 | Custom hooks |
| `src/store/` | 2 | Zustand stores |
| `src/styles/` | 13 | CSS modules |
| `src/types/` | 2 | Type definitions |
| `brain/` | ~10 | Python RAG backend |
| `prisma/` | 3 | Schema, config, seed |
| **Total** | **~115** | |
