import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import {getCustomerProfile, updateCustomerProfile, upsertCustomer} from '../controllers/customer.controller';
import { body } from 'express-validator';
import validateRequest from '../middleware/validation.middleware';

const router = Router();

// Get authenticated customer profile
router.get('/me', verifyToken, getCustomerProfile);

// Upsert customer endpoint (create or update based on Firebase UID)
router.post('/upsert', verifyToken, upsertCustomer);

// Update authenticated customer profile
router.put('/me', [
    verifyToken,
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email required'),
], validateRequest, updateCustomerProfile);

export default router;
