import { getAuthUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════
// DOCUMENT [ID] API - Get, Update, Delete individual documents
// ═══════════════════════════════════════════════════════════════

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'documents');
const BRAIN_API_URL = process.env.BRAIN_API_URL || 'http://localhost:8000';

const patchSchema = z.object({
  action: z.enum(['process', 'retry']).optional(),
});

// ═══════════════════════════════════════════════════════════════
// GET /api/documents/[id] - Get document details with chunks
// ═══════════════════════════════════════════════════════════════

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
        chunks: {
          select: {
            id: true,
            chunkIndex: true,
            pageNumber: true,
            content: true,
            startChar: true,
            endChar: true,
            createdAt: true,
          },
          orderBy: {
            chunkIndex: 'asc',
          },
        },
        _count: {
          select: {
            chunks: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PATCH /api/documents/[id] - Trigger processing or retry
// ═══════════════════════════════════════════════════════════════

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = patchSchema.parse(body);

    // Verify ownership
    const document = await prisma.document.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // ── Process action: Send to Brain for processing ─────────

    if (action === 'process' || action === 'retry') {
      // Only allow processing pending/failed documents
      if (document.status === 'processing') {
        return NextResponse.json(
          { error: 'Document is already being processed' },
          { status: 409 }
        );
      }

      if (document.status === 'completed' && action !== 'retry') {
        return NextResponse.json(
          { error: 'Document has already been processed' },
          { status: 409 }
        );
      }

      // If retrying, delete existing chunks first
      if (action === 'retry') {
        await prisma.documentChunk.deleteMany({
          where: { documentId: id },
        });
      }

      // Update status to processing
      const updatedDoc = await prisma.document.update({
        where: { id },
        data: {
          status: 'processing',
          errorMessage: null,
          processedAt: null,
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
              icon: true,
            },
          },
          _count: {
            select: {
              chunks: true,
            },
          },
        },
      });

      // Read file content and send to Brain API (async, non-blocking)
      const filePath = path.join(UPLOAD_DIR, document.filename);

      if (!existsSync(filePath)) {
        await prisma.document.update({
          where: { id },
          data: {
            status: 'failed',
            errorMessage: 'Source file not found on server',
          },
        });
        return NextResponse.json(
          { error: 'Source file not found' },
          { status: 404 }
        );
      }

      // Fire-and-forget: Send to Brain for processing
      // First check if Brain API is reachable, then trigger
      triggerBrainProcessing(document.id, filePath, document.mimeType, document.subjectId)
        .catch((error) => {
          console.error('[Brain] Processing trigger failed:', error.message);
          // Determine user-friendly error message
          const isConnectionError = error.message?.includes('ECONNREFUSED') ||
            error.message?.includes('fetch failed') ||
            error.message?.includes('aborted') ||
            error.message?.includes('ETIMEDOUT');

          const errorMessage = isConnectionError
            ? 'Brain API is not running. Start the Python backend server to process documents.'
            : `Processing failed: ${error.message}`;

          prisma.document.update({
            where: { id },
            data: {
              status: 'failed',
              errorMessage,
            },
          }).catch(console.error);
        });

      return NextResponse.json({ document: updatedDoc });
    }

    return NextResponse.json(
      { error: 'No valid action specified' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /api/documents/[id] - Delete document and its chunks
// ═══════════════════════════════════════════════════════════════

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const document = await prisma.document.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete file from disk
    const filePath = path.join(UPLOAD_DIR, document.filename);
    if (existsSync(filePath)) {
      try {
        await unlink(filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
        // Continue with DB deletion even if file removal fails
      }
    }

    // Delete embeddings/chunks from Brain API (BM25 index + vector cleanup)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Brain API delete warning:', await response.text());
        // Continue with DB deletion even if Brain API fails
      } else {
        const result = await response.json();
        console.log(`✅ Brain API: Deleted ${result.deleted_chunks} chunks for document ${id}`);
      }
    } catch (error) {
      console.error('Error calling Brain API delete:', error);
      // Continue with DB deletion even if Brain API is down
    }

    // Delete from database (cascade deletes chunks automatically)
    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Trigger Brain API for document processing
// ═══════════════════════════════════════════════════════════════

async function triggerBrainProcessing(
  documentId: string,
  filePath: string,
  mimeType: string,
  subjectId: string
): Promise<void> {
  // 1. Health check — fail fast if Brain is offline (2s timeout)
  try {
    const healthCheck = await fetch(`${BRAIN_API_URL}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!healthCheck.ok) {
      throw new Error('Brain API health check returned non-OK status');
    }
  } catch {
    throw new Error(
      'ECONNREFUSED: Brain API is not reachable at ' + BRAIN_API_URL
    );
  }

  // 2. Read file and send for processing (30s timeout)
  const { readFile } = await import('fs/promises');
  const fileBuffer = await readFile(filePath);
  const base64Content = fileBuffer.toString('base64');

  const response = await fetch(`${BRAIN_API_URL}/documents/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: documentId,
      content: base64Content,
      filename: path.basename(filePath),
      mime_type: mimeType,
      subject_id: subjectId,
      encoding: 'base64',
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Brain API error: ${response.status} - ${errorText}`);
  }
}
