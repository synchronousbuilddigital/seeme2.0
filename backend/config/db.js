import dns from 'dns'
import mongoose from 'mongoose'

// Force Cloudflare and Google DNS to fix MongoDB Atlas SRV connection issues
dns.setServers(['1.1.1.1', '8.8.8.8'])

/**
 * Connect to MongoDB with retry logic and proper event handling.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/seemee', {
      family: 4 // Force IPv4 to avoid DNS resolution issues
    })

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...')
    })

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected')
    })

    return conn
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message)
    // Retry after 5 seconds
    console.log('🔄 Retrying connection in 5 seconds...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    return connectDB()
  }
}

export default connectDB
