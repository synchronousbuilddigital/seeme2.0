import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

// Set DNS servers to Google DNS as suggested by user to fix ECONNREFUSED
dns.setServers(['8.8.8.8', '8.8.4.4']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

// Load models
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const seedData = async () => {
  try {
    console.log('🚀 Starting Data Seeding with Custom DNS...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env');
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();

    // 2. Create Users
    console.log('👤 Creating Users...');
    const admin = await User.create({
      name: 'SeeMee Admin',
      email: 'admin@seemee.com',
      password: 'admin123',
      role: 'admin'
    });

    const customer = await User.create({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: 'customer123',
      role: 'customer'
    });

    // 3. Create 10 Products (5 in Collection)
    console.log('📦 Creating 10 Products...');
    const productData = [
      {
        name: 'Royal Gold Anarkali',
        description: 'Hand-embroidered gold silk anarkali with heavy zari work on the borders.',
        price: 18500,
        category: 'anarkali',
        stock: 45,
        featured: true,
        inCollection: true,
        sizeStock: [{size:'S',quantity:10},{size:'M',quantity:20},{size:'L',quantity:15}],
        images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=800'],
        isActive: true
      },
      {
        name: 'Emerald Velvet Palazzo',
        description: 'Deep emerald green velvet palazzo set with silver threadwork.',
        price: 12999,
        category: 'palazzo',
        stock: 30,
        featured: true,
        inCollection: true,
        sizeStock: [{size:'M',quantity:15},{size:'XL',quantity:15}],
        images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800'],
        isActive: true
      },
      {
        name: 'Ruby Bridal Sharara',
        description: 'Exquisite ruby red sharara with intricate mirror work for weddings.',
        price: 24500,
        category: 'sharara',
        stock: 10,
        featured: true,
        inCollection: true,
        sizeStock: [{size:'S',quantity:5},{size:'M',quantity:5}],
        images: ['https://images.unsplash.com/photo-1595776613215-fe04b78de7d0?q=80&w=800'],
        isActive: true
      },
      {
        name: 'Midnight Silk Straight Cut',
        description: 'Navy blue premium silk straight cut suit for sophisticated evenings.',
        price: 7500,
        category: 'straight-cut',
        stock: 60,
        featured: false,
        inCollection: true,
        sizeStock: [{size:'S',quantity:20},{size:'M',quantity:20},{size:'L',quantity:20}],
        images: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800'],
        isActive: true
      },
      {
        name: 'Ivory Pearl Sharara',
        description: 'Sophisticated ivory white sharara with pearl and sequin embellishments.',
        price: 15999,
        category: 'sharara',
        stock: 25,
        featured: true,
        inCollection: true,
        sizeStock: [{size:'M',quantity:15},{size:'L',quantity:10}],
        images: ['https://images.unsplash.com/photo-1589156280159-27698a70f29e?q=80&w=800'],
        isActive: true
      },
      {
        name: 'Pastel Floral Anarkali',
        description: 'Lightweight summer anarkali with delicate floral prints.',
        price: 5499,
        category: 'anarkali',
        stock: 100,
        featured: false,
        inCollection: false,
        sizeStock: [{size:'XS',quantity:25},{size:'S',quantity:25},{size:'M',quantity:25},{size:'L',quantity:25}],
        images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800'],
        isActive: true
      },
      {
        name: 'Modern Teal Palazzo',
        description: 'Contemporary teal blue palazzo set with minimalist design.',
        price: 6999,
        category: 'palazzo',
        stock: 40,
        featured: false,
        inCollection: false,
        sizeStock: [{size:'M',quantity:20},{size:'L',quantity:20}],
        images: ['https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=800'],
        isActive: true
      },
      {
        name: 'Maroon Velvet Straight Cut',
        description: 'Rich maroon velvet suit with gold borders, perfect for winters.',
        price: 9999,
        category: 'straight-cut',
        stock: 20,
        featured: false,
        inCollection: false,
        sizeStock: [{size:'M',quantity:10},{size:'XL',quantity:10}],
        images: ['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800'],
        isActive: true
      },
      {
        name: 'Black Sequin Anarkali',
        description: 'Glamorous midnight black anarkali with full sequin work.',
        price: 14500,
        category: 'anarkali',
        stock: 15,
        featured: true,
        inCollection: false,
        sizeStock: [{size:'S',quantity:5},{size:'M',quantity:10}],
        images: ['https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?q=80&w=800'],
        isActive: true
      },
      {
        name: 'Peach Mirror Sharara',
        description: 'Festive peach sharara featuring intricate mirror hand-work.',
        price: 11500,
        category: 'sharara',
        stock: 35,
        featured: false,
        inCollection: false,
        sizeStock: [{size:'S',quantity:15},{size:'M',quantity:20}],
        images: ['https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=800'],
        isActive: true
      }
    ];

    const createdProducts = await Product.insertMany(productData);

    // 4. Create 5 Orders
    console.log('🛒 Creating 5 Orders...');
    const orderData = [
      {
        orderNumber: 'SM' + Date.now() + '1',
        customer: { name: 'Priya Sharma', email: 'priya@example.com', phone: '9876543210', address: { street: '123 Luxury Lane', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' } },
        items: [{ product: createdProducts[0]._id, name: createdProducts[0].name, price: createdProducts[0].price, quantity: 1, size: 'M', image: createdProducts[0].images[0] }],
        totalAmount: 18500, status: 'confirmed', paymentMethod: 'online', paymentStatus: 'paid'
      },
      {
        orderNumber: 'SM' + (Date.now() + 1) + '2',
        customer: { name: 'Ananya Iyer', email: 'ananya@example.com', phone: '9822334455', address: { street: '456 Heritage Walk', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' } },
        items: [{ product: createdProducts[2]._id, name: createdProducts[2].name, price: createdProducts[2].price, quantity: 1, size: 'S', image: createdProducts[2].images[0] }],
        totalAmount: 24500, status: 'processing', paymentMethod: 'online', paymentStatus: 'paid'
      },
      {
        orderNumber: 'SM' + (Date.now() + 2) + '3',
        customer: { name: 'Karan Singh', email: 'karan@example.com', phone: '9988776655', address: { street: '789 Royal Road', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' } },
        items: [{ product: createdProducts[1]._id, name: createdProducts[1].name, price: createdProducts[1].price, quantity: 1, size: 'XL', image: createdProducts[1].images[0] }],
        totalAmount: 12999, status: 'pending', paymentMethod: 'cod', paymentStatus: 'pending'
      },
      {
        orderNumber: 'SM' + (Date.now() + 3) + '4',
        customer: { name: 'Meera Reddy', email: 'meera@example.com', phone: '9766554433', address: { street: '101 Silk Street', city: 'Hyderabad', state: 'Telangana', pincode: '500001' } },
        items: [{ product: createdProducts[4]._id, name: createdProducts[4].name, price: createdProducts[4].price, quantity: 1, size: 'M', image: createdProducts[4].images[0] }],
        totalAmount: 15999, status: 'shipped', paymentMethod: 'online', paymentStatus: 'paid', trackingNumber: 'SHIP889900'
      },
      {
        orderNumber: 'SM' + (Date.now() + 4) + '5',
        customer: { name: 'Rahul Varma', email: 'rahul@example.com', phone: '9544332211', address: { street: '202 Fashion Way', city: 'Bangalore', state: 'Karnataka', pincode: '560001' } },
        items: [{ product: createdProducts[5]._id, name: createdProducts[5].name, price: createdProducts[5].price, quantity: 2, size: 'L', image: createdProducts[5].images[0] }],
        totalAmount: 10998, status: 'delivered', paymentMethod: 'online', paymentStatus: 'paid'
      }
    ];

    await Order.insertMany(orderData);

    console.log('✨ Database Seeded with 10 Products and 5 Orders Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedData();
