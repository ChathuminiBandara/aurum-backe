import { Request, Response } from 'express';
import prisma from '../prisma';

// Add a product to favorites
export const addFavorite = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { productId } = req.body;
        if (!productId) return res.status(400).json({ error: 'Product ID is required' });

        // Check if favorite already exists
        const existing = await prisma.favorite.findFirst({
            where: {
                productId,
                customer: { firebaseUid: user.uid },
            }
        });
        if(existing) return res.status(400).json({ error: 'Product is already a favorite' });

        // Find the customer
        const customer = await prisma.customer.findUnique({
            where: { firebaseUid: user.uid },
        });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });

        const favorite = await prisma.favorite.create({
            data: {
                productId,
                customerId: customer.id,
            }
        });
        return res.json(favorite);
    } catch (error) {
        console.error("Error adding favorite", error);
        return res.status(500).json({ error: 'Unable to add favorite' });
    }
};

// Remove a product from favorites
export const removeFavorite = async (req: Request, res: Response) => {
    try {
        const favoriteId = parseInt(req.params.favoriteId);
        await prisma.favorite.delete({
            where: { id: favoriteId }
        });
        return res.json({ message: 'Favorite removed' });
    } catch (error) {
        console.error("Error removing favorite", error);
        return res.status(500).json({ error: 'Unable to remove favorite' });
    }
};

// Get all favorites for the current customer
export const getFavorites = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const customer = await prisma.customer.findUnique({
            where: { firebaseUid: user.uid },
            include: { favorites: { include: { product: true } } }
        });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        return res.json(customer.favorites);
    } catch (error) {
        console.error("Error fetching favorites", error);
        return res.status(500).json({ error: 'Unable to fetch favorites' });
    }
};
