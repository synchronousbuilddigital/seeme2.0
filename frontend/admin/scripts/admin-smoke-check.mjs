import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const baseUrl = (process.env.VITE_API_URL || process.env.ADMIN_API_URL || 'http://localhost:5000')
  .trim()
  .replace(/\/+$/, '')

let adminEmail = (process.env.ADMIN_EMAIL || '').trim()
let adminPassword = (process.env.ADMIN_PASSWORD || '').trim()

if (!adminEmail || !adminPassword) {
  const envPath = path.resolve(__dirname, '../../backend/.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const emailMatch = envContent.match(/^ADMIN_EMAIL\s*=\s*(.+)$/m)
    const passMatch = envContent.match(/^ADMIN_PASSWORD\s*=\s*(.+)$/m)
    if (emailMatch && !adminEmail) adminEmail = emailMatch[1].trim()
    if (passMatch && !adminPassword) adminPassword = passMatch[1].trim()
  }
}

if (!adminEmail || !adminPassword) {
  console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be defined in backend/.env')
  process.exit(1)
}

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
