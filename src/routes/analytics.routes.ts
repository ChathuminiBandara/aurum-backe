import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import { getAnalytics } from '../controllers/analytics.controller';

const router = Router();

router.get('/', verifyToken, requireRole('admin'), getAnalytics);

export default router;
