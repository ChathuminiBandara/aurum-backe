import {Request, Response} from 'express';
import prisma from '../prisma';

export const getProducts = async (req: Request, res: Response) => {
    try {
        const { search, categoryId, minPrice, maxPrice } = req.query;
        const whereClause: any = {};

        if (search) {
            whereClause.OR = [
                { name: { contains: search as string } },
                { description: { contains: search as string } }
            ];
        }

        if (categoryId) {
            whereClause.categoryId = parseInt(categoryId as string);
        }

        if (minPrice || maxPrice) {
            whereClause.price = {};
            if (minPrice) whereClause.price.gte = parseFloat(minPrice as string);
            if (maxPrice) whereClause.price.lte = parseFloat(maxPrice as string);
        }

        const products = await prisma.product.findMany({ where: whereClause });
        console.log(products);
        res.json(products);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Unable to fetch products' });
    }
};


export const getProductById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const product = await prisma.product.findUnique({where: {id}});
        if (!product) return res.status(404).json({error: 'Product not found'});
        res.json(product);
    } catch (error) {
        res.status(500).json({error: 'Unable to fetch product'});
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const {name, description, price, imageUrl, quantity, categoryId} = req.body;
        const product = await prisma.product.create({
            data: {name, description, price, imageUrl, quantity, categoryId}
        });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({error: 'Unable to create product'});
    }
};


export const updateProduct = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const {name, description, price, imageUrl, quantity} = req.body;
        const product = await prisma.product.update({
            where: {id},
            data: {name, description, price, imageUrl, quantity}
        });
        res.json(product);
    } catch (error) {
        res.status(500).json({error: 'Unable to update product'});
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.product.delete({where: {id}});
        res.json({message: 'Product deleted successfully'});
    } catch (error) {
        res.status(500).json({error: 'Unable to delete product'});
    }
};
