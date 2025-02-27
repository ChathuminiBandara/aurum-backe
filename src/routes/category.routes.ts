import { Router } from 'express';
import {
    getCategories,
    getProductsByCategory,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/category.controller';
import { body, param } from 'express-validator';
import validateRequest from '../middleware/validation.middleware';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Create a new category (admin only)
router.post(
    '/',
    [
        verifyToken,
        requireRole('admin'),
        body('name').notEmpty().withMessage('Name is required'),
        body('description').optional(),
    ],
    validateRequest,
    createCategory
);

// Get all categories
router.get('/', getCategories);

// Get products by category
router.get('/:categoryId/products', [
    param('categoryId').isInt().withMessage('Category ID must be an integer'),
], validateRequest, getProductsByCategory);

// Update a category (admin only)
router.put(
    '/:categoryId',
    [
        verifyToken,
        requireRole('admin'),
        param('categoryId').isInt().withMessage('Category ID must be an integer'),
        body('name').notEmpty().withMessage('Name is required'),
        body('description').optional(),
    ],
    validateRequest,
    updateCategory
);

// Delete a category (admin only)
router.delete(
    '/:categoryId',
    [
        verifyToken,
        requireRole('admin'),
        param('categoryId').isInt().withMessage('Category ID must be an integer'),
    ],
    validateRequest,
    deleteCategory
);

export default router;
