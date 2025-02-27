import { Request, Response } from 'express';
import prisma from '../prisma';

export const getAnalytics = async (req: Request, res: Response) => {
    try {
        // Total revenue from paid orders:
        const paidOrders = await prisma.order.findMany({ where: { status: 'paid' } });
        const totalRevenue = paidOrders.reduce((acc, order) => acc + order.amount, 0);

        // Total orders count:
        const totalOrders = await prisma.order.count();

        // Orders by status:
        const ordersByStatus = await prisma.order.groupBy({
            by: ['status'],
            _count: { status: true },
        });

        // Best selling products (top 5 by quantity sold)
        const bestSellingProducts = await prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5,
        });

        // Retrieve product details for best selling products:
        const productIds = bestSellingProducts.map(item => item.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true }
        });

        const bestSelling = bestSellingProducts.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                productId: item.productId,
                productName: product?.name || 'Unknown',
                quantitySold: item._sum.quantity,
            };
        });

        return res.json({
            totalRevenue,
            totalOrders,
            ordersByStatus,
            bestSellingProducts: bestSelling,
        });
    } catch (error) {
        console.error("Analytics Error:", error);
        return res.status(500).json({ error: 'Unable to fetch analytics data' });
    }
};
