// src/controllers/stripeWebhook.controller.ts
import { Request, Response } from 'express';
import prisma from '../prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2022-11-15',
});

// Make sure to set this environment variable with your webhook signing secret.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const stripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig as string,
            endpointSecret as string
        );
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionId = session.id;

        try {
            // Find the order with the matching Stripe session ID
            const order = await prisma.order.findFirst({ where: { stripeSessionId: sessionId } });
            if (order) {
                // Update order status to "paid"
                await prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'paid' },
                });
                console.log(`Order ${order.id} updated to paid.`);
            }
        } catch (error) {
            console.error("Error updating order from webhook:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
};
