import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/seemee';

async function cleanup() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: 'seemee' });
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('products');

    // Find products with sku: ""
    const result = await collection.updateMany(
      { sku: "" },
      { $unset: { sku: "" } }
    );

    console.log(`Cleaned up ${result.modifiedCount} products with empty SKUs.`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanup();
