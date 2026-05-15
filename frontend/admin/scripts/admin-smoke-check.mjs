const baseUrl = (process.env.VITE_API_URL || process.env.ADMIN_API_URL || 'http://localhost:5000')
  .trim()
  .replace(/\/+$/, '')
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@seemee.com').trim()
const adminPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim()

const fail = (message) => {
  console.error(`❌ ${message}`)
  process.exit(1)
}

const jsonRequest = async (url, options = {}) => {
  const response = await fetch(url, options)
  const text = await response.text()
  const payload = text ? JSON.parse(text) : {}

  if (!response.ok) {
    throw new Error(payload.message || `Request failed: ${response.status} ${response.statusText}`)
  }

  return payload
}

const run = async () => {
  console.log(`▶ Running admin smoke check against ${baseUrl}`)

  const login = await jsonRequest(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword })
  })

  if (!login?.success || login?.user?.role !== 'admin' || !login?.token) {
    fail('Admin login did not return an admin session')
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${login.token}`
  }

  const [me, search, products, orders] = await Promise.all([
    jsonRequest(`${baseUrl}/api/auth/me`, { headers: authHeaders }),
    jsonRequest(`${baseUrl}/api/admin/search?q=Royal`, { headers: authHeaders }),
    jsonRequest(`${baseUrl}/api/products`),
    jsonRequest(`${baseUrl}/api/orders`, { headers: authHeaders })
  ])

  if (!me?.success || me?.data?.role !== 'admin') {
    fail('/api/auth/me did not return an admin user')
  }

  if (!search?.success || !Array.isArray(search?.data?.products) || !Array.isArray(search?.data?.orders) || !Array.isArray(search?.data?.users)) {
    fail('/api/admin/search did not return the expected result shape')
  }

  if (!products?.success || !Array.isArray(products?.data)) {
    fail('/api/products did not return a product list')
  }

  if (!orders?.success || !Array.isArray(orders?.data)) {
    fail('/api/orders did not return an order list')
  }

  console.log('✅ Admin smoke checks passed')
}

run().catch((error) => fail(error.message || 'Smoke check failed'))
