import {Request, Response} from 'express';
import prisma from '../prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2022-11-15',
});

export const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const {items} = req.body;
        let totalAmount = 0;
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
        const orderItemsData: { productId: number; quantity: number; price: number }[] = [];

        for (const item of items) {
            const product = await prisma.product.findUnique({where: {id: item.productId}});
            if (!product) {
                return res.status(400).json({error: `Product with ID ${item.productId} not found`});
            }
            if (product.quantity < item.quantity) {
                return res.status(400).json({error: `Insufficient stock for product ${product.name}`});
            }

            totalAmount += product.price * item.quantity;
            lineItems.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.name,
                        description: product.description || '',
                    },
                    unit_amount: Math.round(product.price * 100),
                },
                quantity: item.quantity,
            });
            orderItemsData.push({
                productId: product.id,
                quantity: item.quantity,
                price: product.price,
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
        });

        const user = (req as any).user;
        let customer = await prisma.customer.findUnique({where: {firebaseUid: user.uid}});
        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    firebaseUid: user.uid,
                    email: user.email,
                    name: user.name || 'Unknown',
                },
            });
        }

        // Create order with associated order items; status "pending"
        const order = await prisma.order.create({
            data: {
                stripeSessionId: session.id,
                amount: totalAmount,
                status: 'pending',
                customerId: customer.id,
                orderItems: {
                    create: orderItemsData,
                },
            },
        });

        res.json({sessionId: session.id, url: session.url});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Unable to create checkout session'});
    }
};

export const getOrders = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const customer = await prisma.customer.findUnique({
            where: {firebaseUid: user.uid},
            include: {orders: {include: {orderItems: true}}},
        });
        if (!customer) {
            return res.status(404).json({error: 'Customer not found'});
        }
        res.json(customer.orders);
    } catch (error) {
        res.status(500).json({error: 'Unable to fetch orders'});
    }
};

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            include: {customer: true, orderItems: true},
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({error: 'Unable to fetch orders'});
    }
};

// New endpoint: Update order status and update product stock when marking as "paid"
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const {orderId, status} = req.body;
        if (!orderId || !status) {
            return res.status(400).json({error: 'orderId and status are required'});
        }

        const order = await prisma.order.findUnique({
            where: {id: orderId},
            include: {orderItems: true},
        });
        if (!order) {
            return res.status(404).json({error: 'Order not found'});
        }

        // If marking as paid, update product quantities
        if (status === 'paid') {
            for (const item of order.orderItems) {
                await prisma.product.update({
                    where: {id: item.productId},
                    data: {quantity: {decrement: item.quantity}},
                });
            }
        }

        const updatedOrder = await prisma.order.update({
            where: {id: orderId},
            data: {status},
            include: {orderItems: true},
        });

        res.json(updatedOrder);
    } catch (error) {
        console.error("Update Order Status Error:", error);
        res.status(500).json({error: 'Unable to update order status'});
    }
};
