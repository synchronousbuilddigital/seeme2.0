const parseResponsePayload = async (response) => {
  const contentType = response.headers.get('content-type') || ''
  const text = await response.text()

  if (!text) {
    return {}
  }

  if (!contentType.includes('application/json')) {
    throw new Error(`Server returned an invalid response format (${response.status})`)
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Server returned an invalid response format')
  }
}

export const getAdminToken = () => localStorage.getItem('adminToken')

export const getStoredAdminUser = () => {
  try {
    const raw = localStorage.getItem('adminUser')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
    return null
  }

  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

export const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return false
  return Date.now() >= payload.exp * 1000
}

export const isAdminSessionValid = () => {
  const token = getAdminToken()
  const user = getStoredAdminUser()

  if (!token || !user || user.role !== 'admin') {
    return false
  }

  return !isTokenExpired(token)
}

export const clearAdminSession = () => {
  localStorage.removeItem('adminToken')
  localStorage.removeItem('adminUser')
}

export const withAuthHeader = (headers = {}) => {
  const token = getAdminToken()
  if (token && isTokenExpired(token)) {
    clearAdminSession()
    return headers
  }
  return token
    ? { ...headers, Authorization: `Bearer ${token}` }
    : headers
}

// In-Memory SWR Cache for fast admin API calls
const apiCache = new Map()
const CACHE_TTL = 30000 // 30 seconds fresh TTL

export const clearApiCache = (keyPattern) => {
  if (!keyPattern) {
    apiCache.clear()
    return
  }
  for (const key of apiCache.keys()) {
    if (key.includes(keyPattern)) {
      apiCache.delete(key)
    }
  }
}

export const apiRequest = async (url, options = {}) => {
  const {
    method = 'GET',
    body,
    headers = {},
    auth = false,
    isFormData = false,
    bypassCache = false
  } = options

  const isGet = method.toUpperCase() === 'GET'

  // Clear cache on mutating actions (POST, PUT, DELETE)
  if (!isGet) {
    clearApiCache()
  }

  // Return fresh cached data instantly for GET requests
  if (isGet && !bypassCache && apiCache.has(url)) {
    const cached = apiCache.get(url)
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
  }

  const requestHeaders = auth ? withAuthHeader(headers) : { ...headers }

  if (auth && !requestHeaders.Authorization) {
    throw new Error('Session expired. Please sign in again.')
  }

  if (!isFormData && body !== undefined && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body)
  })

  const payload = await parseResponsePayload(response)

  if (!response.ok || payload.success === false) {
    const message = payload.message || `Request failed with status ${response.status}`

    if (response.status === 401 && auth) {
      clearAdminSession()
    }

    throw new Error(message)
  }

  // Cache successful GET responses
  if (isGet) {
    apiCache.set(url, {
      data: payload,
      timestamp: Date.now()
    })
  }

  return payload
}
