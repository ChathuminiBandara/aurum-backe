import { Request, Response } from 'express';
import prisma from '../prisma';

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            include: { products: true }
        });
        return res.json(categories);
    } catch (error) {
        console.error("Error fetching categories", error);
        return res.status(500).json({ error: 'Unable to fetch categories' });
    }
};

export const getProductsByCategory = async (req: Request, res: Response) => {
    try {
        const categoryId = parseInt(req.params.categoryId);
        const products = await prisma.product.findMany({
            where: { categoryId }
        });
        return res.json(products);
    } catch (error) {
        console.error("Error fetching products by category", error);
        return res.status(500).json({ error: 'Unable to fetch products by category' });
    }
};

export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        const category = await prisma.category.create({
            data: { name, description }
        });
        res.status(201).json(category);
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ error: 'Unable to create category' });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const categoryId = parseInt(req.params.categoryId);
        const { name, description } = req.body;
        const category = await prisma.category.update({
            where: { id: categoryId },
            data: { name, description },
        });
        res.json(category);
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ error: 'Unable to update category' });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const categoryId = parseInt(req.params.categoryId);
        await prisma.category.delete({
            where: { id: categoryId }
        });
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ error: 'Unable to delete category' });
    }
};
