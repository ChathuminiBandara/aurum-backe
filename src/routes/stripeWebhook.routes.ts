import { Router } from 'express';
import { stripeWebhook } from '../controllers/stripeWebhook.controller';
import bodyParser from 'body-parser';

const router = Router();

// IMPORTANT: For webhook endpoints, you must use a raw body parser
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), stripeWebhook);

export default router;
