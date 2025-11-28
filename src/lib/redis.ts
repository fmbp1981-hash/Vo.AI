import { Redis } from 'ioredis'

// Redis client configuration
let redis: Redis | null = null

/**
 * Get Redis client instance (singleton)
 */
export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY'
        if (err.message.includes(targetError)) {
          return true
        }
        return false
      },
    })

    redis.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully')
    })

    redis.on('ready', () => {
      console.log('✅ Redis client ready')
    })
  }

  return redis
}

/**
 * Cache helper functions
 */
export const cache = {
  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = getRedisClient()
      const value = await client.get(key)
      
      if (!value) return null
      
      return JSON.parse(value) as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  },

  /**
   * Set cached value with optional TTL (seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const client = getRedisClient()
      const serialized = JSON.stringify(value)
      
      if (ttl) {
        await client.setex(key, ttl, serialized)
      } else {
        await client.set(key, serialized)
      }
      
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  },

  /**
   * Delete cached value
   */
  async del(key: string): Promise<boolean> {
    try {
      const client = getRedisClient()
      await client.del(key)
      return true
    } catch (error) {
      console.error('Cache del error:', error)
      return false
    }
  },

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      const client = getRedisClient()
      const keys = await client.keys(pattern)
      
      if (keys.length === 0) return 0
      
      await client.del(...keys)
      return keys.length
    } catch (error) {
      console.error('Cache delPattern error:', error)
      return 0
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const client = getRedisClient()
      const result = await client.exists(key)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  },

  /**
   * Set expiration on key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const client = getRedisClient()
      await client.expire(key, seconds)
      return true
    } catch (error) {
      console.error('Cache expire error:', error)
      return false
    }
  },

  /**
   * Increment value
   */
  async incr(key: string): Promise<number> {
    try {
      const client = getRedisClient()
      return await client.incr(key)
    } catch (error) {
      console.error('Cache incr error:', error)
      return 0
    }
  },

  /**
   * Get TTL of key
   */
  async ttl(key: string): Promise<number> {
    try {
      const client = getRedisClient()
      return await client.ttl(key)
    } catch (error) {
      console.error('Cache ttl error:', error)
      return -1
    }
  },
}

/**
 * Rate limiting helper
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const key = `ratelimit:${identifier}`
  const client = getRedisClient()

  try {
    const current = await client.incr(key)
    
    if (current === 1) {
      await client.expire(key, windowSeconds)
    }

    const ttl = await client.ttl(key)
    const resetAt = new Date(Date.now() + ttl * 1000)
    
    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetAt,
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // Fail open - allow request if Redis is down
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: new Date(Date.now() + windowSeconds * 1000),
    }
  }
}

/**
 * Session storage helper
 */
export const session = {
  /**
   * Store session data
   */
  async set(sessionId: string, data: any, ttl: number = 3600): Promise<boolean> {
    return cache.set(`session:${sessionId}`, data, ttl)
  },

  /**
   * Get session data
   */
  async get<T>(sessionId: string): Promise<T | null> {
    return cache.get<T>(`session:${sessionId}`)
  },

  /**
   * Delete session
   */
  async del(sessionId: string): Promise<boolean> {
    return cache.del(`session:${sessionId}`)
  },

  /**
   * Extend session TTL
   */
  async extend(sessionId: string, ttl: number = 3600): Promise<boolean> {
    return cache.expire(`session:${sessionId}`, ttl)
  },
}

/**
 * Cache keys helpers
 */
export const cacheKeys = {
  lead: (id: string) => `lead:${id}`,
  leads: (filter?: string) => `leads:${filter || 'all'}`,
  conversation: (id: string) => `conversation:${id}`,
  conversations: (leadId: string) => `conversations:lead:${leadId}`,
  aiResponse: (hash: string) => `ai:response:${hash}`,
  itinerary: (id: string) => `itinerary:${id}`,
  proposal: (id: string) => `proposal:${id}`,
  user: (id: string) => `user:${id}`,
}

/**
 * Disconnect Redis (for graceful shutdown)
 */
export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
    console.log('✅ Redis disconnected')
  }
}

// Export Redis client for advanced usage
export { redis }
