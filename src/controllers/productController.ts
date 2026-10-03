import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { toPublicProduct, toPublicProducts } from '../utils/productSerializer';

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
    console.error('[Public] Error fetching products:', (error as Error).message);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch products.',
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
    console.error('[Public] Error fetching product:', (error as Error).message);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch product.',
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
    console.error('[Public] Error fetching products by category:', (error as Error).message);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch products by category.',
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
    console.error('[Public] Error fetching featured products:', (error as Error).message);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch featured products.',
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
    console.error('[Public] Error fetching new arrivals:', (error as Error).message);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch new arrivals.',
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
    console.error('[Public] Error fetching best sellers:', (error as Error).message);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch best sellers.',
    });
  }
};


