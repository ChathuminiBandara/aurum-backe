import { Router } from 'express';
import { body, param } from 'express-validator';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller';
import validateRequest from '../middleware/validation.middleware';

const router = Router();

// Public endpoints: list and view products
router.get('/', getProducts);
router.get('/:id', [
    param('id').isInt().withMessage('Product ID must be an integer')
], validateRequest, getProductById);

// Admin-only endpoints for product management
router.post('/', [
    verifyToken,
    requireRole('admin'),
    body('name').notEmpty().withMessage('Name is required'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
    body('imageUrl').notEmpty().withMessage('Valid image URL is required'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
], validateRequest, createProduct);

router.put('/:id', [
    verifyToken,
    requireRole('admin'),
    param('id').isInt().withMessage('Product ID must be an integer'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
    body('imageUrl').optional().notEmpty().withMessage('Valid image URL is required'),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
], validateRequest, updateProduct);

router.delete('/:id', [
    verifyToken,
    requireRole('admin'),
    param('id').isInt().withMessage('Product ID must be an integer')
], validateRequest, deleteProduct);

export default router;
