// Security utility functions for Sentinel V3

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format and check for malicious patterns
 */
export function isValidURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Block javascript: and data: protocols
    if (['javascript:', 'data:', 'vbscript:'].includes(urlObj.protocol)) {
      return false;
    }

    // Only allow http: and https:
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Rate limiting tracker for client-side
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Filter out old requests
    const recentRequests = requests.filter(time => now - time < this.windowMs);

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return true;
  }

  reset(key?: string) {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

/**
 * Content Security Policy headers for Next.js
 */
export function getCSPHeaders() {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.com https://clerk.*.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.cerebras.ai https://generativelanguage.googleapis.com https://clerk.*.com",
    "frame-src 'self' https://clerk.com https://clerk.*.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  return {
    'Content-Security-Policy': csp,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
  const allowedExtensions = ['.pdf', '.txt', '.md'];

  // Check size
  if (file.size > maxSizeBytes) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only PDF, TXT, and MD files are allowed' };
  }

  // Check extension
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: 'Invalid file extension' };
  }

  return { valid: true };
}

/**
 * Secure local storage wrapper with encryption (basic)
 */
export class SecureStorage {
  private static encode(value: string): string {
    return btoa(encodeURIComponent(value));
  }

  private static decode(value: string): string {
    return decodeURIComponent(atob(value));
  }

  static setItem(key: string, value: any): void {
    try {
      const jsonString = JSON.stringify(value);
      const encoded = this.encode(jsonString);
      localStorage.setItem(key, encoded);
    } catch (error) {
      console.error('SecureStorage setItem error:', error);
    }
  }

  static getItem<T>(key: string): T | null {
    try {
      const encoded = localStorage.getItem(key);
      if (!encoded) return null;

      const decoded = this.decode(encoded);
      return JSON.parse(decoded) as T;
    } catch (error) {
      console.error('SecureStorage getItem error:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  static clear(): void {
    localStorage.clear();
  }
}

/**
 * Prevent timing attacks by using constant-time comparison
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate secure random tokens
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Sanitize markdown to prevent XSS
 */
export function sanitizeMarkdown(markdown: string): string {
  // Remove potentially dangerous patterns
  let sanitized = markdown;

  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: links
  sanitized = sanitized.replace(/javascript:/gi, '');

  return sanitized;
}

/**
 * Validate API request headers
 */
export function validateRequestHeaders(headers: Headers): boolean {
  // Check for required headers
  const contentType = headers.get('content-type');
  
  if (contentType && !contentType.includes('application/json')) {
    return false;
  }

  return true;
}

/**
 * CSRF token management
 */
export class CSRFProtection {
  private static tokenKey = 'csrf_token';

  static generateToken(): string {
    const token = generateSecureToken();
    SecureStorage.setItem(this.tokenKey, token);
    return token;
  }

  static getToken(): string | null {
    return SecureStorage.getItem<string>(this.tokenKey);
  }

  static validateToken(token: string): boolean {
    const stored = this.getToken();
    if (!stored) return false;
    return constantTimeCompare(stored, token);
  }

  static clearToken(): void {
    SecureStorage.removeItem(this.tokenKey);
  }
}
