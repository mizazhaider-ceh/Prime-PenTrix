// API Rate Limiting Middleware for Next.js

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

const rateLimitStore = new Map<string, number[]>();

/**
 * Rate limiting middleware for API routes
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  const { windowMs, maxRequests } = config;

  return async (req: NextRequest): Promise<NextResponse | null> => {
    // Extract client identifier (IP address or user ID)
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
    const key = `rate_limit:${ip}`;

    const now = Date.now();
    const requests = rateLimitStore.get(key) || [];

    // Filter out old requests outside the time window
    const recentRequests = requests.filter(time => now - time < windowMs);

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(windowMs / 1000), // seconds
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(windowMs / 1000)),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil((now + windowMs) / 1000)),
          },
        }
      );
    }

    // Add current request timestamp
    recentRequests.push(now);
    rateLimitStore.set(key, recentRequests);

    // Add rate limit headers to response
    const remaining = maxRequests - recentRequests.length;
    const resetTime = Math.ceil((now + windowMs) / 1000);

    // Create response with rate limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(resetTime));

    return response;
  };
}

/**
 * Clean up old entries from rate limit store
 * Call this periodically to prevent memory leaks
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  const maxAge = 3600000; // 1 hour

  for (const [key, requests] of rateLimitStore.entries()) {
    const validRequests = requests.filter(time => now - time < maxAge);
    
    if (validRequests.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, validRequests);
    }
  }
}

// Cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  // Strict: 10 requests per minute
  strict: { windowMs: 60000, maxRequests: 10 },
  
  // Standard: 30 requests per minute
  standard: { windowMs: 60000, maxRequests: 30 },
  
  // Relaxed: 100 requests per minute
  relaxed: { windowMs: 60000, maxRequests: 100 },
  
  // AI Generation: 5 requests per minute (expensive operations)
  aiGeneration: { windowMs: 60000, maxRequests: 5 },
  
  // File Upload: 3 uploads per 5 minutes
  fileUpload: { windowMs: 5 * 60000, maxRequests: 3 },
};
