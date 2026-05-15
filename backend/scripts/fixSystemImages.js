import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Product from '../models/Product.js';
import NewArrival from '../models/NewArrival.js';
import HeroCarousel from '../models/HeroCarousel.js';

const fixImages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const products = await Product.find({ isActive: true }).limit(5);
    if (products.length < 3) {
      console.log('❌ Not enough products to fix images. Please seed products first.');
      process.exit(1);
    }

    // Fix New Arrivals
    console.log('🔧 Fixing New Arrivals images...');
    await NewArrival.deleteMany();
    await NewArrival.insertMany([
      { category: 'anarkali', image: products[0].images[0], title: 'Royal Anarkali', isActive: true },
      { category: 'palazzo', image: products[1].images[0], title: 'Velvet Palazzo', isActive: true },
      { category: 'straight-cut', image: products[2].images[0], title: 'Silk Straight Cut', isActive: true }
    ]);

    // Fix Carousel (Arches)
    console.log('🔧 Fixing Carousel images...');
    await HeroCarousel.deleteMany();
    await HeroCarousel.insertMany(products.map((p, i) => ({
      image: p.images[0],
      title: p.name,
      subtitle: p.category.toUpperCase(),
      order: i,
      isActive: true
    })));

    console.log('✨ System images fixed with product data!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing images:', error);
    process.exit(1);
  }
};

fixImages();
