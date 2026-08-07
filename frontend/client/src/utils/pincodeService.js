/**
 * Indian Postal PIN Code Lookup Service
 * Uses official India Post API: GET https://api.postalpincode.in/pincode/{PINCODE}
 * 
 * Features:
 * - 6-digit numeric validation
 * - In-memory cache for fast repeat lookups
 * - Cancellation of stale requests via AbortController
 * - Robust error handling (offline, invalid JSON, 404, not found)
 */

const pincodeCache = new Map()
let currentAbortController = null

/**
 * Fetch city and state details for a 6-digit Indian PIN Code.
 * 
 * @param {string} pincode - 6-digit numeric PIN Code string
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{ success: boolean, city?: string, state?: string, error?: string, aborted?: boolean }>}
 */
export const fetchPincodeDetails = async (pincode, options = {}) => {
  const cleanPin = String(pincode || '').trim()

  // 1. Validate 6 numeric digits
  if (!cleanPin || cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
    return {
      success: false,
      error: 'Please enter a valid 6-digit numeric PIN code.'
    }
  }

  // 2. Check in-memory cache
  if (pincodeCache.has(cleanPin)) {
    return pincodeCache.get(cleanPin)
  }

  // 3. Cancel any in-flight request
  if (currentAbortController) {
    currentAbortController.abort()
  }

  currentAbortController = new AbortController()
  const signal = options.signal || currentAbortController.signal

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal,
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`)
    }

    const data = await response.json()

    // Response structure: [{ Status: "Success", PostOffice: [{ District: "...", State: "..." }] }]
    if (Array.isArray(data) && data.length > 0) {
      const resultBlock = data[0]

      if (resultBlock?.Status === 'Success' && Array.isArray(resultBlock.PostOffice) && resultBlock.PostOffice.length > 0) {
        const postOffice = resultBlock.PostOffice[0]
        
        // Extract District/City and State
        const city = postOffice?.District || postOffice?.Block || postOffice?.Name || ''
        const state = postOffice?.State || ''

        const successResult = {
          success: true,
          city,
          state,
          pincode: cleanPin
        }

        // Cache successful lookup
        pincodeCache.set(cleanPin, successResult)
        return successResult
      } else {
        const errorMsg = resultBlock?.Message || 'Invalid or non-existent PIN code.'
        const failResult = {
          success: false,
          error: errorMsg
        }
        return failResult
      }
    }

    return {
      success: false,
      error: 'Invalid response format from PIN code service.'
    }

  } catch (err) {
    if (err.name === 'AbortError') {
      return { success: false, aborted: true }
    }
    console.error('Error in fetchPincodeDetails:', err)
    return {
      success: false,
      error: 'Unable to lookup PIN code. Please enter State and City manually.'
    }
  } finally {
    if (currentAbortController?.signal === signal) {
      currentAbortController = null
    }
  }
}

/**
 * Clear the in-memory PIN code cache (if needed)
 */
export const clearPincodeCache = () => {
  pincodeCache.clear()
}
