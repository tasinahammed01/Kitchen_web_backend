import { Router } from 'express';
import {
  getAllProducts,
  getProductBySlug,
  getProductsByCategory,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
} from '../controllers/productController';

const router = Router();

// Public routes - READ ONLY
router.get('/', getAllProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/category/:category', getProductsByCategory);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);

export default router;
