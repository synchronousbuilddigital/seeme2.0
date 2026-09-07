/**
 * Smart cached fetch utility for frontend client.
 * Features:
 * 1. In-flight request deduplication (prevents duplicate simultaneous HTTP requests).
 * 2. In-memory response cache with TTL (short-term cache to avoid re-fetching on rapid component mounts).
 */

const cacheMap = new Map()
const inflightRequests = new Map()

const DEFAULT_TTL_MS = 60 * 1000 // 60 seconds TTL

/**
 * Perform a cached & deduplicated GET request
 * @param {string} url - Request URL
 * @param {object} [options] - Fetch options (e.g. headers, ttlMs)
 * @returns {Promise<any>} Response JSON data
 */
export const cachedFetch = async (url, options = {}) => {
  const { ttlMs = DEFAULT_TTL_MS, forceRefresh = false, ...fetchOptions } = options

  const cacheKey = url

  // 1. Return in-memory cached result if fresh
  if (!forceRefresh && cacheMap.has(cacheKey)) {
    const cached = cacheMap.get(cacheKey)
    if (Date.now() - cached.timestamp < ttlMs) {
      return cached.data
    }
    cacheMap.delete(cacheKey)
  }

  // 2. Return inflight request if already running
  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey)
  }

  // 3. Check localStorage persistent cache fallback
  const lsKey = `seemee_cache_${cacheKey.replace(/[^a-z0-9]/gi, '_')}`
  if (!forceRefresh && typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(lsKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && parsed.data && (Date.now() - parsed.timestamp < ttlMs * 2)) {
          // Pre-populate memory cache
          cacheMap.set(cacheKey, { data: parsed.data, timestamp: parsed.timestamp })
          // Still fetch in background if older than ttlMs
          if (Date.now() - parsed.timestamp < ttlMs) {
            return parsed.data
          }
        }
      }
    } catch (e) { }
  }

  const promise = (async () => {
    try {
      const response = await fetch(url, fetchOptions)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      // Ensure inactive products and null items are filtered out
      if (data && data.success) {
        if (Array.isArray(data.data)) {
          data.data = data.data.filter(item => item && item.isActive !== false)
        }
        if (Array.isArray(data.products)) {
          data.products = data.products.filter(item => item && item.isActive !== false)
        }
      }

      // Save to memory cache
      cacheMap.set(cacheKey, {
        data,
        timestamp: Date.now()
      })

      // Save to localStorage persistent cache
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem(lsKey, JSON.stringify({
            data,
            timestamp: Date.now()
          }))
        } catch (e) { }
      }

      return data
    } catch (error) {
      // If network fails, return localStorage cached data if available
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const stored = localStorage.getItem(lsKey)
          if (stored) {
            const parsed = JSON.parse(stored)
            if (parsed && parsed.data) return parsed.data
          }
        } catch (e) { }
      }
      throw error
    } finally {
      inflightRequests.delete(cacheKey)
    }
  })()

  inflightRequests.set(cacheKey, promise)
  return promise
}

/**
 * Clear cache for specific URL or all cached URLs
 * @param {string} [url] 
 */
export const clearApiCache = (url) => {
  if (url) {
    cacheMap.delete(url)
    inflightRequests.delete(url)
  } else {
    cacheMap.clear()
    inflightRequests.clear()
  }
}
