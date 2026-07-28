/**
 * Smart cached fetch utility for frontend client.
 * Features:
 * 1. In-flight request deduplication (prevents duplicate simultaneous HTTP requests).
 * 2. In-memory response cache with TTL (short-term cache to avoid re-fetching on rapid component mounts).
 */

const cacheMap = new Map()
const inflightRequests = new Map()

const DEFAULT_TTL_MS = 5 * 1000 // 5 seconds

/**
 * Perform a cached & deduplicated GET request
 * @param {string} url - Request URL
 * @param {object} [options] - Fetch options (e.g. headers, ttlMs)
 * @returns {Promise<any>} Response JSON data
 */
export const cachedFetch = async (url, options = {}) => {
  const { ttlMs = DEFAULT_TTL_MS, forceRefresh = false, ...fetchOptions } = options

  // Cache key
  const cacheKey = url

  // Return cached result if fresh and not force-refreshing
  if (!forceRefresh && cacheMap.has(cacheKey)) {
    const cached = cacheMap.get(cacheKey)
    if (Date.now() - cached.timestamp < ttlMs) {
      return cached.data
    }
    cacheMap.delete(cacheKey)
  }

  // Deduplicate inflight requests to same URL
  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey)
  }

  const promise = (async () => {
    try {
      const response = await fetch(url, fetchOptions)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      // Ensure inactive products (isActive === false) are never returned to client storefront components
      if (data && data.success) {
        if (Array.isArray(data.data)) {
          data.data = data.data.filter(item => !item || item.isActive !== false)
        }
        if (Array.isArray(data.products)) {
          data.products = data.products.filter(item => !item || item.isActive !== false)
        }
      }
      
      // Cache successful response
      cacheMap.set(cacheKey, {
        data,
        timestamp: Date.now()
      })

      return data
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
