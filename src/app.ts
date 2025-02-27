import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import customerRoutes from './routes/customer.routes';
import s3Routes from "./routes/s3.routes";
import analyticsRoutes from "./routes/analytics.routes";
import cartRoutes from "./routes/cart.routes";
import stripeWebhookRoutes from "./routes/stripeWebhook.routes";
import categoryRoutes from "./routes/category.routes";
import favoriteRoutes from "./routes/favorite.routes";
import reviewRoutes from './routes/review.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/s3', s3Routes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/stripe', stripeWebhookRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);

export default app;
