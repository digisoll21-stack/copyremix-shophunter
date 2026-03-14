import { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.ts";

export const syncUser = async (req: any, res: Response, next: NextFunction) => {
  if (!req.user) return next();

  try {
    // Upsert the user in our Prisma database to ensure they exist
    const user = await prisma.user.upsert({
      where: { id: req.user.id },
      update: { email: req.user.email },
      create: {
        id: req.user.id,
        email: req.user.email,
        plan: 'FREE'
      },
    });

    req.dbUser = user;
    next();
  } catch (err) {
    console.error("User sync error:", err);
    // We don't block the request if sync fails, but we log it
    next();
  }
};
