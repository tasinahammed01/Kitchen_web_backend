/**
 * PUBLIC MUTATION REMOVAL TEST - Phase 4
 *
 * This test verifies that public product mutation routes have been removed.
 * The public product API should be READ ONLY.
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
import productRouter from '../../routes/product.routes';

// Test app setup
const app = express();
app.use(express.json());
app.use(cookieParser());
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

describe('Public Mutation Removal Test', () => {
  let testProductId: string;

  beforeEach(async () => {
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

  describe('POST /api/products', () => {
    it('should return 404 (route not found)', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({
          slug: 'new-product',
          name: 'New Product',
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
        });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should return 404 (route not found)', async () => {
      const response = await request(app)
        .put(`/api/products/${testProductId}`)
        .send({
          price: 49.99,
        });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/products/:id', () => {
    it('should return 404 (route not found)', async () => {
      const response = await request(app)
        .patch(`/api/products/${testProductId}`)
        .send({
          price: 49.99,
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should return 404 (route not found)', async () => {
      const response = await request(app).delete(`/api/products/${testProductId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Public GET routes still work', () => {
    it('should allow GET /api/products', async () => {
      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow GET /api/products/slug/:slug', async () => {
      const response = await request(app).get('/api/products/slug/test-product');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow GET /api/products/category/:category', async () => {
      const response = await request(app).get('/api/products/category/Kitchen Tools');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow GET /api/products/featured', async () => {
      const response = await request(app).get('/api/products/featured');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow GET /api/products/new-arrivals', async () => {
      const response = await request(app).get('/api/products/new-arrivals');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow GET /api/products/best-sellers', async () => {
      const response = await request(app).get('/api/products/best-sellers');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
