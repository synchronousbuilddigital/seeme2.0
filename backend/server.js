import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

// Config
import connectDB from './config/db.js'

// Import routes
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import uploadRoutes from './routes/upload.js'
import newArrivalRoutes from './routes/newArrivals.js'
import magazineRoutes from './routes/magazine.js'
import carouselRoutes from './routes/carousel.js'
import siteSettingsRoutes from './routes/siteSettings.js'
import adminRoutes from './routes/admin.js'
import userRoutes from './routes/users.js'

// Security Middlewares
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// ─── SECURITY MIDDLEWARES ──────────────────────────────
// ─── CORS (Must be before limiters) ──────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true)
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(helmet())
app.use(cookieParser())

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased for admin dashboard polling
  message: { success: false, message: 'Too many requests, please try again later.' }
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per `window` (login/signup)
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' }
})

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each user to 20 payment attempts per hour
  message: { success: false, message: 'Payment attempt limit reached. Please try again later.' }
})

app.use('/api/', globalLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/orders/create-razorpay-order', paymentLimiter)

// CORS moved to top

// ─── BODY PARSING ──────────────────────────────────────
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// ─── REQUEST LOGGER (development only) ─────────────────
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const start = Date.now()
    res.on('finish', () => {
      const duration = Date.now() - start
      const status = res.statusCode
      const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m'
      console.log(`${color}${req.method}\x1b[0m ${req.originalUrl} → ${status} (${duration}ms)`)
    })
    next()
  })
}

// ─── HEALTH CHECK ──────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'See Mee API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
})

// ─── API ROUTES ────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/new-arrivals', newArrivalRoutes)
app.use('/api/magazine', magazineRoutes)
app.use('/api/carousel', carouselRoutes)
app.use('/api/site-settings', siteSettingsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/users', userRoutes)

// ─── 404 HANDLER ───────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  })
})

// ─── GLOBAL ERROR HANDLER ──────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message)
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack)
  }

  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// ─── START SERVER ──────────────────────────────────────
const PORT = process.env.PORT || 5000

// For Vercel serverless, export the app
export default app

// Only listen if not in Vercel serverless environment
if (!process.env.VERCEL) {
  const startServer = async () => {
    await connectDB()
    
    // Drop stale sku unique index that causes duplicate key errors
    try {
      const mongoose = (await import('mongoose')).default
      const collection = mongoose.connection.collection('products')
      const indexes = await collection.indexes()
      const skuIndex = indexes.find(i => i.name === 'sku_1')
      if (skuIndex) {
        await collection.dropIndex('sku_1')
        console.log('✅ Dropped stale sku_1 index')
      }
    } catch (err) {
      // Index may not exist, that's fine
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`)
      console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`)
    })
  }
  startServer()
}
