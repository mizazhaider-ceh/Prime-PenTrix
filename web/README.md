# ⚡ Prime PenTrix - Web Application

An intelligent AI-powered learning platform built with Next.js 16, Prisma, and multiple AI providers.

---

## 🚀 Quick Start

### Using Server Manager (Recommended)

```cmd
server.bat
```

**Interactive Menu:**
- **[1]** Start Server
- **[2]** Stop Server  
- **[3]** Restart Server
- **[4]** Check Status
- **[5]** Clean Cache
- **[6-9]** Database & Setup Options

### First Time Setup

1. Run `server.bat`
2. Select **[9]** Install Dependencies
3. Select **[7]** Database Push
4. Select **[8]** Database Seed
5. Select **[1]** Start Server
6. Visit **http://localhost:3000**

---

## 📋 Requirements

- **Node.js** 18+ 
- **PostgreSQL** 16+ with pgvector
- **NPM** or **Yarn**

---

## ⚙️ Configuration

Create `.env.local` with:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/prime_pentrix"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# AI Providers (at least one required)
CEREBRAS_API_KEY="your_key"
GOOGLE_GEMINI_API_KEY="your_key"
PREFERRED_AI_PROVIDER="cerebras"
```

---

## 📦 Tech Stack

- **Framework:** Next.js 16 (App Router + Turbopack)
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** Clerk
- **AI:** Cerebras (Llama 3.1) + Google Gemini
- **Styling:** Tailwind CSS v4
- **State:** Zustand
- **Markdown:** React-Markdown + Syntax Highlighting

---

## 📖 Documentation

- **[SERVER.md](SERVER.md)** - Detailed server management guide
- **[/docs](../docs/)** - Project documentation
- **[PHASE-2-COMPLETE.md](../docs/PHASE-2-COMPLETE.md)** - Current implementation status

---

## 🛠️ Development

### NPM Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:seed      # Seed initial data
```

### Common Tasks

**Fix Port in Use:**
```cmd
server.bat → [2] Stop Server
```

**Clear Cache:**
```cmd
server.bat → [5] Clean Cache
```

**Check What's Running:**
```cmd
server.bat → [4] Check Status
```

---

## 🌟 Features

- ✅ AI-powered chat with streaming responses
- ✅ Multiple AI providers with automatic fallback
- ✅ Subject-specific learning modes
- ✅ Conversation management & export
- ✅ Markdown & code syntax highlighting
- ✅ Real-time message streaming
- ✅ Advanced prompt engineering
- ✅ Dark mode support

---

## 🤝 Contributing

See the main project [README](../README.md) for contribution guidelines.

---

## 📄 License

Copyright © 2026 Prime-Pentrix V3. All rights reserved.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
