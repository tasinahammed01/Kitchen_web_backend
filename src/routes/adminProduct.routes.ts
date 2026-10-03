import { Router, Request, Response, NextFunction } from 'express';
import {
  getAllAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from '../controllers/adminProductController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/auth';
import { csrfGuard } from '../middleware/csrfGuard';

const router = Router();

// SECURE BY DEFAULT: Apply authentication and role check at router level
// This prevents accidentally adding unprotected admin routes in the future
router.use(authenticate);
router.use(requireRole(['admin']));

// Apply Cache-Control no-store to all admin responses to prevent caching of private data
router.use((req: Request, res: Response, next: NextFunction) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Admin GET routes (read-only, no CSRF guard required)
router.get('/', getAllAdminProducts);
router.get('/:id', getAdminProductById);

// Admin mutation routes (require CSRF guard)
router.post('/', csrfGuard, createAdminProduct);
router.patch('/:id', csrfGuard, updateAdminProduct);
router.delete('/:id', csrfGuard, deleteAdminProduct);

export default router;
