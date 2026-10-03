/**
 * ADMIN PRODUCT AUTHORIZATION TESTS - Phase 4
 *
 * These tests verify the authorization boundary for admin product operations.
 * They test:
 * - Anonymous requests → 401
 * - Customer requests → 403
 * - Admin requests → 200 (or appropriate success status)
 *
 * IMPORTANT: These tests use the ACTUAL production router and middleware.
 * Tests will fail if authentication, role authorization, or CSRF middleware is removed.
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

// Import ACTUAL production router and middleware
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
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear database before each test
  await User.deleteMany({});
  await Product.deleteMany({});
});

describe('Admin Product Authorization Tests', () => {
  let customerToken: string;
  let adminToken: string;
  let customerId: string;
  let adminId: string;
  let testProductId: string;

  beforeEach(async () => {
    // Create customer user
    const customer = await User.create({
      name: 'Customer User',
      email: 'customer@example.com',
      passwordHash: await bcrypt.hash('SecurePassword123', 12),
      role: 'customer',
      isActive: true,
    });
    customerId = customer._id.toString();
    customerToken = signToken({ sub: customerId });

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('SecurePassword123', 12),
      role: 'admin',
      isActive: true,
    });
    adminId = admin._id.toString();
    adminToken = signToken({ sub: adminId });

    // Create a test product
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
      internalNotes: 'Confidential internal notes',
    });
    testProductId = product._id.toString();
  });

  describe('GET /api/admin/products (Collection)', () => {
    it('should return 401 for anonymous request', async () => {
      const response = await request(app).get('/api/admin/products');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for customer request', async () => {
      const response = await request(app)
        .get('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 200 for admin request', async () => {
      const response = await request(app)
        .get('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify private fields are present
      const product = response.body.data[0];
      expect(product.supplierSource).toBeDefined();
      expect(product.supplierCost).toBeDefined();
      expect(product.fulfillment).toBeDefined();
      expect(product.internalNotes).toBeDefined();
    });
  });

  describe('GET /api/admin/products/:id (Detail)', () => {
    it('should return 401 for anonymous request', async () => {
      const response = await request(app).get(`/api/admin/products/${testProductId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for customer request', async () => {
      const response = await request(app)
        .get(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 200 for admin request', async () => {
      const response = await request(app)
        .get(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data._id).toBe(testProductId);

      // Verify private fields are present
      expect(response.body.data.supplierSource).toBeDefined();
      expect(response.body.data.supplierCost).toBeDefined();
      expect(response.body.data.fulfillment).toBeDefined();
      expect(response.body.data.internalNotes).toBeDefined();
    });

    it('should return 404 for nonexistent product', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/admin/products/${fakeId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid product ID', async () => {
      const response = await request(app)
        .get('/api/admin/products/invalid-id')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/admin/products (Create)', () => {
    const newProduct = {
      slug: 'new-product',
      name: 'New Product',
      description: 'New description',
      shortDescription: 'New short description',
      price: 39.99,
      rating: 4.0,
      reviewCount: 0,
      images: ['https://example.com/new-image.jpg'],
      category: 'Kitchen Tools',
      brand: 'NewBrand',
      stock: 100,
      tags: ['new'],
      featured: false,
      newArrival: true,
      bestSeller: false,
      colors: [{ name: 'Blue', hex: '#0000FF' }],
      sizes: [{ name: 'Medium', available: true }],
      supplierSource: {
        platform: 'alibaba' as const,
        supplierName: 'New Supplier',
        productUrl: 'https://alibaba.com/new-product',
      },
      supplierCost: {
        unitCost: 10.00,
        shippingCost: 4.00,
        currency: 'USD',
      },
      fulfillment: {
        mode: 'manual_dropship' as const,
        supplierLeadTimeMinDays: 5,
        supplierLeadTimeMaxDays: 7,
      },
      internalNotes: 'New internal notes',
    };

    it('should return 401 for anonymous request', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .send(newProduct);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for customer request', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${customerToken}`)
        .send(newProduct);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for admin request without CSRF header', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .send(newProduct);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 201 for admin request with CSRF header', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send(newProduct);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.slug).toBe('new-product');

      // Verify private fields were saved
      const createdProduct = await Product.findOne({ slug: 'new-product' });
      expect(createdProduct?.supplierSource).toBeDefined();
      expect(createdProduct?.supplierCost).toBeDefined();
      expect(createdProduct?.fulfillment).toBeDefined();
      expect(createdProduct?.internalNotes).toBe('New internal notes');
    });
  });

  describe('PATCH /api/admin/products/:id (Update)', () => {
    const updateData = {
      price: 49.99,
      supplierCost: {
        unitCost: 12.00,
        shippingCost: 5.00,
        currency: 'USD',
      },
    };

    it('should return 401 for anonymous request', async () => {
      const response = await request(app)
        .patch(`/api/admin/products/${testProductId}`)
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for customer request', async () => {
      const response = await request(app)
        .patch(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${customerToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for admin request without CSRF header', async () => {
      const response = await request(app)
        .patch(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 200 for admin request with CSRF header', async () => {
      const response = await request(app)
        .patch(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.price).toBe(49.99);

      // Verify private fields were updated
      const updatedProduct = await Product.findById(testProductId);
      expect(updatedProduct?.price).toBe(49.99);
      expect(updatedProduct?.supplierCost?.unitCost).toBe(12.00);
      expect(updatedProduct?.supplierCost?.shippingCost).toBe(5.00);
    });
  });

  describe('DELETE /api/admin/products/:id (Delete)', () => {
    it('should return 401 for anonymous request', async () => {
      const response = await request(app).delete(`/api/admin/products/${testProductId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for customer request', async () => {
      const response = await request(app)
        .delete(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for admin request without CSRF header', async () => {
      const response = await request(app)
        .delete(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 200 for admin request with CSRF header', async () => {
      const response = await request(app)
        .delete(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify product was deleted
      const deletedProduct = await Product.findById(testProductId);
      expect(deletedProduct).toBeNull();
    });
  });
});
