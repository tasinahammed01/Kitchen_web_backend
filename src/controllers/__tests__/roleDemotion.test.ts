/**
 * ROLE DEMOTION TEST - Phase 4
 *
 * This test verifies that when an admin's role is changed in the database,
 * their existing session immediately loses admin access.
 *
 * This proves role is loaded from current database state, not from JWT.
 *
 * IMPORTANT: This test uses the ACTUAL production router and middleware.
 * Tests will fail if authentication or role authorization middleware is removed.
 *
 * Run with: npm test
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../../models/User';
import { Product } from '../../models/Product';
import { signToken } from '../../utils/jwt';
import { env } from '../../config/env';

// Import ACTUAL production router
import adminProductRouter from '../../routes/adminProduct.routes';

// Test app setup - use REAL production router
const app = express();
app.use(express.json());
app.use(cookieParser());

// Mount the actual admin product router
app.use('/api/admin/products', adminProductRouter);

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: 'customer' | 'admin';
      };
    }
  }
}

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Product.deleteMany({});
});

describe('Role Demotion Test', () => {
  it('should revoke admin access when role changes from admin to customer', async () => {
    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('SecurePassword123', 12),
      role: 'admin',
      isActive: true,
    });
    const adminId = admin._id.toString();
    const adminToken = signToken({ sub: adminId });

    // Create a test product
    await Product.create({
      slug: 'test-product',
      name: 'Test Product',
      description: 'Test description',
      shortDescription: 'Test short description',
      price: 29.99,
      rating: 4.5,
      reviewCount: 100,
      images: ['https://example.com/image.jpg'],
      category: 'Kitchen Tools',
      brand: 'TestBrand',
      stock: 50,
      tags: ['test'],
      featured: true,
      newArrival: false,
      bestSeller: false,
      colors: [{ name: 'Red', hex: '#FF0000' }],
      sizes: [{ name: 'Large', available: true }],
      deliveryEstimate: { minDays: 7, maxDays: 15 },
    });

    // Verify admin can access admin API initially
    const initialResponse = await request(app)
      .get('/api/admin/products')
      .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`);

    expect(initialResponse.status).toBe(200);
    expect(initialResponse.body.success).toBe(true);

    // Change role from admin to customer in database
    await User.findByIdAndUpdate(adminId, { role: 'customer' });

    // Same cookie attempts admin API - should now be rejected
    const demotedResponse = await request(app)
      .get('/api/admin/products')
      .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`);

    expect(demotedResponse.status).toBe(403);
    expect(demotedResponse.body.success).toBe(false);
  });
});
