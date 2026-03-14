import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";

export const getProfiles = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const profiles = await prisma.businessProfile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(profiles.map((p: any) => p.data));
  } catch (err: any) {
    console.error("Failed to fetch profiles:", err);
    res.status(500).json({ error: err.message });
  }
};

export const saveProfile = async (req: any, res: Response) => {
  try {
    const profile = req.body;
    const userId = req.user.id;
    
    await prisma.businessProfile.upsert({
      where: {
        id_userId: {
          id: profile.id,
          userId
        }
      },
      update: {
        name: profile.name,
        data: profile
      },
      create: {
        id: profile.id,
        name: profile.name,
        userId,
        data: profile
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to save profile:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteProfile = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    await prisma.businessProfile.delete({
      where: {
        id_userId: {
          id,
          userId
        }
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete profile:", err);
    res.status(500).json({ error: err.message });
  }
};
