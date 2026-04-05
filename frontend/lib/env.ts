/**
 * Environment variables configuration
 * 
 * NEXT_PUBLIC_API_URL: Backend API URL with /api/v1 prefix
 *   - Development: http://localhost:3000/api/v1
 *   - Production: Set via environment variable
 * 
 * NEXT_PUBLIC_APP_URL: Frontend application URL
 *   - Development: http://localhost:3000
 *   - Production: Set via environment variable
 */

export const env = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

// Validate required environment variables
if (!env.NEXT_PUBLIC_API_URL) {
    console.warn('Warning: NEXT_PUBLIC_API_URL is not set, using default: http://localhost:5000/api/v1');
}

export type Env = typeof env;

