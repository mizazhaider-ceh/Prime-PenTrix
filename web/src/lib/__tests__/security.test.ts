import {
  sanitizeInput,
  isValidEmail,
  isValidURL,
  RateLimiter,
  validateFileUpload,
  SecureStorage,
  constantTimeCompare,
  generateSecureToken,
  sanitizeMarkdown,
  CSRFProtection,
} from '../security';

describe('Security Utilities', () => {
  describe('sanitizeInput', () => {
    it('should sanitize HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should sanitize quotes and ampersands', () => {
      const input = "O'Reilly & Sons";
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('O&#x27;Reilly &amp; Sons');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid.email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('isValidURL', () => {
    it('should validate safe URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://example.com/path')).toBe(true);
    });

    it('should reject dangerous URLs', () => {
      expect(isValidURL('javascript:alert("XSS")')).toBe(false);
      expect(isValidURL('data:text/html,<script>alert("XSS")</script>')).toBe(false);
      expect(isValidURL('vbscript:alert("XSS")')).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(isValidURL('not-a-url')).toBe(false);
      expect(isValidURL('')).toBe(false);
    });
  });

  describe('RateLimiter', () => {
    it('should allow requests within limit', () => {
      const limiter = new RateLimiter(5, 1000); // 5 requests per second
      const key = 'test-user';

      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      const limiter = new RateLimiter(2, 1000); // 2 requests per second
      const key = 'test-user';

      limiter.isAllowed(key);
      limiter.isAllowed(key);
      expect(limiter.isAllowed(key)).toBe(false); // 3rd request blocked
    });

    it('should reset rate limit', () => {
      const limiter = new RateLimiter(2, 1000);
      const key = 'test-user';

      limiter.isAllowed(key);
      limiter.isAllowed(key);
      limiter.reset(key);

      expect(limiter.isAllowed(key)).toBe(true);
    });
  });

  describe('validateFileUpload', () => {
    it('should accept valid PDF files', () => {
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(true);
    });

    it('should reject files exceeding size limit', () => {
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join(''); // 11MB
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('size exceeds');
    });

    it('should reject invalid file types', () => {
      const file = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject invalid file extensions', () => {
      const file = new File(['content'], 'script.exe', { type: 'application/pdf' });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file extension');
    });
  });

  describe('SecureStorage', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should store and retrieve data', () => {
      const data = { name: 'Test User', age: 30 };
      SecureStorage.setItem('user', data);
      const retrieved = SecureStorage.getItem<typeof data>('user');
      expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent keys', () => {
      const result = SecureStorage.getItem('non-existent');
      expect(result).toBeNull();
    });

    it('should remove items', () => {
      SecureStorage.setItem('test', 'value');
      SecureStorage.removeItem('test');
      expect(SecureStorage.getItem('test')).toBeNull();
    });

    it('should clear all items', () => {
      SecureStorage.setItem('key1', 'value1');
      SecureStorage.setItem('key2', 'value2');
      SecureStorage.clear();
      expect(SecureStorage.getItem('key1')).toBeNull();
      expect(SecureStorage.getItem('key2')).toBeNull();
    });
  });

  describe('constantTimeCompare', () => {
    it('should return true for identical strings', () => {
      expect(constantTimeCompare('secret', 'secret')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(constantTimeCompare('secret', 'Secret')).toBe(false);
      expect(constantTimeCompare('abc', 'def')).toBe(false);
    });

    it('should return false for strings of different lengths', () => {
      expect(constantTimeCompare('short', 'longer string')).toBe(false);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate tokens of correct length', () => {
      const token = generateSecureToken(32);
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
    });

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with only hex characters', () => {
      const token = generateSecureToken();
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });
  });

  describe('sanitizeMarkdown', () => {
    it('should remove script tags', () => {
      const input = 'Hello <script>alert("XSS")</script> World';
      const sanitized = sanitizeMarkdown(input);
      expect(sanitized).not.toContain('<script>');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(\'XSS\')">Click me</div>';
      const sanitized = sanitizeMarkdown(input);
      expect(sanitized).not.toContain('onclick=');
    });

    it('should remove javascript: links', () => {
      const input = '[Click](javascript:alert("XSS"))';
      const sanitized = sanitizeMarkdown(input);
      expect(sanitized.toLowerCase()).not.toContain('javascript:');
    });

    it('should preserve safe markdown', () => {
      const input = '# Heading\n\n**Bold** and *italic*';
      const sanitized = sanitizeMarkdown(input);
      expect(sanitized).toBe(input);
    });
  });

  describe('CSRFProtection', () => {
    beforeEach(() => {
      localStorage.clear();
      CSRFProtection.clearToken();
    });

    it('should generate and store tokens', () => {
      const token = CSRFProtection.generateToken();
      expect(token).toBeTruthy();
      expect(token.length).toBeGreaterThan(0);
    });

    it('should retrieve stored tokens', () => {
      const token = CSRFProtection.generateToken();
      const retrieved = CSRFProtection.getToken();
      expect(retrieved).toBe(token);
    });

    it('should validate correct tokens', () => {
      const token = CSRFProtection.generateToken();
      expect(CSRFProtection.validateToken(token)).toBe(true);
    });

    it('should reject invalid tokens', () => {
      CSRFProtection.generateToken();
      expect(CSRFProtection.validateToken('invalid-token')).toBe(false);
    });

    it('should clear tokens', () => {
      CSRFProtection.generateToken();
      CSRFProtection.clearToken();
      expect(CSRFProtection.getToken()).toBeNull();
    });
  });
});
