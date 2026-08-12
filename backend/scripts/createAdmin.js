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

    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
    const adminPassword = (process.env.ADMIN_PASSWORD || '').trim()

    if (!adminEmail || !adminPassword) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be defined in .env')
    }

    await mongoose.connect(process.env.MONGODB_URI, { family: 4 })

    const existingAdmins = await User.find({
      $or: [{ role: 'admin' }, { email: adminEmail }]
    })

    let canonicalAdmin = existingAdmins.find(
      (u) => String(u.email || '').trim().toLowerCase() === adminEmail
    )

    if (!canonicalAdmin) {
      canonicalAdmin = await User.create({
        email: adminEmail,
        password: adminPassword,
        name: 'Admin',
        role: 'admin'
      })
      console.log(`✅ Created canonical admin: ${adminEmail}`)
    } else {
      canonicalAdmin.email = adminEmail
      canonicalAdmin.password = adminPassword
      canonicalAdmin.role = 'admin'
      canonicalAdmin.name = canonicalAdmin.name || 'Admin'
      await canonicalAdmin.save()
      console.log(`✅ Updated canonical admin: ${adminEmail}`)
    }

    const removedAdmins = await User.deleteMany({
      _id: { $ne: canonicalAdmin._id },
      $or: [{ role: 'admin' }, { email: 'admin@seemee.com' }]
    })

    console.log(`🗑️  Removed ${removedAdmins.deletedCount || 0} stale admin user(s)`)
    console.log('✅ Database synchronized to strictly allow only the .env admin.')

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error syncing admin:', error.message)
    process.exit(1)
  }
}

createAdmin()
