import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import connectDB from './config/db.js';

dotenv.config();

const seedRoyalMidnight = async () => {
  try {
    await connectDB();
    
    const existing = await Product.findOne({ name: 'Royal Midnight Anarkali' });
    if (existing) {
      console.log('Product already exists');
      process.exit(0);
    }

    const product = new Product({
      name: 'Royal Midnight Anarkali',
      description: 'A masterpiece of deep navy velvet adorned with intricate silver Zardosi embroidery. This floor-length silhouette features a regal flare and comes with a sheer georgette dupatta.',
      category: 'anarkali',
      price: 18500,
      images: [
        'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=1200'
      ],
      stock: 5,
      sizeStock: [
        { size: 'S', quantity: 2 },
        { size: 'M', quantity: 2 },
        { size: 'L', quantity: 1 }
      ],
      isActive: true,
      inCollection: true,
      featured: true
    });

    await product.save();
    console.log('Royal Midnight Anarkali seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding:', error);
    process.exit(1);
  }
};

seedRoyalMidnight();
