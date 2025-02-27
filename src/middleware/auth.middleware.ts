import { Request, Response, NextFunction } from 'express';
import admin from '../firebase/firebase';

export interface AuthenticatedRequest extends Request {
    user?: admin.auth.DecodedIdToken;
    role?: string;
}

// Hard-coded CMS admin email
const hardCodedAdminEmail = "derickandrewferdinands@gmail.com";

export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        // Assign role based on email
        req.role = (decodedToken.email === hardCodedAdminEmail) ? "admin" : "client";
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized", error });
    }
};

export const requireRole = (role: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (req.role !== role) {
            return res.status(403).json({ message: "Forbidden. Insufficient role." });
        }
        next();
    };
};
