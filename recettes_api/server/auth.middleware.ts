import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not defined");
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  const status = authHeader ? "✅ AVEC TOKEN" : "❌ SANS TOKEN";

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    const secret = process.env.JWT_SECRET || "MA_SUPER_CLE_SECRETE_FIXE_POUR_DEV";

    jwt.verify(token, secret, (err, user) => {
      if (err) {
        console.error("❌ Erreur vérification JWT :", err.message);
        return res.status(403).json({ message: "Token invalide" });
      }
      
      req.user = user as any;
      next();
    });
  } else {
    next();
  }
};

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Vous devez être connecté" });
  }
  next();
};
