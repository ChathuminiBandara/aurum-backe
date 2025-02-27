import { Router } from 'express';
import { body } from 'express-validator';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import validateRequest from '../middleware/validation.middleware';
import { createCheckoutSession, getOrders, getAllOrders, updateOrderStatus } from '../controllers/order.controller';

const router = Router();

// Initiate Stripe Checkout Session (client only)
router.post('/checkout', [
    verifyToken,
    body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    body('items.*.productId').isInt().withMessage('Product ID must be an integer'),
    body('items.*.quantity').isInt({ gt: 0 }).withMessage('Quantity must be greater than 0'),
], validateRequest, createCheckoutSession);

// Get orders for authenticated customer
router.get('/', verifyToken, getOrders);

// Admin-only: Get all orders
router.get('/all', verifyToken, requireRole('admin'), getAllOrders);

// Admin-only: Update order status (e.g., mark as "paid")
router.put('/status', [
    verifyToken,
    requireRole('admin'),
    body('orderId').isInt().withMessage('orderId must be an integer'),
    body('status').notEmpty().withMessage('status is required'),
], validateRequest, updateOrderStatus);

export default router;
