/**
 * JWT Configuration Helper
 * Retrieves JWT secret keys strictly from environment variables.
 * Throws an explicit error if JWT_SECRET is missing to prevent insecure fallbacks.
 */

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret || !secret.trim()) {
    throw new Error('FATAL: JWT_SECRET environment variable is missing. Set JWT_SECRET in your .env file.')
  }
  return secret
}

export const getJwtRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
  if (!secret || !secret.trim()) {
    throw new Error('FATAL: Neither JWT_REFRESH_SECRET nor JWT_SECRET environment variable is set.')
  }
  return secret
}
