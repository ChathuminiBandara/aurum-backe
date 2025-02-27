import { Router } from 'express';
import { body, param } from 'express-validator';
import { verifyToken } from '../middleware/auth.middleware';
import validateRequest from '../middleware/validation.middleware';
import { getCart, addToCart, updateCartItem, removeCartItem, checkoutCart } from '../controllers/cart.controller';

const router = Router();

// Get the current cart
router.get('/', verifyToken, getCart);

// Add an item to the cart
router.post(
    '/',
    [
        verifyToken,
        body('productId').isInt().withMessage('Product ID must be an integer'),
        body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be greater than 0'),
    ],
    validateRequest,
    addToCart
);

// Update a cart item's quantity
router.put(
    '/:itemId',
    [
        verifyToken,
        param('itemId').isInt().withMessage('Item ID must be an integer'),
        body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be greater than 0'),
    ],
    validateRequest,
    updateCartItem
);

// Remove an item from the cart
router.delete(
    '/:itemId',
    [verifyToken, param('itemId').isInt().withMessage('Item ID must be an integer')],
    validateRequest,
    removeCartItem
);

// Checkout the cart
router.post('/checkout', verifyToken, checkoutCart);

export default router;
