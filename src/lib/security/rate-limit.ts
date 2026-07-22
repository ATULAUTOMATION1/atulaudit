// =============================================================================
// Rate Limiting Abstraction
// =============================================================================
// In-memory rate limiter for development and MVP.
// TODO: Replace with Redis/Upstash for production multi-instance deployment.
// =============================================================================

import { RATE_LIMIT } from "@/lib/constants";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store — resets on cold start (serverless function restart)
const store = new Map<string, RateLimitEntry>();

/**
 * Check if a request should be rate-limited.
 *
 * @param identifier - Typically the client IP address
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with limited (boolean) and remaining count
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = RATE_LIMIT.maxRequests,
  windowMs: number = RATE_LIMIT.windowMs
): { limited: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(identifier);

  // Clean up expired entries periodically
  if (store.size > 10000) {
    // TODO: Use a proper TTL map or Redis for production
    for (const [key, val] of store.entries()) {
      if (val.resetAt < now) store.delete(key);
    }
  }

  if (!entry || entry.resetAt < now) {
    // New window
    const resetAt = now + windowMs;
    store.set(identifier, { count: 1, resetAt });
    return { limited: false, remaining: maxRequests - 1, resetAt };
  }

  // Existing window
  entry.count += 1;

  if (entry.count > maxRequests) {
    return { limited: true, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    limited: false,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get the client IP from request headers.
 * Works with Vercel (x-forwarded-for) and standard proxies.
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Fallback for development
  return "127.0.0.1";
}
