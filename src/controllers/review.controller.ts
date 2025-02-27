import { Request, Response } from 'express';
import prisma from '../prisma';

// Create a new review (authenticated user)
export const createReview = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { productId, rating, reviewText } = req.body;
        // Validate rating range (e.g., 1 to 5)
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        // Find customer by Firebase UID
        const customer = await prisma.customer.findUnique({
            where: { firebaseUid: user.uid },
        });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });

        const review = await prisma.review.create({
            data: {
                productId,
                rating,
                reviewText,
                customerId: customer.id,
            },
        });
        res.status(201).json(review);
    } catch (error) {
        console.error("Error creating review:", error);
        res.status(500).json({ error: 'Unable to create review' });
    }
};

// Update a review (only by the owner)
export const updateReview = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const reviewId = parseInt(req.params.reviewId);
        const { rating, reviewText } = req.body;
        // Ensure rating (if provided) is within limits
        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Check that the review belongs to the user
        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review || review.customerId !== user.uid) {
            // Note: You may need to map Firebase UID to customer id; adjust as necessary.
            return res.status(403).json({ error: 'Not authorized to update this review' });
        }

        const updated = await prisma.review.update({
            where: { id: reviewId },
            data: { rating, reviewText },
        });
        res.json(updated);
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ error: 'Unable to update review' });
    }
};

// Delete a review (only by the owner)
export const deleteReview = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const reviewId = parseInt(req.params.reviewId);
        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review /* or review.customerId !== corresponding customer id */) {
            return res.status(403).json({ error: 'Not authorized to delete this review' });
        }
        await prisma.review.delete({ where: { id: reviewId } });
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ error: 'Unable to delete review' });
    }
};

// Get reviews for a product
export const getReviewsByProduct = async (req: Request, res: Response) => {
    try {
        const productId = parseInt(req.params.productId);
        const reviews = await prisma.review.findMany({
            where: { productId },
            include: { customer: { select: { id: true, name: true } } },
        });
        res.json(reviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ error: 'Unable to fetch reviews' });
    }
};
