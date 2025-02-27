import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/verify', verifyToken, (req: Request, res: Response) => {
    res.json({ message: "Token is valid", user: (req as any).user, role: (req as any).role });
});

export default router;
