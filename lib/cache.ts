/**
 * Simple in-memory cache with TTL support
 * Improves performance by caching expensive operations
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Run cleanup every 5 minutes
    if (typeof window === 'undefined') {
      // Server-side only
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000)
    }
  }

  /**
   * Get value from cache if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) return null

    const now = Date.now()
    const age = now - entry.timestamp

    if (age > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set value in cache with TTL (time to live) in milliseconds
   */
  set<T>(key: string, data: T, ttl: number = 10 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Check if key exists in cache and hasn't expired
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    this.cache.forEach((entry, key) => {
      const age = now - entry.timestamp
      if (age > entry.ttl) {
        expiredKeys.push(key)
      }
    })

    expiredKeys.forEach(key => this.cache.delete(key))
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Export singleton instance
export const cache = new MemoryCache()

/**
 * Debounce utility for rate-limiting function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}

/**
 * Throttle utility for limiting function execution rate
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Memoize expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const memoCache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)

    if (memoCache.has(key)) {
      return memoCache.get(key)!
    }

    const result = func(...args)
    memoCache.set(key, result)
    return result
  }) as T
}
