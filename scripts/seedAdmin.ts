/**
 * Standalone Administrator Account Seed Script
 * Run with: npm run seed:admin
 */

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { UserSchema, IUser } from '../server/models/schemas.ts';

dotenv.config();

async function seedAdmin() {
  const mongoUri = process.env.MONGODB_URI;
  const adminName = process.env.ADMIN_NAME || 'ArtLoop Administrator';
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@artloop.in').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  console.log('Seeding ArtLoop Administrator...');
  console.log(`Email: ${adminEmail}`);

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

      const existing = await UserModel.findOne({ email: adminEmail });
      if (existing) {
        console.log('Admin account already exists in MongoDB Atlas.');
        process.exit(0);
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);

      await UserModel.create({
        name: adminName,
        email: adminEmail,
        passwordHash,
        location: 'Bengaluru Central',
        role: 'admin',
        accountStatus: 'active',
      });

      console.log('Admin account successfully provisioned in MongoDB Atlas.');
      process.exit(0);
    } catch (err) {
      console.error('Error connecting to MongoDB Atlas:', err);
      process.exit(1);
    }
  } else {
    console.log('No MONGODB_URI detected. Seed data is already embedded in local runtime store.');
    console.log(`Default local admin available: ${adminEmail} / ${adminPassword}`);
    process.exit(0);
  }
}

seedAdmin();
