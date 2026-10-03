/**
 * NESTED PATCH MERGE SEMANTICS TESTS - Phase 4
 *
 * These tests verify that nested PATCH operations use MERGE semantics:
 * - Partial updates preserve existing omitted values
 * - Validation still runs after merge
 * - Clearing semantics work for optional fields
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

describe('Nested PATCH Merge Semantics', () => {
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

    // Create a test product with full nested objects
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
      internalNotes: 'Confidential internal notes',
    });
    testProductId = product._id.toString();
  });

  describe('supplierCost partial update', () => {
    it('should preserve shippingCost and currency when updating only unitCost', async () => {
      const response = await request(app)
        .patch(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          supplierCost: {
            unitCost: 8.00,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updatedProduct = await Product.findById(testProductId);
      expect(updatedProduct?.supplierCost?.unitCost).toBe(8.00);
      expect(updatedProduct?.supplierCost?.shippingCost).toBe(3.00); // Preserved
      expect(updatedProduct?.supplierCost?.currency).toBe('USD'); // Preserved
    });

    it('should preserve unitCost and currency when updating only shippingCost', async () => {
      const response = await request(app)
        .patch(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          supplierCost: {
            shippingCost: 4.00,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updatedProduct = await Product.findById(testProductId);
      expect(updatedProduct?.supplierCost?.unitCost).toBe(7.00); // Preserved
      expect(updatedProduct?.supplierCost?.shippingCost).toBe(4.00);
      expect(updatedProduct?.supplierCost?.currency).toBe('USD'); // Preserved
    });
  });

  describe('supplierSource partial update', () => {
    it('should preserve productUrl and productId when updating only supplierName', async () => {
      const response = await request(app)
        .patch(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          supplierSource: {
            supplierName: 'Updated Supplier Name',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updatedProduct = await Product.findById(testProductId);
      expect(updatedProduct?.supplierSource?.supplierName).toBe('Updated Supplier Name');
      expect(updatedProduct?.supplierSource?.productUrl).toBe('https://alibaba.com/private-product'); // Preserved
      expect(updatedProduct?.supplierSource?.supplierProductId).toBe('123456'); // Preserved
    });
  });

  describe('fulfillment partial update', () => {
    it('should preserve mode and maxDays when updating only minDays', async () => {
      const response = await request(app)
        .patch(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          fulfillment: {
            supplierLeadTimeMinDays: 4,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updatedProduct = await Product.findById(testProductId);
      expect(updatedProduct?.fulfillment?.mode).toBe('manual_dropship'); // Preserved
      expect(updatedProduct?.fulfillment?.supplierLeadTimeMinDays).toBe(4);
      expect(updatedProduct?.fulfillment?.supplierLeadTimeMaxDays).toBe(5); // Preserved
    });

    it('should preserve mode and minDays when updating only maxDays', async () => {
      const response = await request(app)
        .patch(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          fulfillment: {
            supplierLeadTimeMaxDays: 7,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updatedProduct = await Product.findById(testProductId);
      expect(updatedProduct?.fulfillment?.mode).toBe('manual_dropship'); // Preserved
      expect(updatedProduct?.fulfillment?.supplierLeadTimeMinDays).toBe(3); // Preserved
      expect(updatedProduct?.fulfillment?.supplierLeadTimeMaxDays).toBe(7);
    });
  });

  describe('deliveryEstimate partial update', () => {
    it('should preserve maxDays when updating only minDays', async () => {
      const response = await request(app)
        .patch(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          deliveryEstimate: {
            minDays: 10,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updatedProduct = await Product.findById(testProductId);
      expect(updatedProduct?.deliveryEstimate?.minDays).toBe(10);
      expect(updatedProduct?.deliveryEstimate?.maxDays).toBe(15); // Preserved
    });

    it('should preserve minDays when updating only maxDays', async () => {
      const response = await request(app)
        .patch(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          deliveryEstimate: {
            maxDays: 20,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updatedProduct = await Product.findById(testProductId);
      expect(updatedProduct?.deliveryEstimate?.minDays).toBe(7); // Preserved
      expect(updatedProduct?.deliveryEstimate?.maxDays).toBe(20);
    });

    it('should validate minDays <= maxDays after merge', async () => {
      const response = await request(app)
        .patch(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          deliveryEstimate: {
            minDays: 25, // Invalid: greater than existing maxDays (15)
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      // Verify values were not changed
      const updatedProduct = await Product.findById(testProductId);
      expect(updatedProduct?.deliveryEstimate?.minDays).toBe(7);
      expect(updatedProduct?.deliveryEstimate?.maxDays).toBe(15);
    });
  });

  describe('Clearing semantics', () => {
    it('should allow clearing optional supplierVariantId with null', async () => {
      const response = await request(app)
        .patch(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          supplierSource: {
            supplierVariantId: null,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updatedProduct = await Product.findById(testProductId);
      expect(updatedProduct?.supplierSource?.supplierVariantId).toBeNull();
      expect(updatedProduct?.supplierSource?.supplierName).toBe('Private Supplier'); // Preserved
    });

    it('should allow clearing optional unitCost with null', async () => {
      const response = await request(app)
        .patch(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          supplierCost: {
            unitCost: null,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updatedProduct = await Product.findById(testProductId);
      expect(updatedProduct?.supplierCost?.unitCost).toBeNull();
      expect(updatedProduct?.supplierCost?.shippingCost).toBe(3.00); // Preserved
    });

    it('should not allow clearing required fulfillment.mode with null', async () => {
      const response = await request(app)
        .patch(`/api/admin/products/${testProductId}`)
        .set('Cookie', `${env.AUTH_COOKIE_NAME}=${adminToken}`)
        .set('X-CSRF-Guard', '1')
        .send({
          fulfillment: {
            mode: null,
          },
        });

      // Mode is required, but null is filtered out by the field filter since it's not clearable
      // The update should succeed but mode should remain unchanged
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updatedProduct = await Product.findById(testProductId);
      expect(updatedProduct?.fulfillment?.mode).toBe('manual_dropship'); // Unchanged
    });
  });
});
