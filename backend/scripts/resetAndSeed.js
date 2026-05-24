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

const adminEmail = (process.env.ADMIN_EMAIL || 'admin@seemee.com').trim().toLowerCase()
const adminPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim()

const connect = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/seemee', { family: 4 })
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
  // Seed site settings with 5 categories
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
        image: '/images/ruby_bridal_sharara.png',
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

  // Seed new arrivals (one per category)
  await NewArrival.insertMany([
    { category: '2-piece-sets', image: '/images/about/new-palazzo.jpg', isActive: true },
    { category: '3-piece-sets', image: '/images/about/new-anarkali.jpg', isActive: true },
    { category: 'co-ord-sets', image: '/images/about/4new-straight.jpg', isActive: true }
  ])
  console.log('✅ Seeded NewArrival')

  // Seed 10 products with complete mock data
  const products = [
    {
      name: 'Royal Midnight Anarkali',
      description: 'Deep navy velvet with silver Zardosi embroidery and a floor-length silhouette. Paired with a sheer georgette dupatta.',
      category: '3-piece-sets',
      price: 18500,
      images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=1200'],
      video: '',
      sizeStock: [
        { size: 'S', quantity: 5 },
        { size: 'M', quantity: 8 },
        { size: 'L', quantity: 4 },
        { size: 'XL', quantity: 2 }
      ],
      colors: ['Navy', 'Silver'],
      featured: true,
      inCollection: true,
      isActive: true
    },
    {
      name: 'Pastel Blush Palazzo Set',
      description: 'Handloom cotton kurta with wide-leg palazzos, breathable and elegant. Perfect for summer gatherings.',
      category: '2-piece-sets',
      price: 7200,
      images: ['https://images.unsplash.com/photo-1610173826014-9336df76906a?auto=format&fit=crop&q=80&w=1200'],
      sizeStock: [
        { size: 'M', quantity: 10 },
        { size: 'L', quantity: 12 },
        { size: 'XL', quantity: 5 }
      ],
      colors: ['Blush', 'Ivory'],
      featured: true,
      inCollection: false,
      isActive: true
    },
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
      featured: false,
      inCollection: false,
      isActive: true
    },
    {
      name: 'Golden Saffron Sharara',
      description: 'Vibrant saffron sharara with heavy embroidery on flares and short kurta. Ideal for festive celebrations.',
      category: '3-piece-sets',
      price: 21000,
      images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e44bb?auto=format&fit=crop&q=80&w=1200'],
      sizeStock: [
        { size: 'S', quantity: 2 },
        { size: 'M', quantity: 5 },
        { size: 'L', quantity: 3 }
      ],
      colors: ['Saffron', 'Gold'],
      featured: true,
      inCollection: true,
      isActive: true
    },
    {
      name: 'Maroon Velvet Anarkali',
      description: 'Luxurious maroon velvet anarkali with pearl and stone work. A statement piece for weddings.',
      category: '3-piece-sets',
      price: 22000,
      images: ['https://images.unsplash.com/photo-1578991444433-d20a7a8d039f?auto=format&fit=crop&q=80&w=1200'],
      sizeStock: [
        { size: 'XS', quantity: 2 },
        { size: 'S', quantity: 6 },
        { size: 'M', quantity: 7 },
        { size: 'L', quantity: 4 },
        { size: 'XL', quantity: 2 }
      ],
      colors: ['Maroon', 'Gold'],
      featured: true,
      inCollection: false,
      isActive: true
    },
    {
      name: 'Sage Green Palazzo',
      description: 'Soft sage green palazzo with delicate floral prints and comfortable fit. Perfect for casual elegance.',
      category: '2-piece-sets',
      price: 5800,
      images: ['https://images.unsplash.com/photo-1597683212624-b3f48dd6b837?auto=format&fit=crop&q=80&w=1200'],
      sizeStock: [
        { size: 'S', quantity: 8 },
        { size: 'M', quantity: 15 },
        { size: 'L', quantity: 10 },
        { size: 'XL', quantity: 6 }
      ],
      colors: ['Sage', 'Cream'],
      featured: false,
      inCollection: true,
      isActive: true
    },
    {
      name: 'Champagne Silk Straight',
      description: 'Elegant champagne silk straight cut with delicate border work. Sophisticated and timeless.',
      category: 'co-ord-sets',
      price: 14200,
      images: ['https://images.unsplash.com/photo-1580952855202-8352ada4afe5?auto=format&fit=crop&q=80&w=1200'],
      sizeStock: [
        { size: 'S', quantity: 4 },
        { size: 'M', quantity: 8 },
        { size: 'L', quantity: 6 },
        { size: 'XL', quantity: 3 }
      ],
      colors: ['Champagne'],
      featured: false,
      inCollection: false,
      isActive: true
    },
    {
      name: 'Cherry Red Sharara',
      description: 'Bold cherry red sharara with intricate threadwork. A perfect choice for traditional celebrations.',
      category: '3-piece-sets',
      price: 19500,
      images: ['https://images.unsplash.com/photo-1577720643272-265f434fe3d3?auto=format&fit=crop&q=80&w=1200'],
      sizeStock: [
        { size: 'S', quantity: 3 },
        { size: 'M', quantity: 4 },
        { size: 'L', quantity: 2 }
      ],
      colors: ['Cherry Red', 'Gold'],
      featured: false,
      inCollection: false,
      isActive: true
    },
    {
      name: 'Lavender Dream Anarkali',
      description: 'Dreamy lavender anarkali with mirror work and embroidery. Light, airy, and perfect for evening events.',
      category: '3-piece-sets',
      price: 15800,
      images: ['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&q=80&w=1200'],
      sizeStock: [
        { size: 'S', quantity: 5 },
        { size: 'M', quantity: 10 },
        { size: 'L', quantity: 7 }
      ],
      colors: ['Lavender'],
      featured: false,
      inCollection: true,
      isActive: true
    },
    {
      name: 'Rust Orange Palazzo',
      description: 'Warm rust orange palazzo set with block print details. Comfortable everyday wear with style.',
      category: '2-piece-sets',
      price: 6500,
      images: ['https://images.unsplash.com/photo-1554568218-84f6dd1cb744?auto=format&fit=crop&q=80&w=1200'],
      sizeStock: [
        { size: 'S', quantity: 12 },
        { size: 'M', quantity: 14 },
        { size: 'L', quantity: 10 },
        { size: 'XL', quantity: 8 }
      ],
      colors: ['Rust', 'Cream'],
      featured: true,
      inCollection: false,
      isActive: true
    }
  ]

  await Product.insertMany(products)
  console.log(`✅ Seeded ${products.length} products`)
}

const run = async () => {
  try {
    await connect()
    console.log('✅ Connected to MongoDB')

    await preserveAdminAndPurge()
    await seedMockData()

    console.log('🎉 Reset and seeding completed successfully')
    process.exit(0)
  } catch (err) {
    console.error('❌ Error during resetAndSeed:', err)
    process.exit(1)
  }
}

run()
