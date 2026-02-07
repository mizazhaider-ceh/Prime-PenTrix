// Environment validation to ensure all required secrets are present

/**
 * Required environment variables for production
 */
const requiredEnvVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'DATABASE_URL',
  'CEREBRAS_API_KEY',
  'GEMINI_API_KEY',
] as const;

/**
 * Optional environment variables with defaults
 */
const optionalEnvVars = [
  'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
  'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
  'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL',
  'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL',
] as const;

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validate that all required environment variables are set
 */
export function validateEnvironment(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check optional variables
  for (const varName of optionalEnvVars) {
    if (!process.env[varName]) {
      warnings.push(`Optional variable ${varName} is not set (using default)`);
    }
  }

  // Check for insecure values in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.DATABASE_URL?.includes('localhost')) {
      warnings.push('DATABASE_URL contains localhost in production environment');
    }

    if (process.env.CEREBRAS_API_KEY === 'test' || process.env.CEREBRAS_API_KEY === 'demo') {
      warnings.push('CEREBRAS_API_KEY appears to be a test/demo key');
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Sanitize environment variable for logging (hide sensitive parts)
 */
export function sanitizeEnvVar(varName: string, value: string): string {
  // Don't log keys at all
  if (varName.includes('KEY') || varName.includes('SECRET') || varName.includes('PASSWORD')) {
    return '***REDACTED***';
  }

  // For URLs, show protocol and host but hide credentials
  if (varName.includes('URL')) {
    try {
      const url = new URL(value);
      return `${url.protocol}//${url.host}`;
    } catch {
      return '***INVALID_URL***';
    }
  }

  // For other values, show first and last 4 characters
  if (value.length > 8) {
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
  }

  return '***HIDDEN***';
}

/**
 * Log environment validation results (safely)
 */
export function logEnvironmentStatus(): void {
  const result = validateEnvironment();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔒 Environment Validation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Status: ${result.valid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  if (result.missing.length > 0) {
    console.log('\n❌ Missing Required Variables:');
    result.missing.forEach(varName => {
      console.log(`   - ${varName}`);
    });
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
  }

  // Log non-sensitive configuration
  console.log('\n📋 Configuration:');
  for (const varName of [...requiredEnvVars, ...optionalEnvVars]) {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName}: ${sanitizeEnvVar(varName, value)}`);
    } else {
      console.log(`   ❌ ${varName}: Not set`);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Exit if validation failed in production
  if (!result.valid && process.env.NODE_ENV === 'production') {
    console.error('❌ Cannot start application with missing environment variables in production');
    process.exit(1);
  }
}

/**
 * Get environment variable with validation
 */
export function getEnvVariable(name: string, required: boolean = true): string {
  const value = process.env[name];

  if (!value && required) {
    throw new Error(`Required environment variable ${name} is not set`);
  }

  return value || '';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}

/**
 * Check if running in test environment
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}
