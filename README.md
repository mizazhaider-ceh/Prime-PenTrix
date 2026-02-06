# ⚡ Prime PenTrix

> Where Penetration Testing Meets Intelligence - AI-Powered Learning Platform for CS Engineering @ Howest University Belgium

[![Version](https://img.shields.io/badge/version-3.0.0-emerald.svg)](https://github.com/yourusername/prime-pentrix)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-teal.svg)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://postgresql.org/)

## 📌 Overview

Prime PenTrix is a modern, full-stack AI-powered study platform designed specifically for Computer Science Engineering students. It combines context-aware AI assistance, RAG (Retrieval-Augmented Generation) technology, and specialized security toolkits to provide personalized learning experiences across 8 core subjects.

### ⭐ Key Features

- 🤖 **AI-Powered Learning** - Context-aware AI that adapts to each subject's pedagogy style
- 📚 **8 Core Subjects** - Networks, Pentesting, Backend, Linux, CTF, Scripting, Privacy Law, AI Security
- 🎨 **12 Stunning Themes** - Glass, Hacker, Cyber, Midnight, Ocean, Aurora, and more
- 🔐 **Clerk Authentication** - Secure OAuth-based authentication with user sync
- 🧠 **Hybrid RAG Engine** - Semantic search + BM25 + Cross-encoder reranking (pgvector)
- 🛠️ **24+ Tools** - Subject-specific toolkits for hands-on learning
- 📊 **Smart Analytics** - Track progress, streaks, quiz performance with spaced repetition
- 🐳 **Docker-Ready** - Complete infrastructure orchestration with Docker Compose

## 🏗️ Architecture

```
sentinel-v3/
├── web/              # Next.js 15 Frontend (TypeScript, Tailwind, Shadcn/UI)
├── brain/            # Python FastAPI Backend (AI/RAG Engine)
├── shared/           # Shared types & configs
├── infrastructure/   # Docker Compose, Dockerfiles
├── docs/             # Documentation
└── tests/            # Integration tests
```

### Tech Stack

#### Frontend (`web/`)
- **Framework**: Next.js 15 (App Router, Server Components, RSC)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS v4 + CSS Variables (12 themes)
- **UI Components**: Shadcn/UI (Radix UI primitives)
- **Authentication**: Clerk (OAuth, webhooks, user sync)
- **State Management**: Zustand + React Query (TanStack Query)
- **Validation**: Zod + React Hook Form
- **Database ORM**: Prisma (PostgreSQL)
- **Notifications**: Sonner (toast library)
- **Icons**: Lucide React

#### Backend (`brain/`)
- **Framework**: FastAPI 0.115.0 (async/await)
- **Language**: Python 3.11
- **AI Models**: Cerebras (Llama 3.3-70B), Google Gemini 1.5 Flash
- **Embeddings**: Sentence Transformers (all-MiniLM-L6-v2, 384 dims)
- **Reranking**: Cross-Encoder (ms-marco-MiniLM-L-6-v2)
- **Keyword Search**: BM25 (rank-bm25)
- **Vector DB**: pgvector (PostgreSQL extension)
- **Document Processing**: PyPDF, python-docx, unstructured
- **NLP**: NLTK, spaCy

#### Infrastructure
- **Database**: PostgreSQL 16 with pgvector extension
- **Containerization**: Docker + Docker Compose
- **Orchestration**: 3 services (postgres, brain, web)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22+ (for Next.js frontend)
- **Python** 3.11+ (for FastAPI backend)
- **PostgreSQL** 16 with pgvector extension
- **Docker Desktop** (recommended for easy setup)
- **Clerk Account** (for authentication) → [clerk.com](https://clerk.com)

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/prime-pentrix.git
   cd prime-pentrix
   ```

2. **Set up environment variables**
   ```bash
   # Copy env templates
   cp web/.env.example web/.env.local
   cp brain/.env.example brain/.env
   
   # Add your Clerk keys in web/.env.local
   # Add AI API keys in brain/.env
   ```

3. **Start all services with Docker Compose**
   ```bash
   cd infrastructure
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Database: localhost:5432

### Option 2: Local Development Setup

#### 1. Setup PostgreSQL with pgvector

```bash
# Install PostgreSQL 16
# Install pgvector extension
psql -U postgres
CREATE DATABASE prime_pentrix;
CREATE EXTENSION vector;
```

#### 2. Setup Next.js Frontend

```bash
cd web

# Install dependencies (includes Prisma 7, adapter, and dotenv)
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local and add:
# - DATABASE_URL (PostgreSQL connection string)
# - Clerk keys (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY)
# - AI API keys (optional for Phase 1)

# Generate Prisma Client (Prisma 7 with PostgreSQL adapter)
npm run db:generate

# Push Prisma schema to database (creates all 12 tables)
npm run db:push

# Seed the database with 8 subjects
npm run db:seed

# Start development server
npm run dev
```

Frontend will be available at: http://localhost:3000

**Note:** Prisma 7 uses a driver adapter for PostgreSQL. The connection is managed through `@prisma/adapter-pg` and `pg` packages.

#### 3. Setup Python Backend (Optional for Phase 1)

```bash
cd brain

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download NLP models
python -m nltk.downloader punkt stopwords
python -m spacy download en_core_web_sm

# Start FastAPI server
uvicorn main:app --reload
```

Backend API will be available at: http://localhost:8000

## 🔧 Configuration

### Environment Variables

#### Frontend (`web/.env.local`)

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/prime_pentrix"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# AI APIs
CEREBRAS_API_KEY="your_key"
GOOGLE_GEMINI_API_KEY="your_key"

# Backend
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
```

#### Backend (`brain/.env`)

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/prime_pentrix"
CEREBRAS_API_KEY="your_key"
GOOGLE_GEMINI_API_KEY="your_key"
OPENAI_API_KEY="your_key"
```

### Clerk Setup

1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Copy Publishable Key and Secret Key to `web/.env.local`
4. Configure webhook at: `https://yourdomain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
5. Copy webhook secret to `CLERK_WEBHOOK_SECRET`

## 📚 Database Schema

The application uses **Prisma ORM v7.3.0** with PostgreSQL + pgvector. Prisma 7 uses a JavaScript-based engine with the `@prisma/adapter-pg` driver adapter for PostgreSQL connections.

### Database Models (12 total)

- **User** - User accounts synced from Clerk
- **Subject** - 8 core subjects (Networks, Pentesting, etc.)
- **Conversation** - Chat conversations
- **Message** - Chat messages with AI
- **Document** - Uploaded study documents
- **DocumentChunk** - Document chunks with vector embeddings (pgvector)
- **Analytics** - Event tracking
- **StudySession** - Study time tracking
- **QuizScore** - Quiz attempt records
- **QuizReview** - Spaced repetition system
- **ToolHistory** - Tool usage history
- **GlobalStats** - User achievements and streaks

### Prisma 7 Key Changes

- Connection URL configured in `prisma.config.ts` (not `schema.prisma`)
- Uses PostgreSQL driver adapter (`@prisma/adapter-pg` + `pg`)
- No Rust engine binaries - pure JavaScript implementation

### Database Commands

```bash
cd web

# Generate Prisma Client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Create migration (production)
npm run db:migrate

# Seed database with 8 subjects
npm run db:seed

# Open Prisma Studio (GUI)
npm run db:studio
```

## 🎨 Themes

12 beautiful themes included:

- 💎 **Glass** (Default) - Deep emerald gradient
- ⚡ **Prime Dark** - Tactical command center
- 💻 **Hacker** - Matrix green terminal
- 🌙 **Midnight** - Ultra dark indigo
- ⚡ **Cyber** - High contrast yellow/black
- 🌊 **Ocean** - Deep blue gradient
- 🌲 **Forest** - Mysterious green
- 🌌 **Nebula** - Cosmic purple/pink
- 🌈 **Aurora** - Northern lights teal
- 🌅 **Sunset** - Vibrant pink/purple
- 💜 **Lavender** - Soft dreamy purple
- ☀️ **Light** - Minimalist light mode

## 📦 Project Structure

```
sentinel-v3/
├── web/                          # Next.js Frontend
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   │   ├── (auth)/
│   │   │   │   ├── sign-in/      # Sign-in page
│   │   │   │   └── sign-up/      # Sign-up page
│   │   │   ├── api/              # API routes
│   │   │   │   ├── health/       # Health check
│   │   │   │   ├── subjects/     # Subject CRUD
│   │   │   │   └── webhooks/     # Clerk webhook
│   │   │   ├── dashboard/        # Main dashboard
│   │   │   ├── workspace/        # Subject workspace
│   │   │   ├── layout.tsx        # Root layout
│   │   │   └── page.tsx          # Landing page
│   │   ├── components/           # React components
│   │   │   ├── ui/               # Shadcn/UI components
│   │   │   ├── providers/        # Context providers
│   │   │   ├── theme-switcher.tsx
│   │   │   ├── subject-card.tsx
│   │   │   └── dashboard-header.tsx
│   │   ├── lib/                  # Utilities
│   │   │   ├── prisma.ts         # Prisma client
│   │   │   └── utils.ts          # Helper functions
│   │   └── types/                # TypeScript types
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   └── seed.ts               # Seed script
│   ├── public/                   # Static assets
│   ├── .env.example              # Env template
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
│
├── brain/                        # Python FastAPI Backend
│   ├── rag/                      # RAG engine modules
│   │   └── engine.py             # Hybrid search engine
│   ├── main.py                   # FastAPI app entry
│   ├── config.py                 # Configuration
│   ├── requirements.txt          # Python dependencies
│   └── Dockerfile                # Docker build
│
├── shared/                       # Shared configs
│   └── constants.ts              # Shared constants
│
├── infrastructure/               # DevOps & Docker
│   ├── docker-compose.yml        # Orchestration
│   └── init-db.sql               # DB initialization
│
├── docs/                         # Documentation
├── tests/                        # Integration tests
├── .gitignore                    # Git ignore patterns
└── README.md                     # This file
```

## 🧪 Testing

```bash
# Frontend tests (coming in Phase 5)
cd web
npm run test

# Backend tests (coming in Phase 5)
cd brain
pytest
```

## 📈 Development Roadmap

### ✅ Phase 1: Core Infrastructure (COMPLETED)
- [x] Monorepo structure
- [x] Next.js 15 + TypeScript + Tailwind setup
- [x] Clerk authentication
- [x] Prisma schema + PostgreSQL + pgvector
- [x] 12 theme system
- [x] Dashboard + subject cards
- [x] Workspace layout
- [x] Python FastAPI skeleton
- [x] Docker Compose + Dockerfiles

### 🚧 Phase 2: AI Chat (In Progress)
- [ ] Chat interface UI
- [ ] AI model integration (Cerebras/Gemini)
- [ ] Context-aware prompting
- [ ] Conversation management
- [ ] Message streaming

### 🔜 Phase 3: RAG Engine
- [ ] Document upload & processing
- [ ] Text chunking & embedding generation
- [ ] pgvector semantic search
- [ ] BM25 keyword search
- [ ] Hybrid search with RRF
- [ ] Cross-encoder reranking

### 🔜 Phase 4: Quiz System
- [ ] Quiz generation with AI
- [ ] Spaced repetition algorithm
- [ ] Quiz attempt tracking
- [ ] Review scheduling

### 🔜 Phase 5: Tools & Analytics
- [ ] 24 subject-specific tools
- [ ] Analytics dashboard
- [ ] Streak tracking
- [ ] Achievement system

### 🔜 Phase 6: Production
- [ ] Vercel deployment
- [ ] CI/CD pipeline
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation complete

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](./CONTRIBUTING.md) first.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 👨‍💻 Author

**Muhammad Izaz Haider (MIHx0)**
- Role: Junior DevSecOps & AI Security Engineer @ Damno Solutions
- Education: Cybersecurity Student @ Howest University Belgium 🇧🇪
- GitHub: [@MIHx0](https://github.com/MIHx0)

## 🙏 Acknowledgments

- Howest University Belgium - CS Engineering Program
- All Semester 2 professors and teaching staff
- Open source community for incredible tools and libraries

---

**Built with ❤️ for the Howest CS Engineering community**
