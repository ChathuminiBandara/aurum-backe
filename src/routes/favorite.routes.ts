import { Router } from 'express';
import { addFavorite, removeFavorite, getFavorites } from '../controllers/favorite.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { body, param } from 'express-validator';
import validateRequest from '../middleware/validation.middleware';

const router = Router();

router.get('/', verifyToken, getFavorites);
router.post(
    '/',
    [
        verifyToken,
        body('productId').isInt().withMessage('Product ID must be an integer')
    ],
    validateRequest,
    addFavorite
);
router.delete(
    '/:favoriteId',
    [
        verifyToken,
        param('favoriteId').isInt().withMessage('Favorite ID must be an integer')
    ],
    validateRequest,
    removeFavorite
);

export default router;
