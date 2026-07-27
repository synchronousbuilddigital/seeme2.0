import mongoose from 'mongoose'
import dotenv from 'dotenv'
import dns from 'dns'

import User from '../models/User.js'
import Product from '../models/Product.js'
import Magazine from '../models/Magazine.js'
import NewArrival from '../models/NewArrival.js'
import Order from '../models/Order.js'
import HeroCarousel from '../models/HeroCarousel.js'
import SiteSettings from '../models/SiteSettings.js'

// Use reliable DNS servers for Atlas connectivity
dns.setServers(['1.1.1.1', '8.8.8.8'])
dotenv.config()

const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const adminPassword = process.env.ADMIN_PASSWORD || ''

const connect = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is missing in .env')
  }
  await mongoose.connect(process.env.MONGODB_URI, { family: 4 })
}

const preserveAdminAndPurge = async () => {
  // Ensure one canonical admin exists (create if missing)
  const existingAdminCandidates = await User.find({ role: 'admin' })
  let admin = existingAdminCandidates.find((user) => String(user.email || '').trim().toLowerCase() === adminEmail)

  if (!admin) {
    admin = await User.create({ email: adminEmail, password: adminPassword, name: 'Admin', role: 'admin' })
    console.log('✅ Admin created:', adminEmail)
  } else {
    admin.email = adminEmail
    admin.password = adminPassword
    admin.role = 'admin'
    admin.name = admin.name || 'Admin'
    await admin.save()
    console.log('✅ Admin exists:', adminEmail)
  }

  // Remove all other users, including stale duplicate admins with whitespace variants
  const removedUsers = await User.deleteMany({ _id: { $ne: admin._id } })
  console.log(`🗑️  Removed ${removedUsers.deletedCount || 0} non-admin users`)

  // Clear other collections entirely
  const cleared = []
  const models = [Product, Magazine, NewArrival, Order, HeroCarousel, SiteSettings]
  for (const m of models) {
    try {
      const res = await m.deleteMany({})
      cleared.push({ model: m.modelName, deleted: res.deletedCount || 0 })
    } catch (err) {
      console.warn('Failed to clear', m.modelName, err.message)
    }
  }

  cleared.forEach(c => console.log(`🗑️  Cleared ${c.model}: ${c.deleted}`))
}

const seedMockData = async () => {
  // Seed site settings with 3 categories
  await SiteSettings.create({
    logo: '/images/logoSEEMEE1.png',
    aboutImage: '/images/about/aboutHero.jpg',
    fabrics: [
      { title: 'Banarasi Weave', description: 'Rich brocades woven in Varanasi', image: '/images/about/fabric1.jpg', order: 0 },
      { title: 'Chiffon Elegance', description: 'Light and flowy chiffons', image: '/images/about/fabric2.jpg', order: 1 },
      { title: 'Silk Blend', description: 'Premium silk and cotton blend', image: '/images/about/fabric3.jpg', order: 2 },
      { title: 'Velvet Luxury', description: 'Soft and luxurious velvet', image: '/images/about/fabric4.jpg', order: 3 },
      { title: 'Handloom Cotton', description: 'Traditional handwoven cotton', image: '/images/about/fabric5.jpg', order: 4 }
    ],
    categorySlides: [
      {
        title: '2-Piece Sets',
        slug: '2-piece-sets',
        subtitle: 'Effortless Modernity',
        description: 'Stunning tunic and trouser duos that redefine casual luxury with absolute ease.',
        features: ['Tailored Tunic', 'Fluid Trousers', 'Premium Comfort'],
        image: '/images/categories_straight.jpg',
        order: 0
      },
      {
        title: '3-Piece Sets',
        slug: '3-piece-sets',
        subtitle: 'Complete Regal Grace',
        description: 'Harmonious kurta, pants, and matching dupatta sets, crafted with ancestral weaves.',
        features: ['Heritage Kurta', 'Symmetric Pants', 'Adorned Dupatta'],
        image: '/images/categories_straight.jpg',
        order: 1
      },
      {
        title: 'Co-ord Sets',
        slug: 'co-ord-sets',
        subtitle: 'Contemporary Sleekness',
        description: 'Monochromatic, luxury structured matching co-ords engineered to silhouette your form.',
        features: ['Avant-garde Structure', 'Symmetric Drapes', 'Modern Aesthetic'],
        image: '/images/categories_straight.jpg',
        order: 2
      }
    ]
  })
  console.log('✅ Seeded SiteSettings with 3 premium categories')

  // Seed hero carousel
  await HeroCarousel.insertMany([
    { title: 'New Spring Edit', subtitle: 'Light fabrics • Bold stories', image: '/images/hero/hero1.jpg', order: 0, isActive: true },
    { title: 'Festival Collection', subtitle: 'Celebrate in colour', image: '/images/hero/hero2.jpg', order: 1, isActive: true }
  ])
  console.log('✅ Seeded HeroCarousel')

  // Seed magazine stories
  await Magazine.insertMany([
    { title: 'Craft & Culture', description: 'Exploring artisanal techniques.', image: '/images/magazine/story1.png', order: 0, isActive: true },
    { title: 'Sustainable Silk', description: 'How we source responsibly.', image: '/images/magazine/story2.png', order: 1, isActive: true }
  ])
  console.log('✅ Seeded Magazine')

  // Seed new arrivals
  await NewArrival.insertMany([
    { category: '2-piece-sets', image: '/images/about/4new-straight.jpg', isActive: true },
    { category: '3-piece-sets', image: '/images/categories_straight.jpg', isActive: true },
    { category: 'co-ord-sets', image: '/images/about/4new-straight.jpg', isActive: true }
  ])
  console.log('✅ Seeded NewArrival')

  // Seed clean luxury products (No Anarkali, Sharara, or Palazzo)
  const products = [
    {
      name: 'Emerald Silk Straight Cut',
      description: 'Pure silk straight-cut suit with minimal gold border and tailored fit. Transitions perfectly from office to evening.',
      category: 'co-ord-sets',
      price: 12400,
      images: ['https://images.unsplash.com/photo-1589156206699-bc21e38c8a7d?auto=format&fit=crop&q=80&w=1200'],
      sizeStock: [
        { size: 'S', quantity: 3 },
        { size: 'M', quantity: 6 },
        { size: 'L', quantity: 8 }
      ],
      colors: ['Emerald'],
      featured: true,
      inCollection: true,
      isActive: true
    }
  ]

  await Product.insertMany(products)
  console.log(`✅ Seeded ${products.length} products`)
}

const run = async () => {
  try {
    console.log('🔄 Resetting database & preserving canonical admin...')
    await connect()
    await preserveAdminAndPurge()
    await seedMockData()
    console.log('\n========================================')
    console.log('🎉 DATABASE RESET & SEEDING COMPLETED!')
    console.log('========================================\n')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error resetting database:', error.message)
    process.exit(1)
  }
}

run()
