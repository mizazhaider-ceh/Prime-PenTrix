# Features Guide — Prime PenTrix

> Detailed documentation of every feature in the platform

---

## Table of Contents

1. [AI Chat System](#1-ai-chat-system)
2. [RAG Document Intelligence](#2-rag-document-intelligence)
3. [AI Quiz System](#3-ai-quiz-system)
4. [Security Toolkit](#4-security-toolkit)
5. [Dashboard & Analytics](#5-dashboard--analytics)
6. [Theme System](#6-theme-system)
7. [Subject System](#7-subject-system)
8. [Conversation Management](#8-conversation-management)
9. [AI Settings & Provider Management](#9-ai-settings--provider-management)
10. [About / Info Page](#10-about--info-page)

---

## 1. AI Chat System

### Overview
The chat system provides subject-aware AI conversations with real-time streaming, conversation persistence, and multi-provider support.

### How It Works

1. **Select a subject** on the dashboard (e.g., Computer Networks)
2. **Open the Chat tab** in the workspace
3. **Type a question** — the AI responds with subject-specific knowledge
4. **Responses stream in real-time** via Server-Sent Events (SSE)
5. **Each message shows a model badge** indicating which AI responded (e.g., "llama-3.3-70b")

### Multi-Provider AI

The platform supports three AI providers with automatic fallback:

| Provider | Model | Speed | Use Case |
|----------|-------|-------|----------|
| **Cerebras** | Llama 3.3-70B | ~1000+ tok/s | Primary — fastest inference |
| **Google Gemini** | Gemini 1.5 Flash | ~200 tok/s | Fallback |
| **OpenAI** | GPT-4 | ~100 tok/s | Optional third provider |

If the preferred provider fails, the system automatically tries the next available one.

### Subject-Aware Prompts

Every subject has a unique **pedagogy style** that shapes how the AI responds:

| Subject | Pedagogy | Example Behaviour |
|---------|----------|------------------|
| Networks | Packet-First | References OSI layers, explains with packet flow |
| Pentesting | Attack-Chain | Walks through attack methodology step-by-step |
| Linux | CLI-First | Provides commands first, then explains |
| CTF | Hint-Ladder | Gives progressive hints, doesn't spoil flags |
| Backend | Code-First | Shows code examples before theory |
| Scripting | Annotated-Code | Explains with heavily commented code |
| Privacy | Case-Based | References GDPR cases and legal precedents |

### Markdown Rendering

AI responses support:
- **Syntax-highlighted code blocks** (200+ languages via rehype-highlight)
- **LaTeX math** (inline `$...$` and block `$$...$$` via KaTeX)
- **GitHub-Flavoured Markdown** (tables, task lists, strikethrough)
- **Raw HTML** rendering when needed

---

## 2. RAG Document Intelligence

### Overview
Upload your study materials (PDFs, DOCX, TXT, MD) and chat with them. The RAG engine chunks, embeds, and indexes documents for precise, citation-backed answers.

### Upload & Processing Pipeline

1. **Upload a document** in the Documents tab (max 20 MB)
2. **Text extraction** — PyPDF for PDFs, python-docx for DOCX, direct reading for TXT/MD
3. **Semantic chunking** — text split into meaningful chunks with header detection
4. **Embedding generation** — OpenAI `text-embedding-3-small` creates vector(384) embeddings
5. **BM25 indexing** — term frequency analysis for keyword search
6. **Storage** — chunks stored in `DocumentChunk` table with both vector and BM25 data

### Hybrid Search

When you ask a question about your documents, the system runs:
- **BM25 keyword search** — fast, exact term matching (e.g., searching for "ARP" finds all ARP-related chunks)
- **Vector similarity search** — semantic meaning matching via pgvector cosine distance
- **Score fusion** — weighted combination of both scores
- **Top-k retrieval** — returns the most relevant chunks

### Doc-Chat Interface

The Documents tab has a dedicated **doc-chat interface** that:
- Only searches within your uploaded documents
- Provides citations for every answer
- Is kept separate from the regular Chat tab (doc-chat conversations don't appear in the Chat sidebar)

### Supported Formats

| Format | Max Size | Processing |
|--------|----------|-----------|
| PDF | 20 MB | PyPDF text extraction |
| DOCX | 20 MB | python-docx parsing |
| TXT | 20 MB | Direct reading |
| MD | 20 MB | Direct reading |

---

## 3. AI Quiz System

### Overview
Generate AI-powered quizzes on any topic, get instant grading with detailed feedback, and track progress with spaced repetition.

### Question Types

| Type | Format | Grading |
|------|--------|---------|
| **MCQ** | 4 options, one correct | 5-strategy deterministic matching |
| **True/False** | Binary choice | Normalised boolean comparison |
| **Fill-in-the-Blank** | Text input | AI semantic grading |
| **Short Answer** | Open text | AI semantic grading |

### Quiz Flow

1. **Select subject** → open Quiz tab
2. **Configure quiz**: topic, difficulty (easy/medium/hard), question count, types
3. **AI generates questions** using subject context + pedagogy style
4. **Take the quiz** — timed interface with progress tracking
5. **Submit answers** → grading pipeline runs
6. **View results**: score, grade, per-question feedback with explanations
7. **Dashboard stats update immediately** (no delay)

### MCQ Grading (5-Strategy Deterministic Matching)

The system uses a robust matching pipeline that handles AI inconsistencies:

1. **Direct text match** — both answers are full option text
2. **Letter-to-index** — "A" maps to option[0], "B" to option[1], etc.
3. **Index-to-letter** — reverse mapping
4. **Prefix stripping** — "A. DNS resolution" → "DNS resolution"
5. **Index comparison** — find both answers in options array by index
6. **Fuzzy containment** — for answers longer than 3 characters

If all deterministic strategies fail, **AI grading** takes over with a strict prompt that marks unclear answers as incorrect.

### Spaced Repetition

Incorrectly answered questions are tracked for review using the **SM-2 algorithm**:

- **Ease Factor**: starts at 2.5, adjusts based on performance
- **Interval**: days until next review (1, 6, 15, 35, ...)
- **Next Review Date**: calculated from submission time

The Review Dashboard shows upcoming reviews and mastery progress.

---

## 4. Security Toolkit

### Overview
24+ built-in tools across 7 subject categories. All tools run client-side or server-side — no external API calls needed.

### Tool Categories

#### Networks (4 tools)
- **Subnet Calculator** — calculate network/broadcast/host range from IP + CIDR
- **CIDR Converter** — convert between CIDR notation and subnet masks
- **Port Reference** — look up well-known ports and service descriptions
- **DNS Lookup** — resolve domain names

#### Pentesting (4 tools)
- **JWT Decoder** — decode and inspect JSON Web Tokens
- **Header Analyzer** — analyse HTTP response headers for security issues
- **Hash Identifier** — detect hash type (MD5, SHA-1, SHA-256, bcrypt, etc.)
- **Encoding Tools** — Base64, URL encode/decode, hex conversion

#### CTF (3 tools)
- **Base Converter** — convert between binary, octal, decimal, hex
- **Cipher Tools** — Caesar, ROT13, Vigenère, XOR
- **Steganography Helpers** — file signature analysis

#### Scripting (3 tools)
- **Regex Tester** — test regular expressions with live matching
- **JSON Validator** — parse and pretty-print JSON
- **Diff Viewer** — compare two text blocks

#### Linux (3 tools)
- **Permission Calculator** — convert between symbolic and octal (chmod)
- **Cron Generator** — build cron expressions with human-readable preview
- **Command Reference** — searchable Linux command database

#### Backend (4 tools)
- **SQL Formatter** — format and beautify SQL queries
- **API Tester** — make HTTP requests (GET, POST, PUT, DELETE)
- **Session Analyzer** — decode session tokens and cookies
- **JSON Path Query** — query JSON with JSONPath expressions

#### Privacy (3 tools)
- **GDPR Article Lookup** — search GDPR articles by topic
- **Data Classification** — classify data sensitivity levels
- **Privacy Impact Helper** — DPIA guidance

### Tool History

All tool executions are logged to the `ToolHistory` table with input/output data for reference.

---

## 5. Dashboard & Analytics

### Dashboard

The main dashboard shows:
- **8 subject cards** in an equal-height grid with icons, descriptions, and quick stats
- **Stats bar** — total quizzes taken, study sessions, current streak
- **Quick actions** — AI settings, theme switcher, analytics link

### Analytics Dashboard (`/dashboard/analytics`)

Comprehensive learning analytics:
- **Study time by subject** — visual breakdown of time spent per course
- **Activity calendar** — GitHub-style contribution heatmap
- **Quiz performance trends** — score progression over time
- **Session history** — recent study sessions with duration and mode
- **Streak tracking** — current and longest study streaks
- **Achievement badges** — milestones and accomplishments

### Real-Time Stats

Dashboard stats use TanStack Query with:
- `staleTime: 60_000` (cached for 1 minute)
- Immediate cache invalidation after quiz completion
- Background refetching on window focus

---

## 6. Theme System

### 12 Themes

| # | Theme | Accent | Style |
|---|-------|--------|-------|
| 1 | **Glass** | Emerald | Frosted glass gradient (default) |
| 2 | **Prime Dark** | Emerald | Tactical command centre |
| 3 | **Hacker** | Green | Matrix terminal aesthetic |
| 4 | **Midnight** | Indigo | Ultra-dark blue |
| 5 | **Cyber** | Yellow | High-contrast neon |
| 6 | **Ocean** | Blue | Deep blue gradient |
| 7 | **Forest** | Green | Dark forest mystery |
| 8 | **Nebula** | Purple/Pink | Cosmic space |
| 9 | **Aurora** | Teal | Northern lights |
| 10 | **Sunset** | Pink/Purple | Warm gradient |
| 11 | **Lavender** | Purple | Soft dreamy |
| 12 | **Light** | Emerald | Clean minimal light |

### How Themes Work

- Each theme defines **30+ CSS custom properties** in `themes.css`
- Applied via `data-theme` attribute on `<html>`
- An **inline script** in `layout.tsx` restores the saved theme from `localStorage` before React hydrates — **no FOUC** (Flash of Unstyled Content)
- All glassmorphic effects adapt to the current theme automatically
- Clerk components are themed via CSS overrides in `clerk.css`

### Switching Themes

Click the **palette icon** in the dashboard header to open the theme dropdown. Changes apply instantly and persist across sessions.

---

## 7. Subject System

### 8 Subjects

| # | Subject | Code | Credits | Pedagogy |
|---|---------|------|---------|----------|
| 1 | Computer Networks | CCPD1 | 6 | Packet-First |
| 2 | Web Pentesting | WEB-P | 3 | Attack-Chain |
| 3 | Web Backend | BACK | 3 | Code-First |
| 4 | Linux for Ethical Hackers | LNX-ETH | 6 | CLI-First |
| 5 | Capture The Flag | CTF | 3 | Hint-Ladder |
| 6 | Scripting & Code Analysis | SCRPT | 6 | Annotated-Code |
| 7 | Data Privacy & IT Law | PRIV | 3 | Case-Based |
| 8 | General (AI Security) | GEN | — | Socratic |

### Subject Configuration

Each subject in the database includes:
- **Name, code, slug** — identification
- **Description** — what the course covers
- **Color + icon** — visual identity (used in cards, sidebar, badges)
- **Credits** — ECTS credit weight
- **Teachers** — instructor names
- **Topics** — array of key topics covered
- **Pedagogy style** — how the AI should teach this subject
- **Toolkit** — which tools are relevant
- **Prompt style** — AI system prompt customisations

### Workspace Tabs

Each subject workspace has 4 tabs:
1. **Chat** — AI conversations
2. **Documents** — Upload, manage, and chat with study materials
3. **Quiz** — Take AI-generated quizzes
4. **Tools** — Subject-specific toolkit

---

## 8. Conversation Management

### Features
- **Create** conversations per subject
- **Search** conversations by title
- **Filter** by time (today, this week, this month)
- **Rename** conversations
- **Delete** individual conversations
- **Continue** previous conversations

### Conversation Modes

| Mode | Description |
|------|-------------|
| `chat` | Regular AI chat |
| `doc-chat` | RAG document-based chat (hidden from Chat sidebar) |
| `learn` | Learning-focused conversation |
| `questions` | Q&A mode |
| `explain` | Explanation-focused |
| `summarize` | Document summarisation |
| `quiz` | Quiz-related conversation |

### Sidebar

The `ConversationSidebar` component shows:
- Recent conversations (sorted by last updated)
- Message count badge
- Subject colour indicator
- Search input with debounce
- New conversation button
- **Doc-chat conversations are filtered out** — they only appear in the Documents tab

---

## 9. AI Settings & Provider Management

### AI Settings Modal

Accessible via the **brain icon** in the dashboard header:

- **Provider selection** — dropdown showing all 3 providers
  - Available providers show green **READY** badge
  - Unavailable providers show red **NO KEY** badge and are **disabled** (greyed out with strikethrough)
- **Model selection** — available models for the selected provider
- **Settings persistence** — saved to localStorage

### Provider Fallback Logic

1. User selects preferred provider in settings
2. If provider has no valid key → **auto-redirect** to first available provider
3. During chat:
   - Try preferred provider
   - If it fails → try next available
   - If all fail → show error

### Key Validation

The server validates API keys by checking they're not placeholders:
- Not empty/undefined
- Not containing "your_key", "sk-...", "placeholder", "test"

---

## 10. About / Info Page

### Route: `/info`

The Info page showcases the platform with sections:

1. **Hero** — Logo, tagline, version badge
2. **Core Features** — 6 feature cards with icons
3. **Semester 2 Subjects** — 8 subject badges
4. **Tech Stack** — 5-column grid (Frontend, AI/ML, Backend, Security, DevOps)
5. **Architecture** — 3-column overview (Frontend, AI Engine, Data Layer)
6. **About the Creator** — Avatar, bio, social links (GitHub, LinkedIn, Website)
7. **Why I Built This** — 3 personal narrative sections:
   - Pushing My Boundaries
   - Learning by Building
   - Bridging AI & Cybersecurity
8. **CTA** — Back to Dashboard button
9. **Footer** — App footer with links
