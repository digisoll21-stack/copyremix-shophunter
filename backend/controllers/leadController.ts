import { Request, Response } from "express";
import { getSupabase } from "../../shared/services/supabase.ts";
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
    const jobs = huntService.getUserJobs(userId);
    res.json(jobs);
  } catch (err: any) {
    console.error("Failed to get jobs:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getLeads = async (req: any, res: Response) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.json([]);
    }

    const { niche, limit } = req.query;
    const userId = req.user.id;
    
    let query = supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId);

    if (niche) {
      query = query.ilike('data', `%${niche}%`);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(Number(limit) || 100);

    if (error) throw error;

    res.json(data.map((l: any) => ({
      ...JSON.parse(l.data),
      status: l.status,
      notes: l.notes
    })));
  } catch (err: any) {
    console.error("Failed to fetch leads:", err);
    res.status(500).json({ error: err.message });
  }
};

export const saveLeads = async (req: any, res: Response) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(503).json({ error: "Database not configured" });
    }

    const leads = Array.isArray(req.body) ? req.body : [req.body];
    const userId = req.user.id;
    
    const leadsToUpsert = leads.map(lead => ({
      url: lead.url,
      name: lead.name,
      status: lead.status || 'New',
      notes: lead.notes || '',
      user_id: userId,
      data: JSON.stringify(lead)
    }));

    const { error } = await supabase
      .from('leads')
      .upsert(leadsToUpsert, { onConflict: 'url,user_id' });

    if (error) throw error;

    res.json({ success: true, count: leads.length });
  } catch (err: any) {
    console.error("Failed to save leads:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateLead = async (req: any, res: Response) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(503).json({ error: "Database not configured" });
    }

    const { url } = req.params;
    const { status, notes, data } = req.body;
    const userId = req.user.id;
    
    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (data !== undefined) updates.data = JSON.stringify(data);

    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('url', url)
      .eq('user_id', userId);

    if (error) throw error;
    
    res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to update lead:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteLead = async (req: any, res: Response) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(503).json({ error: "Database not configured" });
    }

    const { url } = req.params;
    const userId = req.user.id;
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('url', url)
      .eq('user_id', userId);

    if (error) throw error;
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
    const supabase = getSupabase();
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

    if (verificationResult.is_valid && supabase) {
      const { data: leadDataRow, error: fetchError } = await supabase
        .from('leads')
        .select('data')
        .eq('url', url)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      if (leadDataRow) {
        const leadData = JSON.parse(leadDataRow.data);
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

        const { error: updateError } = await supabase
          .from('leads')
          .update({ data: JSON.stringify(updatedData) })
          .eq('url', url)
          .eq('user_id', userId);

        if (updateError) throw updateError;

        return res.json({ success: true, lead: updatedData });
      }
    }

    res.json({ success: false, message: "Email could not be verified as deliverable." });
  } catch (error: any) {
    console.error("Email verification error:", error);
    res.status(500).json({ error: "Failed to verify email", message: error.message });
  }
};
