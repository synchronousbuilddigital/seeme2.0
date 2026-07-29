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

import compression from 'compression'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// ─── PERFORMANCE MIDDLEWARES ───────────────────────────
app.use(compression())

// Cache Control Headers for public GET requests
app.use('/api', (req, res, next) => {
  if (req.method === 'GET' && !req.headers.authorization && !req.originalUrl.includes('site-settings')) {
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
  } else if (req.originalUrl.includes('site-settings')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  }
  next()
})


// ─── SECURITY MIDDLEWARES ──────────────────────────────
// ─── CORS (Must be before limiters) ──────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173', // Common Vite port
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
  'https://seeme2-0-f867.vercel.app',
  'https://seeme2-0-inue.vercel.app',
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // In development, allow all local origins
    if (!origin || process.env.NODE_ENV !== 'production') {
      return callback(null, true)
    }
    
    // In production, check against whitelist
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app')
                      
    if (isAllowed) {
      return callback(null, true)
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "blob:", "https://*.cloudinary.com", "https://res.cloudinary.com", "https://images.unsplash.com", "https://images.pexels.com", "*.placeholder.com"],
      "media-src": ["'self'", "https://*.cloudinary.com", "https://res.cloudinary.com", "data:", "blob:"],
      "connect-src": ["'self'", "https://*.cloudinary.com", "https://res.cloudinary.com", "*.vercel.app", "http://localhost:*", "http://127.0.0.1:*"]
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}))
app.use(cookieParser())

// Rate Limiting - Disabled or relaxed in development
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === 'production' ? 500 : 5000, 
  message: { success: false, message: 'Too many requests, please try again later.' }
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' }
})

app.use('/api/', globalLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

// ─── BODY PARSING ──────────────────────────────────────
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// ─── REQUEST LOGGER ─────────────────
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
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')))
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

// ─── INITIALIZATION ─────────────────────────────────────
connectDB().then(() => {
  if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`)
      console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`)
    })
  }
}).catch(err => {
  console.error('Failed to initialize server:', err.message)
})

export default app
