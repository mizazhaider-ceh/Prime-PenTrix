import { getAuthUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════
// DOCUMENT API - Upload & List Documents
// Security: MIME validation, size limits, sanitized filenames
// ═══════════════════════════════════════════════════════════════

// Security constants
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'documents');

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
};

// Magic bytes for file type verification
const MAGIC_BYTES: Record<string, number[]> = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    0x50, 0x4b, 0x03, 0x04, // PK.. (ZIP format)
  ],
};

/**
 * Sanitize filename to prevent path traversal and injection
 */
function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  let safe = filename
    .replace(/[/\\]/g, '')
    .replace(/\0/g, '')
    .replace(/\.\./g, '')
    .trim();

  // Only allow alphanumeric, hyphens, underscores, dots
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Ensure it has a valid extension
  if (!safe.includes('.')) {
    safe = 'document.bin';
  }

  // Limit length
  if (safe.length > 200) {
    const ext = path.extname(safe);
    safe = safe.slice(0, 196) + ext;
  }

  return safe;
}

/**
 * Generate secure storage filename
 */
function generateStorageFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${hash}${ext}`;
}

/**
 * Validate file content by checking magic bytes
 */
function validateMagicBytes(
  buffer: Buffer,
  mimeType: string
): boolean {
  const expected = MAGIC_BYTES[mimeType];
  if (!expected) return true; // No magic bytes to check for text files

  if (buffer.length < expected.length) return false;

  return expected.every((byte, index) => buffer[index] === byte);
}

// ═══════════════════════════════════════════════════════════════
// GET /api/documents - List user's documents
// ═══════════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');
    const status = searchParams.get('status');

    // Build where clause
    const where: any = { userId: user.id };
    if (subjectId) where.subjectId = subjectId;
    if (status) where.status = status;

    const documents = await prisma.document.findMany({
      where,
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
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/documents - Upload a new document
// ═══════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const subjectId = formData.get('subjectId') as string | null;

    // ── Validate inputs ──────────────────────────────────────

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!subjectId) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    try {
      z.string().uuid().parse(subjectId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid subject ID format' },
        { status: 400 }
      );
    }

    // ── Security: File size check ────────────────────────────

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      );
    }

    // ── Security: MIME type validation ───────────────────────

    const allowedExtensions = ALLOWED_MIME_TYPES[file.type];
    if (!allowedExtensions) {
      return NextResponse.json(
        {
          error: `File type "${file.type}" is not allowed. Allowed: PDF, DOCX, TXT, MD`,
        },
        { status: 400 }
      );
    }

    // ── Security: Extension cross-check ──────────────────────

    const originalName = sanitizeFilename(file.name);
    const ext = path.extname(originalName).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: 'File extension does not match file type' },
        { status: 400 }
      );
    }

    // ── Security: Magic bytes validation ─────────────────────

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: 'File content does not match declared type' },
        { status: 400 }
      );
    }

    // ── Verify subject exists ────────────────────────────────

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // ── Save file to disk ────────────────────────────────────

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const storageFilename = generateStorageFilename(originalName);
    const filePath = path.join(UPLOAD_DIR, storageFilename);

    // Write file securely
    await writeFile(filePath, buffer);

    // ── Create database record ───────────────────────────────

    const document = await prisma.document.create({
      data: {
        filename: storageFilename,
        originalName: originalName,
        mimeType: file.type,
        size: file.size,
        fileUrl: `/uploads/documents/${storageFilename}`,
        status: 'pending',
        userId: user.id,
        subjectId: subjectId,
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

    return NextResponse.json(
      {
        document,
        message: 'Document uploaded successfully. Processing will begin shortly.',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
