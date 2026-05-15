import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import dns from 'dns'
import Product from '../models/Product.js'
import User from '../models/User.js'
import HeroCarousel from '../models/HeroCarousel.js'
import Magazine from '../models/Magazine.js'
import NewArrival from '../models/NewArrival.js'
import Review from '../models/Review.js'

dns.setServers(['1.1.1.1', '8.8.8.8'])
dotenv.config()

// ============================================
// PREMIUM PRODUCT IMAGES (Pexels/Unsplash URLs)
// ============================================
const PRODUCT_IMAGES = {
  anarkali: [
    'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=800',
    'https://images.pexels.com/photos/3717381/pexels-photo-3717381.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  palazzo: [
    'https://images.unsplash.com/photo-1610173826014-9336df76906a?auto=format&fit=crop&q=80&w=800',
    'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  straightCut: [
    'https://images.unsplash.com/photo-1589156206699-bc21e38c8a7d?auto=format&fit=crop&q=80&w=800',
    'https://images.pexels.com/photos/2955375/pexels-photo-2955375.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  sharara: [
    'https://images.unsplash.com/photo-1617627143750-d86bc21e44bb?auto=format&fit=crop&q=80&w=800',
    'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  saree: [
    'https://images.unsplash.com/photo-1563857671-127f341e4e3c?auto=format&fit=crop&q=80&w=800',
    'https://images.pexels.com/photos/3379558/pexels-photo-3379558.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  lehenga: [
    'https://images.unsplash.com/photo-1552053831-71594a27c62d?auto=format&fit=crop&q=80&w=800',
    'https://images.pexels.com/photos/3622617/pexels-photo-3622617.jpeg?auto=compress&cs=tinysrgb&w=800'
  ]
}

const GALLERY_IMAGES = {
  carousel: [
    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1490481651worksheets.comgress&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1595614595-c1a97f7e5c8e?auto=format&fit=crop&q=80&w=1200'
  ]
}

// ============================================
// COMPREHENSIVE PRODUCT DATA
// ============================================
const productsData = [
  // Premium Anarkali Collection
  {
    name: 'Royal Midnight Anarkali',
    description: 'Exquisite deep navy velvet Anarkali adorned with intricate silver Zardosi embroidery. Features a regal flare silhouette with hand-embellished details and comes with a sheer georgette dupatta.',
    shortDescription: 'Navy velvet Anarkali with silver embroidery',
    category: 'anarkali',
    subcategory: 'festive',
    brand: 'SeeMee Premium',
    price: 18500,
    discountPrice: 15995,
    images: [PRODUCT_IMAGES.anarkali[0]],
    gallery: [PRODUCT_IMAGES.anarkali[0], PRODUCT_IMAGES.anarkali[1]],
    sku: 'ANAR-001',
    stock: 15,
    isNewArrival: true,
    sizes: ['S', 'M', 'L', 'XL'],
    sizeStock: [
      { size: 'S', quantity: 3 },
      { size: 'M', quantity: 5 },
      { size: 'L', quantity: 4 },
      { size: 'XL', quantity: 3 }
    ],
    colors: ['Navy', 'Maroon', 'Teal'],
    materials: ['Velvet', 'Georgette', 'Zardosi'],
    tags: ['festive', 'embroidered', 'premium'],
    seo: {
      title: 'Royal Midnight Anarkali - Premium Ethnic Wear',
      description: 'Shop exquisite navy Anarkali with silver embroidery from SeeMee'
    },
    status: 'published',
    dimensions: { length: 55, width: 40, height: 5, unit: 'cm' },
    weight: { value: 800, unit: 'grams' },
    packagingType: 'luxury-box'
  },
  {
    name: 'Emerald Bliss Anarkali',
    description: 'Stunning emerald green silk Anarkali with delicate thread work and pearl embellishments. Perfect for wedding season with a flowing silhouette and traditional design elements.',
    shortDescription: 'Emerald silk Anarkali with pearl work',
    category: 'anarkali',
    subcategory: 'wedding',
    brand: 'SeeMee Premium',
    price: 22000,
    discountPrice: 19250,
    images: [PRODUCT_IMAGES.anarkali[1]],
    gallery: [PRODUCT_IMAGES.anarkali[1], PRODUCT_IMAGES.anarkali[0]],
    sku: 'ANAR-002',
    stock: 12,
    isNewArrival: true,
    sizes: ['S', 'M', 'L'],
    sizeStock: [
      { size: 'S', quantity: 2 },
      { size: 'M', quantity: 5 },
      { size: 'L', quantity: 5 }
    ],
    colors: ['Emerald', 'Gold', 'Green'],
    materials: ['Silk', 'Organza', 'Pearls'],
    tags: ['wedding', 'premium', 'silk'],
    seo: { title: 'Emerald Silk Anarkali - Wedding Collection', description: 'Luxurious emerald Anarkali for special occasions' },
    status: 'published',
    weight: { value: 900, unit: 'grams' }
  },

  // Palazzo Collection
  {
    name: 'Pastel Blush Palazzo Set',
    description: 'Effortless elegance in premium handloom cotton. Delicate floral embroidered kurta paired with comfortable wide-leg palazzos. Perfect for casual gatherings and everyday elegance.',
    shortDescription: 'Blush handloom palazzo set with floral embroidery',
    category: 'palazzo',
    subcategory: 'casual',
    brand: 'SeeMee Comfort',
    price: 7200,
    discountPrice: 6200,
    images: [PRODUCT_IMAGES.palazzo[0]],
    gallery: [PRODUCT_IMAGES.palazzo[0], PRODUCT_IMAGES.palazzo[1]],
    sku: 'PAL-001',
    stock: 25,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    sizeStock: [
      { size: 'XS', quantity: 2 },
      { size: 'S', quantity: 4 },
      { size: 'M', quantity: 7 },
      { size: 'L', quantity: 6 },
      { size: 'XL', quantity: 4 },
      { size: 'XXL', quantity: 2 }
    ],
    colors: ['Blush', 'Cream', 'Peach'],
    materials: ['Handloom Cotton', 'Thread'],
    tags: ['comfortable', 'casual', 'ethnic'],
    seo: { title: 'Pastel Blush Palazzo Set - Handloom Cotton', description: 'Comfortable handloom palazzo set for everyday wear' },
    status: 'published',
    weight: { value: 600, unit: 'grams' }
  },
  {
    name: 'Ocean Blue Palazzo Suit',
    description: 'Sophisticated ocean blue palazzo suit in premium cotton blend. Features subtle geometric patterns and perfect for both casual and semi-formal occasions.',
    shortDescription: 'Blue palazzo suit with geometric patterns',
    category: 'palazzo',
    subcategory: 'casual',
    brand: 'SeeMee Comfort',
    price: 6800,
    discountPrice: 5800,
    images: [PRODUCT_IMAGES.palazzo[1]],
    gallery: [PRODUCT_IMAGES.palazzo[1], PRODUCT_IMAGES.palazzo[0]],
    sku: 'PAL-002',
    stock: 20,
    sizes: ['S', 'M', 'L', 'XL'],
    sizeStock: [
      { size: 'S', quantity: 5 },
      { size: 'M', quantity: 7 },
      { size: 'L', quantity: 6 },
      { size: 'XL', quantity: 2 }
    ],
    colors: ['Ocean Blue', 'Navy', 'Teal'],
    materials: ['Cotton Blend', 'Viscose'],
    tags: ['casual', 'comfortable', 'versatile'],
    seo: { title: 'Ocean Blue Palazzo Suit - Cotton Blend', description: 'Versatile blue palazzo suit for all occasions' },
    status: 'published',
    weight: { value: 580, unit: 'grams' }
  },

  // Straight Cut Collection
  {
    name: 'Emerald Silk Straight Cut',
    description: 'Sophisticated emerald green silk straight-cut suit with minimal gold border embroidery. Tailored fit perfect for office to evening transition.',
    shortDescription: 'Emerald silk suit with gold border',
    category: 'straight-cut',
    subcategory: 'formal',
    brand: 'SeeMee Formal',
    price: 12400,
    discountPrice: 10800,
    images: [PRODUCT_IMAGES.straightCut[0]],
    gallery: [PRODUCT_IMAGES.straightCut[0], PRODUCT_IMAGES.straightCut[1]],
    sku: 'STR-001',
    stock: 18,
    sizes: ['S', 'M', 'L', 'XL'],
    sizeStock: [
      { size: 'S', quantity: 3 },
      { size: 'M', quantity: 5 },
      { size: 'L', quantity: 7 },
      { size: 'XL', quantity: 3 }
    ],
    colors: ['Emerald', 'Gold', 'Black'],
    materials: ['Pure Silk', 'Gold Thread'],
    tags: ['formal', 'silk', 'elegant'],
    seo: { title: 'Emerald Silk Straight Cut - Professional Wear', description: 'Premium silk straight-cut suit for formal occasions' },
    status: 'published',
    weight: { value: 650, unit: 'grams' }
  },
  {
    name: 'Charcoal Office Straight Suit',
    description: 'Modern charcoal grey straight-cut suit perfect for professional settings. Premium fabric with subtle texture and minimal design for versatile styling.',
    shortDescription: 'Charcoal grey professional straight suit',
    category: 'straight-cut',
    subcategory: 'formal',
    brand: 'SeeMee Formal',
    price: 9800,
    discountPrice: 8500,
    images: [PRODUCT_IMAGES.straightCut[1]],
    gallery: [PRODUCT_IMAGES.straightCut[1], PRODUCT_IMAGES.straightCut[0]],
    sku: 'STR-002',
    stock: 22,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    sizeStock: [
      { size: 'S', quantity: 2 },
      { size: 'M', quantity: 6 },
      { size: 'L', quantity: 8 },
      { size: 'XL', quantity: 4 },
      { size: 'XXL', quantity: 2 }
    ],
    colors: ['Charcoal', 'Grey', 'Black'],
    materials: ['Silk Blend', 'Poly-viscose'],
    tags: ['professional', 'office-wear', 'formal'],
    seo: { title: 'Charcoal Office Straight Suit - Professional Wear', description: 'Modern formal suit for professional women' },
    status: 'published',
    weight: { value: 700, unit: 'grams' }
  },

  // Sharara Collection
  {
    name: 'Golden Saffron Sharara',
    description: 'Vibrant saffron sharara with heavily embellished flares and short intricately embroidered kurta. Creates dynamic silhouette perfect for festive celebrations.',
    shortDescription: 'Saffron sharara with embellished flares',
    category: 'sharara',
    subcategory: 'festive',
    brand: 'SeeMee Premium',
    price: 21000,
    discountPrice: 18500,
    images: [PRODUCT_IMAGES.sharara[0]],
    gallery: [PRODUCT_IMAGES.sharara[0], PRODUCT_IMAGES.sharara[1]],
    sku: 'SHA-001',
    stock: 10,
    isNewArrival: true,
    sizes: ['S', 'M', 'L'],
    sizeStock: [
      { size: 'S', quantity: 2 },
      { size: 'M', quantity: 4 },
      { size: 'L', quantity: 4 }
    ],
    colors: ['Saffron', 'Gold', 'Orange'],
    materials: ['Silk', 'Georgette', 'Zardosi'],
    tags: ['festive', 'embroidered', 'premium', 'wedding'],
    seo: { title: 'Golden Saffron Sharara - Festive Collection', description: 'Stunning saffron sharara for weddings and celebrations' },
    status: 'published',
    weight: { value: 950, unit: 'grams' }
  },
  {
    name: 'Maroon Magnificent Sharara',
    description: 'Rich maroon sharara with intricate pearl and bead work. The flared bottoms feature detailed embroidery making it perfect for wedding celebrations.',
    shortDescription: 'Maroon sharara with pearl embroidery',
    category: 'sharara',
    subcategory: 'wedding',
    brand: 'SeeMee Premium',
    price: 23500,
    discountPrice: 20500,
    images: [PRODUCT_IMAGES.sharara[1]],
    gallery: [PRODUCT_IMAGES.sharara[1], PRODUCT_IMAGES.sharara[0]],
    sku: 'SHA-002',
    stock: 8,
    isNewArrival: true,
    sizes: ['S', 'M', 'L', 'XL'],
    sizeStock: [
      { size: 'S', quantity: 2 },
      { size: 'M', quantity: 2 },
      { size: 'L', quantity: 2 },
      { size: 'XL', quantity: 2 }
    ],
    colors: ['Maroon', 'Wine', 'Burgundy'],
    materials: ['Silk', 'Pearls', 'Beads'],
    tags: ['wedding', 'premium', 'luxury'],
    seo: { title: 'Maroon Magnificent Sharara - Wedding Collection', description: 'Premium maroon sharara with pearl embroidery' },
    status: 'published',
    weight: { value: 1000, unit: 'grams' }
  },

  // Saree Collection
  {
    name: 'Indigo Batik Saree',
    description: 'Beautiful indigo saree featuring traditional batik patterns handcrafted with love. Lightweight cotton saree perfect for daily wear and casual occasions.',
    shortDescription: 'Indigo batik cotton saree',
    category: 'saree',
    subcategory: 'casual',
    brand: 'SeeMee Artisan',
    price: 4500,
    discountPrice: 3800,
    images: [PRODUCT_IMAGES.saree[0]],
    gallery: [PRODUCT_IMAGES.saree[0], PRODUCT_IMAGES.saree[1]],
    sku: 'SAR-001',
    stock: 30,
    sizes: ['One Size'],
    sizeStock: [{ size: 'One Size', quantity: 30 }],
    colors: ['Indigo', 'Navy', 'Blue'],
    materials: ['Cotton', 'Natural Dye'],
    tags: ['ethnic', 'handmade', 'casual'],
    seo: { title: 'Indigo Batik Saree - Traditional Cotton Saree', description: 'Handcrafted indigo batik saree for casual wear' },
    status: 'published',
    weight: { value: 500, unit: 'grams' }
  },
  {
    name: 'Crimson Silk Saree',
    description: 'Elegant crimson silk saree with gold zari border. Premium quality silk with traditional weaving perfect for festive and formal occasions.',
    shortDescription: 'Crimson silk saree with gold border',
    category: 'saree',
    subcategory: 'festive',
    brand: 'SeeMee Premium',
    price: 16000,
    discountPrice: 13500,
    images: [PRODUCT_IMAGES.saree[1]],
    gallery: [PRODUCT_IMAGES.saree[1], PRODUCT_IMAGES.saree[0]],
    sku: 'SAR-002',
    stock: 14,
    isNewArrival: true,
    sizes: ['One Size'],
    sizeStock: [{ size: 'One Size', quantity: 14 }],
    colors: ['Crimson', 'Red', 'Maroon'],
    materials: ['Pure Silk', 'Gold Zari'],
    tags: ['festive', 'silk', 'premium', 'wedding'],
    seo: { title: 'Crimson Silk Saree - Premium Silk Saree', description: 'Premium crimson silk saree with gold zari border' },
    status: 'published',
    weight: { value: 700, unit: 'grams' }
  },

  // Lehenga Collection
  {
    name: 'Rose Gold Lehenga',
    description: 'Stunning rose gold lehenga with intricate embroidery and sequin work. The skirt features beautiful flares and the choli is perfectly tailored.',
    shortDescription: 'Rose gold embroidered lehenga set',
    category: 'lehenga',
    subcategory: 'wedding',
    brand: 'SeeMee Premium',
    price: 25000,
    discountPrice: 21000,
    images: [PRODUCT_IMAGES.lehenga[0]],
    gallery: [PRODUCT_IMAGES.lehenga[0], PRODUCT_IMAGES.lehenga[1]],
    sku: 'LEH-001',
    stock: 9,
    isNewArrival: true,
    sizes: ['S', 'M', 'L'],
    sizeStock: [
      { size: 'S', quantity: 3 },
      { size: 'M', quantity: 3 },
      { size: 'L', quantity: 3 }
    ],
    colors: ['Rose Gold', 'Gold', 'Peach'],
    materials: ['Silk', 'Organza', 'Sequins'],
    tags: ['wedding', 'luxury', 'embroidered'],
    seo: { title: 'Rose Gold Lehenga - Premium Wedding Lehenga', description: 'Luxurious rose gold lehenga for wedding season' },
    status: 'published',
    weight: { value: 1100, unit: 'grams' }
  },
  {
    name: 'Peacock Blue Lehenga',
    description: 'Magnificent peacock blue lehenga with detailed peacock motif embroidery. Each piece is handcrafted ensuring uniqueness and premium quality.',
    shortDescription: 'Peacock blue embroidered lehenga',
    category: 'lehenga',
    subcategory: 'festive',
    brand: 'SeeMee Premium',
    price: 22000,
    discountPrice: 18500,
    images: [PRODUCT_IMAGES.lehenga[1]],
    gallery: [PRODUCT_IMAGES.lehenga[1], PRODUCT_IMAGES.lehenga[0]],
    sku: 'LEH-002',
    stock: 11,
    isNewArrival: true,
    sizes: ['S', 'M', 'L', 'XL'],
    sizeStock: [
      { size: 'S', quantity: 2 },
      { size: 'M', quantity: 3 },
      { size: 'L', quantity: 4 },
      { size: 'XL', quantity: 2 }
    ],
    colors: ['Peacock Blue', 'Navy', 'Blue'],
    materials: ['Silk', 'Georgette', 'Zardosi'],
    tags: ['festive', 'embroidered', 'wedding'],
    seo: { title: 'Peacock Blue Lehenga - Festive Collection', description: 'Beautiful peacock blue lehenga with traditional embroidery' },
    status: 'published',
    weight: { value: 1050, unit: 'grams' }
  }
]

// ============================================
// USER DATA
// ============================================
const usersData = [
  {
    email: 'admin@seemee.com',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User',
    phone: '+91-9999999999',
    addresses: [
      {
        street: '123 Fashion Hub',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        country: 'India',
        isDefault: true
      }
    ]
  },
  {
    email: 'customer@seemee.com',
    password: 'customer123',
    role: 'customer',
    name: 'Priya Sharma',
    phone: '+91-9876543210',
    addresses: [
      {
        street: '456 Ethnic Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
        isDefault: true
      },
      {
        street: '789 Fashion Lane',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        country: 'India',
        isDefault: false
      }
    ]
  },
  {
    email: 'test@seamee.com',
    password: 'test123',
    role: 'customer',
    name: 'Anjali Verma',
    phone: '+91-8765432109',
    addresses: [
      {
        street: '321 Saree Lane',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700001',
        country: 'India',
        isDefault: true
      }
    ]
  }
]

// ============================================
// HERO CAROUSEL DATA
// ============================================
const carouselData = [
  {
    title: 'Premium Ethnic Collection',
    description: 'Explore our exquisite collection of handcrafted ethnic wear',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=1200',
    link: '/products?category=anarkali',
    active: true,
    order: 1
  },
  {
    title: 'Summer Palazzo Collection',
    description: 'Comfortable and stylish palazzo suits for every occasion',
    image: 'https://images.unsplash.com/photo-1595614595-c1a97f7e5c8e?auto=format&fit=crop&q=80&w=1200',
    link: '/products?category=palazzo',
    active: true,
    order: 2
  },
  {
    title: 'Wedding Season Specials',
    description: 'Make your celebration special with our premium wedding collection',
    image: 'https://images.unsplash.com/photo-1590080876-e8b1925c1e58?auto=format&fit=crop&q=80&w=1200',
    link: '/products?category=lehenga',
    active: true,
    order: 3
  }
]

// ============================================
// MAIN SEED FUNCTION
// ============================================
const seedDatabase = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 })
    console.log('✅ MongoDB Connected Successfully\n')

    // Clear existing data
    console.log('🗑️  Clearing existing data...')
    await Product.deleteMany({})
    await User.deleteMany({})
    await HeroCarousel.deleteMany({})
    await Magazine.deleteMany({})
    await NewArrival.deleteMany({})
    await Review.deleteMany({})
    console.log('✅ All collections cleared\n')

    // Seed Products
    console.log('📦 Seeding products...')
    const products = await Product.insertMany(productsData)
    console.log(`✅ Successfully seeded ${products.length} products\n`)

    // Seed Users
    console.log('👥 Seeding users...')
    const users = await User.insertMany(usersData)
    console.log(`✅ Successfully seeded ${users.length} users\n`)

    // Seed Hero Carousel
    console.log('🎠 Seeding hero carousel...')
    const carousel = await HeroCarousel.insertMany(carouselData)
    console.log(`✅ Successfully seeded ${carousel.length} carousel items\n`)

    // Seed New Arrivals
    console.log('🆕 Seeding new arrivals...')
    const newArrivals = await NewArrival.insertMany(
      products
        .filter(p => p.isNewArrival)
        .slice(0, 8)
        .map(p => ({
          product: p._id,
          title: p.name,
          image: p.images[0],
          featured: true
        }))
    )
    console.log(`✅ Successfully seeded ${newArrivals.length} new arrivals\n`)

    // Seed Sample Reviews
    console.log('⭐ Seeding sample reviews...')
    const reviews = await Review.insertMany([
      {
        user: users[1]._id,
        name: users[1].name,
        rating: 5,
        comment: 'Amazing quality! The fabric is so comfortable and the embroidery is beautiful. Highly recommended!',
        product: products[0]._id
      },
      {
        user: users[1]._id,
        name: users[1].name,
        rating: 4,
        comment: 'Great fit and excellent customer service. Will definitely order again!',
        product: products[2]._id
      },
      {
        user: users[2]._id,
        name: users[2].name,
        rating: 5,
        comment: 'Perfect for the occasion. The color and quality exceeded my expectations!',
        product: products[4]._id
      }
    ])
    console.log(`✅ Successfully seeded ${reviews.length} reviews\n`)

    // Summary
    console.log('=' * 50)
    console.log('✅ DATABASE SEEDING COMPLETE')
    console.log('=' * 50)
    console.log(`📦 Products: ${products.length}`)
    console.log(`👥 Users: ${users.length}`)
    console.log(`🎠 Carousel Items: ${carousel.length}`)
    console.log(`🆕 New Arrivals: ${newArrivals.length}`)
    console.log(`⭐ Reviews: ${reviews.length}`)
    console.log('=' * 50)
    console.log('\n📝 Admin Credentials:')
    console.log('  Email: admin@seemee.com')
    console.log('  Password: admin123\n')
    console.log('📝 Test Customer:')
    console.log('  Email: customer@seemee.com')
    console.log('  Password: customer123\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run seed
seedDatabase()
