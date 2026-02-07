/**
 * Brain API Client - Centralized API calls with authentication
 * 
 * SECURITY: All Brain API calls must include the BRAIN_API_KEY.
 * This utility ensures consistent authentication across all API routes.
 */

const BRAIN_API_URL = process.env.NEXT_PUBLIC_BRAIN_API_URL || process.env.BRAIN_API_URL || 'http://localhost:8000';
const BRAIN_API_KEY = process.env.BRAIN_API_KEY || '';

if (!BRAIN_API_KEY && process.env.NODE_ENV === 'production') {
  console.error('🚨 BRAIN_API_KEY is not set! Brain API calls will fail.');
}

/**
 * Get request headers with authentication
 */
function getBrainHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (BRAIN_API_KEY) {
    headers['Authorization'] = `Bearer ${BRAIN_API_KEY}`;
  }

  return headers;
}

/**
 * Make an authenticated request to the Brain API
 */
export async function fetchBrain(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${BRAIN_API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getBrainHeaders(),
      ...options.headers,
    },
  });

  return response;
}

/**
 * Health check (no auth required)
 */
export async function checkBrainHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BRAIN_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    console.error('Brain API health check failed:', error);
    return false;
  }
}

/**
 * Search documents
 */
export async function searchDocuments(request: {
  query: string;
  subject_id: string;
  user_id: string;
  top_k?: number;
  search_type?: string;
}) {
  const response = await fetchBrain('/search', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Brain API search failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Process document
 */
export async function processDocument(request: {
  document_id: string;
  content: string;
  filename: string;
  mime_type: string;
  subject_id: string;
  encoding?: string;
}) {
  const response = await fetchBrain('/documents/process', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Brain API document processing failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Query with RAG
 */
export async function queryRAG(request: {
  query: string;
  subject_id: string;
  user_id: string;
  conversation_id?: string;
  mode?: string;
  top_k?: number;
  search_type?: string;
}) {
  const response = await fetchBrain('/query', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Brain API query failed: ${response.statusText}`);
  }

  return response.json();
}

export { BRAIN_API_URL };
