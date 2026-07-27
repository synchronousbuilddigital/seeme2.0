import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'
import dns from 'dns'

dns.setServers(['1.1.1.1', '8.8.8.8'])
dotenv.config()

const createAdmin = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is missing in .env')
    }

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be defined in .env')
    }

    await mongoose.connect(process.env.MONGODB_URI, { family: 4 })

    const adminExists = await User.findOne({ email: adminEmail.trim().toLowerCase() })

    if (adminExists) {
      console.log(`❌ Admin user '${adminEmail}' already exists`)
      process.exit(0)
    }

    const admin = await User.create({
      email: adminEmail.trim().toLowerCase(),
      password: adminPassword,
      name: 'Admin',
      role: 'admin'
    })

    console.log('✅ Admin user created successfully')
    console.log('Email:', admin.email)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating admin:', error.message)
    process.exit(1)
  }
}

createAdmin()
