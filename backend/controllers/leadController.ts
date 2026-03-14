import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import * as huntService from "../services/huntService.ts";

export const startHunt = async (req: any, res: Response) => {
  try {
    const { query, filters, mission } = req.body;
    const userId = req.user.id;
    
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const jobId = await huntService.startHuntJob(userId, query, filters, mission);
    res.json({ success: true, jobId });
  } catch (err: any) {
    console.error("Failed to start hunt:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getJobs = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    // Fetch jobs from Prisma
    const jobs = await prisma.discoveryJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    res.json(jobs);
  } catch (err: any) {
    console.error("Failed to get jobs:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getLeads = async (req: any, res: Response) => {
  try {
    const { niche, limit } = req.query;
    const userId = req.user.id;
    
    const leads = await prisma.lead.findMany({
      where: {
        userId,
        ...(niche ? {
          OR: [
            { niche: { contains: String(niche), mode: 'insensitive' } },
            { name: { contains: String(niche), mode: 'insensitive' } }
          ]
        } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit) || 100
    });

    res.json(leads.map(l => ({
      ...((l.data as any) || {}),
      status: l.status,
      notes: l.notes,
      id: l.id
    })));
  } catch (err: any) {
    console.error("Failed to fetch leads:", err);
    res.status(500).json({ error: err.message });
  }
};

export const saveLeads = async (req: any, res: Response) => {
  try {
    const leads = Array.isArray(req.body) ? req.body : [req.body];
    const userId = req.user.id;
    
    const operations = leads.map(lead => 
      prisma.lead.upsert({
        where: {
          url_userId: {
            url: lead.url,
            userId
          }
        },
        update: {
          name: lead.name,
          data: lead,
          status: lead.status || 'New',
          notes: lead.notes || ''
        },
        create: {
          url: lead.url,
          name: lead.name,
          status: lead.status || 'New',
          notes: lead.notes || '',
          userId,
          data: lead
        }
      })
    );

    await prisma.$transaction(operations);

    res.json({ success: true, count: leads.length });
  } catch (err: any) {
    console.error("Failed to save leads:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateLead = async (req: any, res: Response) => {
  try {
    const { url } = req.params;
    const { status, notes, data } = req.body;
    const userId = req.user.id;
    
    await prisma.lead.update({
      where: {
        url_userId: {
          url,
          userId
        }
      },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(data !== undefined && { data })
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to update lead:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteLead = async (req: any, res: Response) => {
  try {
    const { url } = req.params;
    const userId = req.user.id;
    
    await prisma.lead.delete({
      where: {
        url_userId: {
          url,
          userId
        }
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete lead:", err);
    res.status(500).json({ error: err.message });
  }
};

export const verifyEmail = async (req: any, res: Response) => {
  const { url, email } = req.body;
  const apiKey = process.env.ABSTRACT_EMAIL_VERIFY_API_KEY;
  const userId = req.user.id;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    let verificationResult = { is_valid: true, score: 0.8 };

    if (apiKey) {
      const response = await fetch(`https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${email}`);
      if (response.ok) {
        const data = await response.json();
        verificationResult = {
          is_valid: data.deliverability === "DELIVERABLE",
          score: data.quality_score
        };
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      verificationResult = { is_valid: isValid, score: isValid ? 0.95 : 0.1 };
    }

    if (verificationResult.is_valid) {
      const lead = await prisma.lead.findUnique({
        where: { url_userId: { url, userId } }
      });

      if (lead) {
        const leadData = (lead.data as any) || {};
        const updatedData = {
          ...leadData,
          verificationStatus: 'Verified',
          lastVerifiedAt: new Date().toISOString(),
          confidenceScore: Math.min(100, (leadData.confidenceScore || 70) + 15),
          scoreBreakdown: {
            ...(leadData.scoreBreakdown || {}),
            hasEmail: true
          }
        };

        await prisma.lead.update({
          where: { id: lead.id },
          data: { data: updatedData }
        });

        return res.json({ success: true, lead: updatedData });
      }
    }

    res.json({ success: false, message: "Email could not be verified as deliverable." });
  } catch (error: any) {
    console.error("Email verification error:", error);
    res.status(500).json({ error: "Failed to verify email", message: error.message });
  }
};
