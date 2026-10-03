import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { toPublicProduct, toPublicProducts } from '../utils/productSerializer';
import { filterPublicProductFields } from '../utils/productFieldFilter';

// Get all products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    // Query-level defense: exclude private fields from database query
    const products = await Product.find({})
      .select('-supplierSource -supplierCost -fulfillment -internalNotes')
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      count: products.length,
      data: toPublicProducts(products),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: (error as Error).message,
    });
  }
};

// Get single product by slug
export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    // Query-level defense: exclude private fields from database query
    const product = await Product.findOne({ slug })
      .select('-supplierSource -supplierCost -fulfillment -internalNotes');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: toPublicProduct(product),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: (error as Error).message,
    });
  }
};

// Get products by category
export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    // Query-level defense: exclude private fields from database query
    const products = await Product.find({ category })
      .select('-supplierSource -supplierCost -fulfillment -internalNotes')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      data: toPublicProducts(products),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products by category',
      error: (error as Error).message,
    });
  }
};

// Get featured products
export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    // Query-level defense: exclude private fields from database query
    const products = await Product.find({ featured: true })
      .select('-supplierSource -supplierCost -fulfillment -internalNotes')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      data: toPublicProducts(products),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      error: (error as Error).message,
    });
  }
};

// Get new arrivals
export const getNewArrivals = async (req: Request, res: Response) => {
  try {
    // Query-level defense: exclude private fields from database query
    const products = await Product.find({ newArrival: true })
      .select('-supplierSource -supplierCost -fulfillment -internalNotes')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      data: toPublicProducts(products),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching new arrivals',
      error: (error as Error).message,
    });
  }
};

// Get best sellers
export const getBestSellers = async (req: Request, res: Response) => {
  try {
    // Query-level defense: exclude private fields from database query
    const products = await Product.find({ bestSeller: true })
      .select('-supplierSource -supplierCost -fulfillment -internalNotes')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      data: toPublicProducts(products),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching best sellers',
      error: (error as Error).message,
    });
  }
};

// Create product (admin)
// SECURITY NOTE: This endpoint is currently unprotected (no authentication).
// Mass-assignment protection is applied to prevent modification of private supplier fields.
// Full admin authorization will be implemented in a later phase.
export const createProduct = async (req: Request, res: Response) => {
  try {
    // SECURITY: Use explicit allowlist to prevent mass-assignment attacks
    // This rejects MongoDB operators ($set, $unset, etc.), dotted paths, and unknown fields
    const sanitized = filterPublicProductFields(req.body);

    // Check if any non-allowed fields were present
    const sanitizedKeys = Object.keys(sanitized);
    const requestKeys = Object.keys(req.body);
    const rejectedKeys = requestKeys.filter(key => !sanitizedKeys.includes(key));

    if (rejectedKeys.length > 0) {
      console.warn(`Attempted to create product with rejected fields: ${rejectedKeys.join(', ')}`);
    }

    const product = await Product.create(sanitized);

    res.status(201).json({
      success: true,
      data: toPublicProduct(product),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating product',
      error: (error as Error).message,
    });
  }
};

// Update product (admin)
// SECURITY NOTE: This endpoint is currently unprotected (no authentication).
// Mass-assignment protection is applied to prevent modification of private supplier fields.
// Full admin authorization will be implemented in a later phase.
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // SECURITY: Use explicit allowlist to prevent mass-assignment attacks
    // This rejects MongoDB operators ($set, $unset, etc.), dotted paths, and unknown fields
    const sanitized = filterPublicProductFields(req.body);

    // Check if any non-allowed fields were present
    const sanitizedKeys = Object.keys(sanitized);
    const requestKeys = Object.keys(req.body);
    const rejectedKeys = requestKeys.filter(key => !sanitizedKeys.includes(key));

    if (rejectedKeys.length > 0) {
      console.warn(`Attempted to update product with rejected fields: ${rejectedKeys.join(', ')}`);
    }

    // Use findById + save for full Mongoose document validation
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Apply sanitized allowed values
    Object.assign(product, sanitized);

    // Save to trigger full validation including cross-field validators
    await product.save();

    res.json({
      success: true,
      data: toPublicProduct(product),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating product',
      error: (error as Error).message,
    });
  }
};

// Delete product (admin)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error deleting product',
      error: (error as Error).message,
    });
  }
};
