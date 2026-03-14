import { Request, Response, NextFunction } from "express";
import { getSupabase } from "../../shared/services/supabase.ts";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authenticate = async (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  let userId: string | null = null;
  let email: string | null = null;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.NODE_ENV !== "production") {
      userId = (req.headers['x-user-id'] as string) || 'mock-user-id';
      email = 'demo@example.com';
    } else {
      return res.status(401).json({ error: "Authentication required" });
    }
  } else {
    const token = authHeader.split(' ')[1];
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ error: "Auth service unavailable" });
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
      userId = user.id;
      email = user.email || null;
    } catch (err) {
      console.error("Auth middleware error:", err);
      return res.status(500).json({ error: "Internal server error during authentication" });
    }
  }

  if (userId) {
    try {
      // Fetch or create user in our DB to get the role
      let dbUser = await prisma.user.findUnique({ where: { id: userId } });
      
      if (dbUser && email === 'digisoll21@gmail.com' && dbUser.role !== 'SUPERADMIN') {
        dbUser = await prisma.user.update({
          where: { id: userId },
          data: { role: 'SUPERADMIN' }
        });
      }

      if (!dbUser && email) {
        dbUser = await prisma.user.create({
          data: {
            id: userId,
            email: email,
            name: email.split('@')[0],
            role: (email === 'digisoll21@gmail.com' || process.env.NODE_ENV !== "production") ? 'SUPERADMIN' : 'USER'
          }
        });
      }

      req.user = {
        id: userId,
        email: email,
        role: (email === 'digisoll21@gmail.com' || email === 'demo@example.com' || process.env.NODE_ENV !== "production") ? 'SUPERADMIN' : (dbUser?.role || 'USER')
      };
      next();
    } catch (err) {
      console.error("DB User sync error:", err);
      res.status(500).json({ error: "Failed to sync user data" });
    }
  }
};

export const authorizeAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

export const authorizeSuperAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: "Super Admin access required" });
  }
  next();
};
