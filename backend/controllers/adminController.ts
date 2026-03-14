import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            leads: true,
            campaigns: true,
            profiles: true
          }
        }
      }
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });
    res.json(user);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
};

export const getSystemConfig = async (req: Request, res: Response) => {
  try {
    const config = await prisma.systemConfig.findMany();
    res.json(config);
  } catch (error) {
    console.error("Error fetching system config:", error);
    res.status(500).json({ error: "Failed to fetch system config" });
  }
};

export const updateSystemConfig = async (req: Request, res: Response) => {
  const { key, value } = req.body;

  try {
    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    res.json(config);
  } catch (error) {
    console.error("Error updating system config:", error);
    res.status(500).json({ error: "Failed to update system config" });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const [userCount, leadCount, campaignCount, totalCredits] = await Promise.all([
      prisma.user.count(),
      prisma.lead.count(),
      prisma.campaign.count(),
      prisma.user.aggregate({ _sum: { credits: true } })
    ]);

    res.json({
      totalUsers: userCount,
      totalLeads: leadCount,
      totalCampaigns: campaignCount,
      totalCreditsAllocated: totalCredits._sum.credits || 0
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};
