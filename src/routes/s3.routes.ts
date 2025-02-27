import { Router } from 'express';
import { body } from 'express-validator';
import { signS3Upload } from '../controllers/s3.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import validateRequest from '../middleware/validation.middleware';

const router = Router();

// S3 sign endpoint (admin only)
router.post(
    '/sign',
    [
        verifyToken,
        requireRole('admin'),
        body('fileName').notEmpty().withMessage('fileName is required'),
        body('fileType').notEmpty().withMessage('fileType is required'),
    ],
    validateRequest,
    signS3Upload
);

export default router;
