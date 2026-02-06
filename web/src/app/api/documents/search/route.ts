import { getAuthUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// DOCUMENT SEARCH API - Hybrid search via Brain API
// Combines semantic search (pgvector) + BM25 + cross-encoder reranking
// ═══════════════════════════════════════════════════════════════

const BRAIN_API_URL = process.env.BRAIN_API_URL || 'http://localhost:8000';

const searchSchema = z.object({
  query: z.string().min(1).max(1000),
  subjectId: z.string().uuid(),
  topK: z.number().int().min(1).max(20).default(5),
  searchType: z.enum(['semantic', 'bm25', 'hybrid']).default('hybrid'),
  minSimilarity: z.number().min(0).max(1).default(0.5),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = searchSchema.parse(body);

    // Call Brain API for hybrid search
    const brainResponse = await fetch(`${BRAIN_API_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: validatedData.query,
        subject_id: validatedData.subjectId,
        user_id: user.id,
        top_k: validatedData.topK,
        search_type: validatedData.searchType,
        min_similarity: validatedData.minSimilarity,
      }),
    });

    if (!brainResponse.ok) {
      const errorText = await brainResponse.text();
      console.error('Brain search error:', errorText);
      return NextResponse.json(
        { error: 'Search service unavailable' },
        { status: 502 }
      );
    }

    const searchData = await brainResponse.json();

    return NextResponse.json({
      results: searchData.results || [],
      query: validatedData.query,
      searchType: validatedData.searchType,
      totalResults: searchData.total || 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error searching documents:', error);
    return NextResponse.json(
      { error: 'Failed to search documents' },
      { status: 500 }
    );
  }
}
