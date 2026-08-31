// Vercel serverless function with dynamic imports
import mongoose from 'mongoose'
import express from 'express'
import cors from 'cors'

// Global connection cache
let cachedDb = null
let app = null

async function connectToDatabase() {
  // Return if already connected
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined')
  }

  try {
    mongoose.set('strictQuery', false)

    // IMPORTANT: Set bufferCommands to true for serverless
    const opts = {
      bufferCommands: true, // Enable buffering to prevent "before initial connection" errors
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }

    cachedDb = await mongoose.connect(process.env.MONGODB_URI, opts)

    // Wait for connection to be fully ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection not ready')
    }

    console.log('✅ MongoDB connected')
    return cachedDb
  } catch (error) {
    console.error('❌ MongoDB error:', error.message)
    cachedDb = null
    throw error
  }
}

async function createApp() {
  if (app) return app

  app = express()

  // Middleware
  app.use(cors({
    origin: true, // Reflects the request origin, compatible with credentials: true
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
  }))

  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ extended: true, limit: '50mb' }))

  // Health check - MUST be before other routes
  app.get('/api/health', (_, res) => {
    res.json({
      success: true,
      status: 'online',
      message: 'See Mee API is fully functional',
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      env: {
        hasMongoUri: !!process.env.MONGODB_URI,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasCloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
        nodeEnv: process.env.NODE_ENV
      }
    })
  })

  // Simple ping route
  app.get('/api/ping', (_, res) => res.send('pong'))

  // Root API route
  app.get('/api', (_, res) => {
    res.json({
      success: true,
      message: 'See Mee Backend API Root',
      version: '1.0.0',
      health: '/api/health'
    })
  })

  // Dynamically import routes - paths relative to backend/api/
  try {
    console.log('📦 Loading routes...')

    const { default: authRoutes } = await import('../routes/auth.js')
    console.log('✅ Auth routes loaded')

    const { default: productRoutes } = await import('../routes/products.js')
    console.log('✅ Product routes loaded')

    const { default: orderRoutes } = await import('../routes/orders.js')
    console.log('✅ Order routes loaded')

    const { default: newArrivalRoutes } = await import('../routes/newArrivals.js')
    console.log('✅ New arrival routes loaded')

    const { default: magazineRoutes } = await import('../routes/magazine.js')
    console.log('✅ Magazine routes loaded')

    const { default: carouselRoutes } = await import('../routes/carousel.js')
    console.log('✅ Carousel routes loaded')

    const { default: siteSettingsRoutes } = await import('../routes/siteSettings.js')
    console.log('✅ Site settings routes loaded')

    const { default: adminRoutes } = await import('../routes/admin.js')
    console.log('✅ Admin routes loaded')

    const { default: userRoutes } = await import('../routes/users.js')
    console.log('✅ User routes loaded')

    const { default: reelRoutes } = await import('../routes/reels.js')
    console.log('✅ Reel routes loaded')

    const { default: couponRoutes } = await import('../routes/coupons.js')
    console.log('✅ Coupon routes loaded')

    const { default: adminCouponRoutes } = await import('../routes/adminCoupons.js')
    console.log('✅ Admin Coupon routes loaded')

    const { default: shippingRoutes } = await import('../routes/shipping.js')
    console.log('✅ Shipping routes loaded')

    const { default: notificationRoutes } = await import('../routes/notificationRoutes.js')
    console.log('✅ Notification routes loaded')

    const { default: brandRoutes } = await import('../routes/brandRoutes.js')
    console.log('✅ Brand routes loaded')

    app.use('/api/auth', authRoutes)
    app.use('/api/products', productRoutes)
    app.use('/api/orders', orderRoutes)
    app.use('/api/new-arrivals', newArrivalRoutes)
    app.use('/api/magazine', magazineRoutes)
    app.use('/api/carousel', carouselRoutes)
    app.use('/api/site-settings', siteSettingsRoutes)
    app.use('/api/coupon', couponRoutes)
    app.use('/api/admin/coupons', adminCouponRoutes)
    app.use('/api/shipping', shippingRoutes)
    app.use('/api/admin', adminRoutes)
    app.use('/api/users', userRoutes)
    app.use('/api/reels', reelRoutes)
    app.use('/api/notifications', notificationRoutes)
    app.use('/api/brands', brandRoutes)


    const { default: uploadRoutes } = await import('../routes/upload.js')
    app.use('/api/upload', uploadRoutes)

    if (process.env.CLOUDINARY_CLOUD_NAME) {
      console.log('✅ Upload routes loaded')
    } else {
      console.warn('⚠️ Cloudinary not configured; upload routes are mounted but uploads will fail until env vars are set')
    }

    console.log('✅ All routes loaded successfully')
  } catch (error) {
    console.error('❌ Route import error:', error)
    console.error('Stack:', error.stack)
    throw new Error(`Failed to load routes: ${error.message}`)
  }

  // 404 handler
  app.use('/api/*', (_, res) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${_.method} ${_.originalUrl}`
    })
  })

  // Error handler
  app.use((err, _, res, next) => {
    console.error('Express error:', err)
    if (res.headersSent) {
      return next(err)
    }
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  })

  return app
}

// Vercel handler
export default async function handler(req, res) {
  // ─── MANUAL CORS HEADERS (Ensures CORS works even on errors) ───
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log(`📨 ${req.method} ${req.url}`);

    // Normalize URL: Ensure it starts with /api if it doesn't
    // This fixes issues where Vercel might strip the /api prefix
    if (!req.url.startsWith('/api')) {
      req.url = `/api${req.url}`;
    }

    // Connect to database first
    await connectToDatabase();

    // Create/get Express app
    const expressApp = await createApp();

    // Handle request
    return expressApp(req, res);
  } catch (error) {
    console.error('❌ Handler error:', error);

    // Make sure we haven't sent headers yet
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Server initialization error',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : 'Check server logs'
      });
    }
  }
}
