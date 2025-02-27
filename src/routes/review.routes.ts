import { Router } from 'express';
import { body, param } from 'express-validator';
import { createReview, updateReview, deleteReview, getReviewsByProduct } from '../controllers/review.controller';
import { verifyToken } from '../middleware/auth.middleware';
import validateRequest from '../middleware/validation.middleware';

const router = Router();

// Create a review (authenticated user)
router.post(
    '/',
    [
        verifyToken,
        body('productId').isInt().withMessage('Product ID must be an integer'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('reviewText').optional().isString(),
    ],
    validateRequest,
    createReview
);

// Update a review
router.put(
    '/:reviewId',
    [
        verifyToken,
        param('reviewId').isInt().withMessage('Review ID must be an integer'),
        body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('reviewText').optional().isString(),
    ],
    validateRequest,
    updateReview
);

// Delete a review
router.delete(
    '/:reviewId',
    [
        verifyToken,
        param('reviewId').isInt().withMessage('Review ID must be an integer'),
    ],
    validateRequest,
    deleteReview
);

// Get reviews for a product
router.get(
    '/product/:productId',
    [param('productId').isInt().withMessage('Product ID must be an integer')],
    validateRequest,
    getReviewsByProduct
);

export default router;
