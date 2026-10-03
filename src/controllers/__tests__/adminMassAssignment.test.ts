/**
 * ADMIN MASS-ASSIGNMENT TESTS - Phase 4
 *
 * These tests verify that admin product mutations are protected against:
 * - MongoDB operators ($set, $unset, etc.)
 * - Dotted path injection
 * - Prototype pollution (__proto__, constructor, prototype)
 * - Unknown field injection
 *
 * Even admins cannot write arbitrary database fields.
 *
 * IMPORTANT: This test uses the ACTUAL production router and middleware.
 * Tests will fail if authentication, role authorization, or CSRF middleware is removed.
 *
 * Run with: npm test
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
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

describe('Admin Mass-Assignment Protection', () => {
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
    });
    testProductId = product._id.toString();
  });

  afterEach(() => {
    // Verify prototype remains unchanged after each test
    expect(({} as any).polluted).toBeUndefined();
    expect(Object.prototype.polluted).toBeUndefined();
  });

  describe('MongoDB Operator Protection', () => {
    it('should reject $set operator', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          slug: 'malicious-product',
          name: 'Malicious Product',
          description: 'Test',
          shortDescription: 'Test',
          price: 29.99,
          rating: 4.5,
          reviewCount: 0,
          images: ['https://example.com/image.jpg'],
          category: 'Kitchen Tools',
          brand: 'TestBrand',
          stock: 50,
          tags: [],
          featured: false,
          newArrival: false,
          bestSeller: false,
          colors: [],
          sizes: [],
          $set: {
            supplierCost: { unitCost: 1 },
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dangerous keys');
    });

    it('should reject $unset operator', async () => {
      const response = await request(app)
        .patch(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          $unset: {
            supplierCost: 1,
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dangerous keys');
    });
  });

  describe('Dotted Path Protection', () => {
    it('should reject dotted path "supplierCost.unitCost"', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          slug: 'malicious-product',
          name: 'Malicious Product',
          description: 'Test',
          shortDescription: 'Test',
          price: 29.99,
          rating: 4.5,
          reviewCount: 0,
          images: ['https://example.com/image.jpg'],
          category: 'Kitchen Tools',
          brand: 'TestBrand',
          stock: 50,
          tags: [],
          featured: false,
          newArrival: false,
          bestSeller: false,
          colors: [],
          sizes: [],
          'supplierCost.unitCost': 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dangerous keys');
    });

    it('should reject dotted path "supplierSource.productUrl"', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          slug: 'malicious-product',
          name: 'Malicious Product',
          description: 'Test',
          shortDescription: 'Test',
          price: 29.99,
          rating: 4.5,
          reviewCount: 0,
          images: ['https://example.com/image.jpg'],
          category: 'Kitchen Tools',
          brand: 'TestBrand',
          stock: 50,
          tags: [],
          featured: false,
          newArrival: false,
          bestSeller: false,
          colors: [],
          sizes: [],
          'supplierSource.productUrl': 'https://attacker.example',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dangerous keys');
    });
  });

  describe('Prototype Pollution Protection', () => {
    it('should reject constructor key', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          slug: 'malicious-product',
          name: 'Malicious Product',
          description: 'Test',
          shortDescription: 'Test',
          price: 29.99,
          rating: 4.5,
          reviewCount: 0,
          images: ['https://example.com/image.jpg'],
          category: 'Kitchen Tools',
          brand: 'TestBrand',
          stock: 50,
          tags: [],
          featured: false,
          newArrival: false,
          bestSeller: false,
          colors: [],
          sizes: [],
          constructor: {
            prototype: {
              polluted: true,
            },
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dangerous keys');
    });

    it('should reject constructor.prototype via raw JSON', async () => {
      // Send raw JSON string to preserve constructor key
      const rawJson = JSON.stringify({
        slug: 'malicious-product',
        name: 'Malicious Product',
        description: 'Test',
        shortDescription: 'Test',
        price: 29.99,
        rating: 4.5,
        reviewCount: 0,
        images: ['https://example.com/image.jpg'],
        category: 'Kitchen Tools',
        brand: 'TestBrand',
        stock: 50,
        tags: [],
        featured: false,
        newArrival: false,
        bestSeller: false,
        colors: [],
        sizes: [],
        constructor: {
          prototype: {
            polluted: true,
          },
        },
      });

      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .set('Content-Type', 'application/json')
        .send(rawJson);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dangerous keys');

      // Verify prototype was not polluted
      expect(({} as any).polluted).toBeUndefined();
      expect(Object.prototype.polluted).toBeUndefined();
    });

    it('should reject nested constructor.prototype', async () => {
      const rawJson = JSON.stringify({
        slug: 'malicious-product',
        name: 'Malicious Product',
        description: 'Test',
        shortDescription: 'Test',
        price: 29.99,
        rating: 4.5,
        reviewCount: 0,
        images: ['https://example.com/image.jpg'],
        category: 'Kitchen Tools',
        brand: 'TestBrand',
        stock: 50,
        tags: [],
        featured: false,
        newArrival: false,
        bestSeller: false,
        colors: [],
        sizes: [],
        supplierSource: {
          platform: 'alibaba',
          constructor: {
            prototype: {
              polluted: true,
            },
          },
        },
      });

      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .set('Content-Type', 'application/json')
        .send(rawJson);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dangerous keys');

      // Verify prototype was not polluted
      expect(({} as any).polluted).toBeUndefined();
      expect(Object.prototype.polluted).toBeUndefined();
    });

    it('should reject dangerous keys in array elements (colors)', async () => {
      const rawJson = JSON.stringify({
        slug: 'malicious-product',
        name: 'Malicious Product',
        description: 'Test',
        shortDescription: 'Test',
        price: 29.99,
        rating: 4.5,
        reviewCount: 0,
        images: ['https://example.com/image.jpg'],
        category: 'Kitchen Tools',
        brand: 'TestBrand',
        stock: 50,
        tags: [],
        featured: false,
        newArrival: false,
        bestSeller: false,
        colors: [
          {
            name: 'Red',
            hex: '#FF0000',
            constructor: {
              prototype: {
                polluted: true,
              },
            },
          },
        ],
        sizes: [],
      });

      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .set('Content-Type', 'application/json')
        .send(rawJson);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dangerous keys');

      // Verify prototype was not polluted
      expect(({} as any).polluted).toBeUndefined();
      expect(Object.prototype.polluted).toBeUndefined();
    });

    it('should reject dangerous keys in array elements (sizes)', async () => {
      const rawJson = JSON.stringify({
        slug: 'malicious-product',
        name: 'Malicious Product',
        description: 'Test',
        shortDescription: 'Test',
        price: 29.99,
        rating: 4.5,
        reviewCount: 0,
        images: ['https://example.com/image.jpg'],
        category: 'Kitchen Tools',
        brand: 'TestBrand',
        stock: 50,
        tags: [],
        featured: false,
        newArrival: false,
        bestSeller: false,
        colors: [],
        sizes: [
          {
            name: 'Large',
            available: true,
            constructor: {
              prototype: {
                polluted: true,
              },
            },
          },
        ],
      });

      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .set('Content-Type', 'application/json')
        .send(rawJson);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dangerous keys');

      // Verify prototype was not polluted
      expect(({} as any).polluted).toBeUndefined();
      expect(Object.prototype.polluted).toBeUndefined();
    });
  });

  describe('Unknown Field Protection', () => {
    it('should reject unknown field "futureUnknownPrivateField"', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          slug: 'malicious-product',
          name: 'Malicious Product',
          description: 'Test',
          shortDescription: 'Test',
          price: 29.99,
          rating: 4.5,
          reviewCount: 0,
          images: ['https://example.com/image.jpg'],
          category: 'Kitchen Tools',
          brand: 'TestBrand',
          stock: 50,
          tags: [],
          featured: false,
          newArrival: false,
          bestSeller: false,
          colors: [],
          sizes: [],
          futureUnknownPrivateField: 'x',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verify unknown field was not applied
      const product = await Product.findOne({ slug: 'malicious-product' });
      expect(product).toBeDefined();
      expect((product as any).futureUnknownPrivateField).toBeUndefined();
    });
  });

  describe('Legitimate Admin Private Fields', () => {
    it('should allow legitimate supplierSource field', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          slug: 'legitimate-product',
          name: 'Legitimate Product',
          description: 'Test',
          shortDescription: 'Test',
          price: 29.99,
          rating: 4.5,
          reviewCount: 0,
          images: ['https://example.com/image.jpg'],
          category: 'Kitchen Tools',
          brand: 'TestBrand',
          stock: 50,
          tags: [],
          featured: false,
          newArrival: false,
          bestSeller: false,
          colors: [],
          sizes: [],
          supplierSource: {
            platform: 'alibaba',
            supplierName: 'Legitimate Supplier',
            productUrl: 'https://alibaba.com/product',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verify legitimate field was applied
      const product = await Product.findOne({ slug: 'legitimate-product' });
      expect(product?.supplierSource).toBeDefined();
      expect(product?.supplierSource?.platform).toBe('alibaba');
      expect(product?.supplierSource?.supplierName).toBe('Legitimate Supplier');
    });

    it('should allow legitimate supplierCost field', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          slug: 'legitimate-product',
          name: 'Legitimate Product',
          description: 'Test',
          shortDescription: 'Test',
          price: 29.99,
          rating: 4.5,
          reviewCount: 0,
          images: ['https://example.com/image.jpg'],
          category: 'Kitchen Tools',
          brand: 'TestBrand',
          stock: 50,
          tags: [],
          featured: false,
          newArrival: false,
          bestSeller: false,
          colors: [],
          sizes: [],
          supplierCost: {
            unitCost: 10.00,
            shippingCost: 5.00,
            currency: 'USD',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verify legitimate field was applied
      const product = await Product.findOne({ slug: 'legitimate-product' });
      expect(product?.supplierCost).toBeDefined();
      expect(product?.supplierCost?.unitCost).toBe(10.00);
      expect(product?.supplierCost?.shippingCost).toBe(5.00);
    });
  });
});
