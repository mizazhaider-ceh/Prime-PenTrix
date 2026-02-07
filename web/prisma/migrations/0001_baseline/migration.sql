-- Baseline migration: Full schema from Prisma schema.prisma
-- Generated via: prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script
-- This migration represents the initial database state.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'glass',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "gradient" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "teachers" TEXT[],
    "topics" TEXT[],
    "pedagogy" TEXT NOT NULL,
    "toolkit" TEXT[],
    "promptStyle" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'chat',
    "userId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "model" TEXT,
    "contextUsed" TEXT[],
    "conversationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "userId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "content" TEXT NOT NULL,
    "embedding" vector(384),
    "chunkIndex" INTEGER NOT NULL,
    "pageNumber" INTEGER,
    "startChar" INTEGER,
    "endChar" INTEGER,
    "termFrequency" JSONB,
    "documentId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventType" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "userId" UUID NOT NULL,
    "subjectId" UUID,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "duration" INTEGER NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "mode" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_scores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "questionsCount" INTEGER NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "userId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3),
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "userId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "lastReviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "toolId" TEXT NOT NULL,
    "toolCategory" TEXT NOT NULL,
    "inputData" JSONB NOT NULL,
    "outputData" JSONB NOT NULL,
    "userId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_stats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "totalStudyTime" INTEGER NOT NULL DEFAULT 0,
    "totalChats" INTEGER NOT NULL DEFAULT 0,
    "totalQuizzes" INTEGER NOT NULL DEFAULT 0,
    "totalDocuments" INTEGER NOT NULL DEFAULT 0,
    "totalToolUses" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastStudyDate" TIMESTAMP(3),
    "achievements" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_clerkId_idx" ON "users"("clerkId");
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");
CREATE UNIQUE INDEX "subjects_slug_key" ON "subjects"("slug");
CREATE INDEX "subjects_slug_idx" ON "subjects"("slug");
CREATE INDEX "subjects_code_idx" ON "subjects"("code");

-- CreateIndex
CREATE INDEX "conversations_userId_idx" ON "conversations"("userId");
CREATE INDEX "conversations_subjectId_idx" ON "conversations"("subjectId");
CREATE INDEX "conversations_createdAt_idx" ON "conversations"("createdAt");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");
CREATE INDEX "messages_userId_idx" ON "messages"("userId");
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- CreateIndex
CREATE INDEX "documents_userId_idx" ON "documents"("userId");
CREATE INDEX "documents_subjectId_idx" ON "documents"("subjectId");
CREATE INDEX "documents_status_idx" ON "documents"("status");
CREATE INDEX "documents_uploadedAt_idx" ON "documents"("uploadedAt");

-- CreateIndex
CREATE INDEX "document_chunks_documentId_idx" ON "document_chunks"("documentId");
CREATE INDEX "document_chunks_chunkIndex_idx" ON "document_chunks"("chunkIndex");

-- CreateIndex
CREATE INDEX "analytics_userId_idx" ON "analytics"("userId");
CREATE INDEX "analytics_subjectId_idx" ON "analytics"("subjectId");
CREATE INDEX "analytics_eventType_idx" ON "analytics"("eventType");
CREATE INDEX "analytics_timestamp_idx" ON "analytics"("timestamp");

-- CreateIndex
CREATE INDEX "study_sessions_userId_idx" ON "study_sessions"("userId");
CREATE INDEX "study_sessions_subjectId_idx" ON "study_sessions"("subjectId");
CREATE INDEX "study_sessions_startedAt_idx" ON "study_sessions"("startedAt");

-- CreateIndex
CREATE INDEX "quiz_scores_userId_idx" ON "quiz_scores"("userId");
CREATE INDEX "quiz_scores_subjectId_idx" ON "quiz_scores"("subjectId");
CREATE INDEX "quiz_scores_topic_idx" ON "quiz_scores"("topic");
CREATE INDEX "quiz_scores_completedAt_idx" ON "quiz_scores"("completedAt");

-- CreateIndex
CREATE INDEX "quiz_reviews_userId_idx" ON "quiz_reviews"("userId");
CREATE INDEX "quiz_reviews_subjectId_idx" ON "quiz_reviews"("subjectId");
CREATE INDEX "quiz_reviews_nextReviewAt_idx" ON "quiz_reviews"("nextReviewAt");
CREATE INDEX "quiz_reviews_isCorrect_idx" ON "quiz_reviews"("isCorrect");

-- CreateIndex
CREATE INDEX "tool_history_userId_idx" ON "tool_history"("userId");
CREATE INDEX "tool_history_subjectId_idx" ON "tool_history"("subjectId");
CREATE INDEX "tool_history_toolId_idx" ON "tool_history"("toolId");
CREATE INDEX "tool_history_usedAt_idx" ON "tool_history"("usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "global_stats_userId_key" ON "global_stats"("userId");
CREATE INDEX "global_stats_userId_idx" ON "global_stats"("userId");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "analytics" ADD CONSTRAINT "analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quiz_scores" ADD CONSTRAINT "quiz_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_scores" ADD CONSTRAINT "quiz_scores_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quiz_reviews" ADD CONSTRAINT "quiz_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_reviews" ADD CONSTRAINT "quiz_reviews_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tool_history" ADD CONSTRAINT "tool_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tool_history" ADD CONSTRAINT "tool_history_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "global_stats" ADD CONSTRAINT "global_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
