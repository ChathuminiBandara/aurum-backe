import { Request, Response } from 'express';
import prisma from '../prisma';

export const getCustomerProfile = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const customer = await prisma.customer.findUnique({
            where: { firebaseUid: user.uid },
        });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Unable to fetch customer profile' });
    }
};

export const updateCustomerProfile = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { name, email } = req.body;
        const customer = await prisma.customer.update({
            where: { firebaseUid: user.uid },
            data: { name, email },
        });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Unable to update customer profile' });
    }


};

export const upsertCustomer = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user; // Decoded Firebase token
        const { name, email } = req.body; // Optional additional data from the client

        const customer = await prisma.customer.upsert({
            where: { firebaseUid: user.uid },
            update: {
                name: name || user.name || 'Unknown',
                email: email || user.email,
            },
            create: {
                firebaseUid: user.uid,
                name: name || user.name || 'Unknown',
                email: email || user.email,
            },
        });

        return res.json(customer);
    } catch (error) {
        console.error("Upsert Customer Error:", error);
        return res.status(500).json({ error: 'Unable to upsert customer' });
    }
};
