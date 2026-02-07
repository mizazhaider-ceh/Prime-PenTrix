# API Reference — Prime PenTrix

> Complete reference for all 17 API route handlers

All API routes are located under `web/src/app/api/`. Unless noted otherwise, all endpoints require **Clerk authentication** — requests must include a valid session cookie or Bearer token.

---

## Table of Contents

- [Authentication](#authentication)
- [Health](#health)
- [AI Providers](#ai-providers)
- [Subjects](#subjects)
- [Conversations](#conversations)
- [Messages](#messages)
- [Chat (Streaming)](#chat-streaming)
- [Documents](#documents)
- [Document Search (RAG)](#document-search-rag)
- [Quiz Generation](#quiz-generation)
- [Quiz Submission](#quiz-submission)
- [Tools](#tools)
- [Analytics](#analytics)
- [Webhooks](#webhooks)
- [Error Responses](#error-responses)

---

## Authentication

All authenticated endpoints use Clerk's `auth()` server function. The user's Clerk ID is resolved to a local `User` record via Prisma.

```
Authorization: Bearer <clerk_session_token>
```

Or via Clerk session cookie (automatic in browser).

Unauthenticated requests receive:
```json
{ "error": "Unauthorized" }  // 401
```

---

## Health

### `GET /api/health`

**Auth:** None

Health check endpoint. Tests database connectivity.

**Response (200)**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-02-07T12:00:00.000Z"
}
```

**Response (500)**
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "Connection refused"
}
```

---

## AI Providers

### `GET /api/ai-providers`

**Auth:** None

Returns which AI providers have valid (non-placeholder) API keys configured on the server. Does **not** expose actual key values.

**Response (200)**
```json
{
  "providers": {
    "cerebras": true,
    "gemini": false,
    "openai": false
  }
}
```

---

## Subjects

### `GET /api/subjects`

**Auth:** Required

Returns all 8 subjects from the database, ordered by code.

**Response (200)**
```json
[
  {
    "id": "uuid",
    "name": "Computer Networks",
    "code": "CCPD1",
    "slug": "networks",
    "description": "...",
    "color": "#3B82F6",
    "icon": "Network",
    "credits": 6,
    "teachers": ["..."],
    "topics": ["OSI Model", "TCP/IP", ...],
    "pedagogyStyle": "Packet-First",
    "toolkit": ["subnet-calculator", "port-lookup", ...],
    "promptStyle": "...",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
]
```

---

## Conversations

### `GET /api/conversations`

**Auth:** Required

List user's conversations with optional filters.

**Query Parameters**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `subjectId` | UUID | — | Filter by subject |
| `mode` | string | — | Filter by mode (`chat`, `doc-chat`, `learn`, `questions`, etc.) |
| `search` | string | — | Search in conversation titles |
| `timeFilter` | string | — | `today`, `week`, or `month` |

**Response (200)**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "OSI Model Deep Dive",
      "mode": "chat",
      "createdAt": "...",
      "updatedAt": "...",
      "subject": {
        "id": "uuid",
        "name": "Computer Networks",
        "slug": "networks",
        "color": "#3B82F6",
        "icon": "Network"
      },
      "_count": { "messages": 12 }
    }
  ]
}
```

### `POST /api/conversations`

**Auth:** Required

Create a new conversation.

**Request Body**
```json
{
  "title": "New Chat",
  "subjectId": "uuid",
  "mode": "chat"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string (1-200 chars) | Yes | Conversation title |
| `subjectId` | UUID | Yes | Subject ID |
| `mode` | string | No | `chat` (default), `doc-chat`, `learn`, `questions`, `explain`, `summarize`, `quiz` |

**Response (201)**
```json
{
  "conversation": { ... }
}
```

### `GET /api/conversations/[id]`

**Auth:** Required

Get a single conversation with all messages.

**Response (200)**
```json
{
  "conversation": {
    "id": "uuid",
    "title": "...",
    "mode": "chat",
    "subject": { ... },
    "messages": [
      {
        "id": "uuid",
        "role": "user",
        "content": "What is the OSI model?",
        "model": null,
        "tokenCount": null,
        "contextUsed": false,
        "createdAt": "...",
        "user": {
          "name": "Muhammad Izaz",
          "email": "...",
          "avatarUrl": "..."
        }
      }
    ],
    "_count": { "messages": 12 }
  }
}
```

### `PATCH /api/conversations/[id]`

**Auth:** Required

Update conversation title or mode.

**Request Body**
```json
{
  "title": "Updated Title",
  "mode": "questions"
}
```

### `DELETE /api/conversations/[id]`

**Auth:** Required

Delete a conversation and all its messages (cascade).

**Response (200)**
```json
{ "success": true }
```

---

## Messages

### `GET /api/messages`

**Auth:** Required

List messages for a conversation.

**Query Parameters**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `conversationId` | UUID | Yes | Conversation to fetch messages from |

**Response (200)**
```json
{
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "...",
      "model": null,
      "tokenCount": 42,
      "contextUsed": false,
      "createdAt": "..."
    }
  ]
}
```

### `POST /api/messages`

**Auth:** Required

Create a new message in a conversation.

**Request Body**
```json
{
  "conversationId": "uuid",
  "role": "user",
  "content": "What is ARP spoofing?",
  "tokenCount": 8,
  "model": "llama-3.3-70b",
  "contextUsed": ["doc-chunk-id-1", "doc-chunk-id-2"]
}
```

### `PATCH /api/messages/[id]`

Update a message's content.

### `DELETE /api/messages/[id]`

Delete a message.

---

## Chat (Streaming)

### `POST /api/chat`

**Auth:** Required

Main AI chat endpoint. Streams the response via Server-Sent Events (SSE).

**Request Headers**
| Header | Type | Description |
|--------|------|-------------|
| `x-ai-provider` | string | Preferred provider: `cerebras`, `gemini`, or `openai` |
| `x-ai-model` | string | Specific model ID |

**Request Body**
```json
{
  "conversationId": "uuid",
  "message": "Explain the TCP three-way handshake",
  "contextDocuments": ["chunk-id-1", "chunk-id-2"],
  "useRag": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `conversationId` | UUID | Yes | Target conversation |
| `message` | string | Yes | User's message |
| `contextDocuments` | string[] | No | Document chunk IDs for RAG context |
| `useRag` | boolean | No | Enable RAG retrieval (default: false) |

**Response:** `Content-Type: text/event-stream`

```
data: {"type":"userMessage","message":{...}}

data: {"content":"The TCP","done":false}

data: {"content":" three-way","done":false}

data: {"content":" handshake...","done":false}

data: {"content":"","done":true,"messageId":"uuid","provider":"cerebras","model":"llama-3.3-70b"}
```

**Stream Event Types:**
1. `userMessage` — Confirmation of saved user message
2. Content chunks — partial AI response text (`done: false`)
3. Final event — empty content, `done: true`, includes `provider` and `model` used

**Fallback Behaviour:** If the preferred provider fails, the AIManager automatically falls through to the next available provider.

---

## Documents

### `GET /api/documents`

**Auth:** Required

List user's uploaded documents.

**Query Parameters**
| Param | Type | Description |
|-------|------|-------------|
| `subjectId` | UUID | Filter by subject |
| `status` | string | Filter by processing status |

**Response (200)**
```json
{
  "documents": [
    {
      "id": "uuid",
      "filename": "chapter5.pdf",
      "mimeType": "application/pdf",
      "fileSize": 245760,
      "status": "processed",
      "fileUrl": "/uploads/...",
      "subject": { "id": "uuid", "name": "...", "slug": "...", "color": "...", "icon": "..." },
      "_count": { "chunks": 24 }
    }
  ]
}
```

### `POST /api/documents`

**Auth:** Required

Upload a new document.

**Request:** `Content-Type: multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | PDF, DOCX, TXT, or MD (max 20 MB) |
| `subjectId` | UUID | Yes | Subject to associate with |

**Validation:**
- MIME type check (whitelist)
- Magic byte verification (file header inspection)
- Filename sanitisation
- Size limit: 20 MB

**Response (201)**
```json
{
  "document": { ... },
  "message": "Document uploaded successfully. Processing will begin shortly."
}
```

### `GET /api/documents/[id]`

Get a single document with metadata.

### `DELETE /api/documents/[id]`

Delete a document and all its chunks (cascade).

---

## Document Search (RAG)

### `POST /api/documents/search`

**Auth:** Required

Hybrid search across document chunks using BM25 + vector similarity.

**Request Body**
```json
{
  "query": "How does ARP spoofing work?",
  "subjectId": "uuid",
  "topK": 5,
  "searchType": "hybrid",
  "minSimilarity": 0.5
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `query` | string (1-1000) | — | Search query |
| `subjectId` | UUID | — | Subject scope |
| `topK` | integer (1-20) | 5 | Number of results |
| `searchType` | string | `hybrid` | `semantic`, `bm25`, or `hybrid` |
| `minSimilarity` | float (0-1) | 0.5 | Minimum relevance threshold |

**Response (200)**
```json
{
  "results": [
    {
      "chunkId": "uuid",
      "content": "ARP spoofing is a type of attack...",
      "similarity": 0.87,
      "documentTitle": "chapter5.pdf"
    }
  ],
  "query": "How does ARP spoofing work?",
  "searchType": "hybrid",
  "totalResults": 3
}
```

---

## Quiz Generation

### `POST /api/quiz/generate`

**Auth:** Required

Generate quiz questions using AI.

**Request Body**
```json
{
  "subjectId": "uuid",
  "topic": "TCP/IP",
  "difficulty": "medium",
  "questionTypes": ["mcq", "true-false"],
  "questionCount": 5,
  "useDocuments": false
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `subjectId` | UUID | — | Subject for context |
| `topic` | string | — | Specific topic (optional) |
| `difficulty` | string | `medium` | `easy`, `medium`, `hard` |
| `questionTypes` | string[] | `["mcq","true-false"]` | Question type mix |
| `questionCount` | integer | 5 | Number of questions |
| `useDocuments` | boolean | false | Use uploaded docs as context |

**Response (200)**
```json
{
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "Which layer of the OSI model handles routing?",
      "options": ["Physical", "Data Link", "Network", "Transport"],
      "correct": "Network",
      "explanation": "The Network layer (Layer 3) handles routing..."
    }
  ],
  "subject": "Computer Networks",
  "topic": "TCP/IP",
  "difficulty": "medium"
}
```

---

## Quiz Submission

### `POST /api/quiz/submit`

**Auth:** Required

Submit quiz answers for grading.

**Request Body**
```json
{
  "subjectId": "uuid",
  "topic": "TCP/IP",
  "difficulty": "medium",
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "Which layer handles routing?",
      "options": ["Physical", "Data Link", "Network", "Transport"],
      "correct": "Network",
      "explanation": "...",
      "userAnswer": "Network"
    }
  ],
  "timeSpent": 120
}
```

**Grading Pipeline:**
1. **MCQ / True-False** → 5-strategy deterministic matching:
   - Direct text comparison
   - Letter-to-index mapping (A→0, B→1, etc.)
   - Prefix stripping ("A. Network" → "Network")
   - Index comparison via options array
   - Fuzzy containment for longer text
2. **Fill-in / Short Answer** → Strict AI grading prompt
3. Saves `QuizScore` record
4. Updates spaced repetition (`QuizReview`) with SM-2 algorithm
5. Updates `GlobalStats.totalQuizzes`
6. Client invalidates `dashboard-stats` query cache

**Response (200)**
```json
{
  "results": {
    "score": 80,
    "correctCount": 4,
    "incorrectCount": 1,
    "totalQuestions": 5,
    "grade": "B+",
    "feedback": [
      {
        "questionId": "q1",
        "correct": true,
        "userAnswer": "Network",
        "correctAnswer": "Network",
        "explanation": "..."
      }
    ]
  },
  "spacedRepetition": {
    "reviewsCreated": 1,
    "nextReviewDate": "2026-02-10T00:00:00.000Z"
  }
}
```

---

## Tools

### `GET /api/tools/execute`

**Auth:** Required

Get tool metadata/definition.

**Query Parameters**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `toolId` | string | Yes | Tool identifier |

### `POST /api/tools/execute`

**Auth:** Required

Execute a registered tool.

**Request Body**
```json
{
  "toolId": "subnet-calculator",
  "inputs": {
    "ip": "192.168.1.0",
    "cidr": 24
  }
}
```

**Response (200):** Tool-specific result object.

---

## Analytics

### `GET /api/analytics/dashboard`

**Auth:** Required

Comprehensive dashboard analytics.

**Query Parameters**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `subjectId` | UUID | — | Filter by subject |
| `days` | integer | 30 | Time range in days |

**Response (200)**
```json
{
  "globalStats": {
    "currentStreak": 5,
    "longestStreak": 12,
    "totalStudyTime": 3600,
    "totalQuizzes": 15,
    "totalSessions": 42,
    "achievements": {}
  },
  "timeBySubject": {
    "networks": { "name": "Computer Networks", "code": "CCPD1", "color": "#3B82F6", "totalMinutes": 120 }
  },
  "sessions": [],
  "activityCalendar": []
}
```

### `POST /api/analytics/session`

**Auth:** Required

Track a study session.

**Request Body**
```json
{
  "sessionId": "uuid",
  "subjectId": "uuid",
  "mode": "chat",
  "duration": 1800,
  "messageCount": 12,
  "startedAt": "2026-02-07T10:00:00.000Z",
  "endedAt": "2026-02-07T10:30:00.000Z"
}
```

### `GET /api/analytics/session`

**Auth:** Required

Retrieve study sessions.

**Query Parameters**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `subjectId` | UUID | — | Filter by subject |
| `limit` | integer | 50 | Max results |
| `days` | integer | 30 | Time range |

---

## Webhooks

### `POST /api/webhooks/clerk`

**Auth:** Svix signature verification (not user auth)

Clerk webhook receiver for user synchronisation.

**Required Headers**
| Header | Description |
|--------|-------------|
| `svix-id` | Webhook event ID |
| `svix-timestamp` | Event timestamp |
| `svix-signature` | HMAC signature |

**Handled Events:**
- `user.created` → Creates local User record with Clerk profile data

**Response:** `200` on success, `400` on verification failure.

---

## Error Responses

All endpoints return consistent error shapes:

**401 Unauthorized**
```json
{ "error": "Unauthorized" }
```

**404 Not Found**
```json
{ "error": "User not found" }
```

**400 Bad Request**
```json
{ "error": "Missing required field: subjectId" }
```

**500 Internal Server Error**
```json
{ "error": "Internal server error", "details": "..." }
```
