import { Request, Response } from 'express';
import prisma from '../prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2022-11-15',
});

// Get the current cart for the authenticated customer.
// If none exists, create an empty cart.
export const getCart = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const customer = await prisma.customer.findUnique({
            where: { firebaseUid: user.uid },
        });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });

        let cart = await prisma.cart.findUnique({
            where: { customerId: customer.id },
            include: { items: { include: { product: true } } },
        });
        if (!cart) {
            cart = await prisma.cart.create({
                data: { customerId: customer.id },
                include: { items: { include: { product: true } } },
            });
        }
        return res.json(cart);
    } catch (error) {
        console.error('Get Cart Error:', error);
        return res.status(500).json({ error: 'Unable to fetch cart' });
    }
};

// Add a product to the cart (or update quantity if it exists)
export const addToCart = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { productId, quantity } = req.body;
        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Invalid productId or quantity' });
        }
        const customer = await prisma.customer.findUnique({
            where: { firebaseUid: user.uid },
        });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });

        // Ensure product exists
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return res.status(404).json({ error: 'Product not found' });

        // Get or create cart
        let cart = await prisma.cart.findUnique({
            where: { customerId: customer.id },
        });
        if (!cart) {
            cart = await prisma.cart.create({ data: { customerId: customer.id } });
        }

        // Check if item already exists in cart
        const existingItem = await prisma.cartItem.findFirst({
            where: { cartId: cart.id, productId },
        });
        let cartItem;
        if (existingItem) {
            cartItem = await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity },
            });
        } else {
            cartItem = await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    quantity,
                },
            });
        }
        return res.json(cartItem);
    } catch (error) {
        console.error('Add to Cart Error:', error);
        return res.status(500).json({ error: 'Unable to add to cart' });
    }
};

// Update the quantity for a specific cart item.
export const updateCartItem = async (req: Request, res: Response) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        if (!quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Invalid quantity' });
        }
        const updatedItem = await prisma.cartItem.update({
            where: { id: parseInt(itemId) },
            data: { quantity },
            include: { product: true },
        });
        return res.json(updatedItem);
    } catch (error) {
        console.error('Update Cart Item Error:', error);
        return res.status(500).json({ error: 'Unable to update cart item' });
    }
};

// Remove a cart item.
export const removeCartItem = async (req: Request, res: Response) => {
    try {
        const { itemId } = req.params;
        await prisma.cartItem.delete({
            where: { id: parseInt(itemId) },
        });
        return res.json({ message: 'Item removed from cart' });
    } catch (error) {
        console.error('Remove Cart Item Error:', error);
        return res.status(500).json({ error: 'Unable to remove cart item' });
    }
};

// Checkout the cart: create a Stripe Checkout session and clear the cart.
export const checkoutCart = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const customer = await prisma.customer.findUnique({
            where: { firebaseUid: user.uid },
        });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });

        const cart = await prisma.cart.findUnique({
            where: { customerId: customer.id },
            include: { items: { include: { product: true } } },
        });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        let totalAmount = 0;
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
        const orderItemsData: { productId: number; quantity: number; price: number }[] = [];

        for (const item of cart.items) {
            const product = item.product;
            if (product.quantity < item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for product ${product.name}` });
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

        // Create an order with status "pending"
        await prisma.order.create({
            data: {
                amount: totalAmount,
                status: 'pending',
                customerId: customer.id,
                orderItems: {
                    create: orderItemsData,
                },
            },
        });

        // Clear cart items
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

        return res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Checkout Cart Error:', error);
        return res.status(500).json({ error: 'Unable to checkout cart' });
    }
};
