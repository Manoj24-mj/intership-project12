/**
 * Standalone Product Marketplace Seed Script
 * Run with: npm run seed:products
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ProductSchema, IProduct } from '../server/models/schemas.ts';
import { SEED_PRODUCTS } from '../server/seeds/sampleData.ts';

dotenv.config();

async function seedProducts() {
  const mongoUri = process.env.MONGODB_URI;

  console.log(`Starting seed of ${SEED_PRODUCTS.length} realistic art supplies...`);

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      const ProductModel = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

      const count = await ProductModel.countDocuments();
      if (count > 0) {
        console.log(`MongoDB Atlas already contains ${count} products.`);
      } else {
        await ProductModel.insertMany(SEED_PRODUCTS);
        console.log(`Successfully seeded ${SEED_PRODUCTS.length} listings into MongoDB Atlas!`);
      }
      process.exit(0);
    } catch (err) {
      console.error('Error connecting to MongoDB Atlas:', err);
      process.exit(1);
    }
  } else {
    console.log(`Embedded local store contains ${SEED_PRODUCTS.length} pre-seeded items:`);
    SEED_PRODUCTS.forEach((p, idx) => {
      console.log(`  ${idx + 1}. [${p.category}] ${p.title} - ₹${p.price} (${p.condition})`);
    });
    process.exit(0);
  }
}

seedProducts();
