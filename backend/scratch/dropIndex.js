import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const dropHeroIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Use the model name to get the collection
    const collection = mongoose.connection.collection('herocarousels');
    
    // List indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));
    
    const orderIndex = indexes.find(idx => idx.key.order === 1);
    if (orderIndex) {
      console.log('Found order index, dropping...');
      await collection.dropIndex(orderIndex.name);
      console.log('Index dropped successfully');
    } else {
      console.log('Order index not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

dropHeroIndex();
