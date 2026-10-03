/**
 * NESTED DANGEROUS-KEY PROTECTION TESTS - Phase 4
 *
 * These tests verify that dangerous keys are detected recursively in:
 * - Nested objects (supplierSource, supplierCost, fulfillment, deliveryEstimate)
 * - Array elements (colors[], sizes[])
 *
 * IMPORTANT: This test uses the ACTUAL production router and middleware.
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

describe('Nested Dangerous-Key Protection', () => {
  let adminToken: string;

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
  });

  describe('Top-level operators', () => {
    it('should reject $set operator at top level', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          slug: 'test-product',
          name: 'Test Product',
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
          $set: { supplierCost: { unitCost: 1 } },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dangerous keys');
    });

    it('should reject $unset operator at top level', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          slug: 'test-product',
          name: 'Test Product',
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
          $unset: { supplierCost: 1 },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dangerous keys');
    });
  });

  describe('Nested operators in supplierSource', () => {
    it('should reject $set operator within supplierSource', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          slug: 'test-product',
          name: 'Test Product',
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
            $set: { supplierName: 'Attacker' },
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dangerous keys');
    });
  });

  describe('Nested operators in supplierCost', () => {
    it('should reject $set operator within supplierCost', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          slug: 'test-product',
          name: 'Test Product',
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
            $set: { shippingCost: 1 },
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dangerous keys');
    });
  });

  describe('Nested operators in fulfillment', () => {
    it('should reject $set operator within fulfillment', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          slug: 'test-product',
          name: 'Test Product',
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
          fulfillment: {
            mode: 'manual_dropship',
            $set: { supplierLeadTimeMinDays: 1 },
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dangerous keys');
    });
  });

  describe('Nested operators in deliveryEstimate', () => {
    it('should reject $set operator within deliveryEstimate', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          slug: 'test-product',
          name: 'Test Product',
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
          deliveryEstimate: {
            minDays: 7,
            $set: { maxDays: 1 },
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dangerous keys');
    });
  });

  describe('Dotted keys in nested objects', () => {
    it('should reject dotted key within supplierSource', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          slug: 'test-product',
          name: 'Test Product',
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
            'product.url': 'https://attacker.example',
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dangerous keys');
    });
  });

  describe('Prototype pollution in nested objects', () => {
    it('should reject constructor within supplierCost', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          slug: 'test-product',
          name: 'Test Product',
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
            constructor: { prototype: { polluted: true } },
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dangerous keys');
    });
  });

  describe('Dangerous keys in array elements', () => {
    it('should reject $set within colors array', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          slug: 'test-product',
          name: 'Test Product',
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
            { name: 'Red', hex: '#FF0000', $set: { polluted: true } },
          ],
          sizes: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dangerous keys');
    });
  });

  describe('Legitimate nested values are allowed', () => {
    it('should allow legitimate nested supplierSource values', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          slug: 'test-product',
          name: 'Test Product',
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
    });

    it('should allow legitimate nested supplierCost values', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          slug: 'test-product',
          name: 'Test Product',
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
    });
  });
});
