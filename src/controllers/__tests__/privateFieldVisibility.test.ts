/**
 * PRIVATE FIELD VISIBILITY TEST - Phase 4
 *
 * This test verifies that private supplier/cost/fulfillment fields:
 * - Are NEVER exposed through public API endpoints
 * - Are ONLY exposed through admin API endpoints to authenticated admins
 *
 * Being an admin must NOT change the behavior of public API routes.
 * The route determines the contract.
 *
 * IMPORTANT: This test uses the ACTUAL production routers for both public and admin.
 * Tests will fail if authentication or authorization middleware is removed.
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

// Import ACTUAL production routers
import adminProductRouter from '../../routes/adminProduct.routes';
import productRouter from '../../routes/product.routes';

// Test app setup - use REAL production routers
const app = express();
app.use(express.json());
app.use(cookieParser());

// Mount the actual routers
app.use('/api/admin/products', adminProductRouter);
app.use('/api/products', productRouter);

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

describe('Private Field Visibility Test', () => {
  let adminToken: string;
  let testProductId: string;

  beforeEach(async () => {
    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('SecurePassword123', 12),
      role: 'admin',
      isActive: true,
    });
    const adminId = admin._id.toString();
    adminToken = signToken({ sub: adminId });

    // Create a test product with private fields
    const product = await Product.create({
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
      supplierSource: {
        platform: 'alibaba',
        supplierName: 'Private Supplier',
        productUrl: 'https://alibaba.com/private-product',
        supplierProductId: '123456',
        supplierVariantId: '789',
        sourceCountry: 'China',
        moq: 100,
        notes: 'Internal supplier notes',
      },
      supplierCost: {
        unitCost: 7.00,
        shippingCost: 3.00,
        currency: 'USD',
      },
      fulfillment: {
        mode: 'manual_dropship',
        supplierLeadTimeMinDays: 3,
        supplierLeadTimeMaxDays: 5,
      },
      internalNotes: 'This is confidential internal information',
    });
    testProductId = product._id.toString();
  });

  const PRIVATE_FIELDS = [
    'supplierSource',
    'supplierCost',
    'fulfillment',
    'internalNotes',
  ];

  describe('Public API Routes', () => {
    it('should NOT expose private fields on GET /api/products (anonymous)', async () => {
      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const product = response.body.data[0];
      for (const field of PRIVATE_FIELDS) {
        expect(field in product).toBe(false);
      }
    });

    it('should NOT expose private fields on GET /api/products/slug/:slug (anonymous)', async () => {
      const response = await request(app).get('/api/products/slug/test-product');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const product = response.body.data;
      for (const field of PRIVATE_FIELDS) {
        expect(field in product).toBe(false);
      }
    });

    it('should NOT expose private fields on GET /api/products (admin user)', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const product = response.body.data[0];
      for (const field of PRIVATE_FIELDS) {
        expect(field in product).toBe(false);
      }
    });

    it('should NOT expose private fields on GET /api/products/slug/:slug (admin user)', async () => {
      const response = await request(app)
        .get('/api/products/slug/test-product')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const product = response.body.data;
      for (const field of PRIVATE_FIELDS) {
        expect(field in product).toBe(false);
      }
    });
  });

  describe('Admin API Routes', () => {
    it('should expose private fields on GET /api/admin/products (admin)', async () => {
      const response = await request(app)
        .get('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const product = response.body.data[0];
      expect(product.supplierSource).toBeDefined();
      expect(product.supplierCost).toBeDefined();
      expect(product.fulfillment).toBeDefined();
      expect(product.internalNotes).toBeDefined();
    });

    it('should expose private fields on GET /api/admin/products/:id (admin)', async () => {
      const response = await request(app)
        .get(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const product = response.body.data;
      expect(product.supplierSource).toBeDefined();
      expect(product.supplierCost).toBeDefined();
      expect(product.fulfillment).toBeDefined();
      expect(product.internalNotes).toBeDefined();
    });
  });

  describe('Admin Serializer Future Field Test', () => {
    it('should NOT expose unknown future private field even to admin', async () => {
      // Add a future field directly to the database
      await Product.findByIdAndUpdate(testProductId, {
        $set: { futureSuperSecretSupplierField: 'MUST_NOT_LEAK' },
      });

      const response = await request(app)
        .get(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const product = response.body.data;
      expect('futureSuperSecretSupplierField' in product).toBe(false);
    });
  });
});
