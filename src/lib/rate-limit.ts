import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from './redis'

/**
 * Rate limiting middleware
 * Usage: Add to API routes that need rate limiting
 */
export async function withRateLimit(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    maxRequests?: number
    windowSeconds?: number
    identifier?: string
  } = {}
): Promise<NextResponse> {
  const {
    maxRequests = 100, // Default: 100 requests
    windowSeconds = 60, // Default: per 60 seconds (1 minute)
    identifier,
  } = options

  // Get identifier (IP address or custom)
  const id = identifier || 
    request.headers.get('x-forwarded-for') || 
    request.headers.get('x-real-ip') || 
    'unknown'

  // Check rate limit
  const { allowed, remaining, resetAt } = await checkRateLimit(
    id,
    maxRequests,
    windowSeconds
  )

  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again after ${resetAt.toISOString()}`,
        resetAt: resetAt.toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetAt.toISOString(),
          'Retry-After': Math.ceil((resetAt.getTime() - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  // Execute handler
  const response = await handler(request)

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', resetAt.toISOString())

  return response
}

/**
 * Specific rate limits for different endpoints
 */
export const rateLimitPresets = {
  // Strict: For expensive operations (OpenAI calls)
  strict: {
    maxRequests: 10,
    windowSeconds: 60, // 10 requests per minute
  },
  
  // Normal: For regular API calls
  normal: {
    maxRequests: 100,
    windowSeconds: 60, // 100 requests per minute
  },
  
  // Chat: Specific for chat messages
  chat: {
    maxRequests: 20,
    windowSeconds: 60, // 20 messages per minute
  },
  
  // WhatsApp: Prevent spam
  whatsapp: {
    maxRequests: 30,
    windowSeconds: 60, // 30 messages per minute
  },
}
