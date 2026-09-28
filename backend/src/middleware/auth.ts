import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: { userId: number; role: "USER" | "OWNER" };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token manquant" });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "Erreur serveur" });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), secret) as {
      userId: number;
      role: "USER" | "OWNER";
    };
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

export function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "OWNER") {
    res.status(403).json({ error: "Réservé aux propriétaires" });
    return;
  }
  next();
}