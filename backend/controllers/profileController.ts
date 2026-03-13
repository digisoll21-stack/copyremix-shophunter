import { Request, Response } from "express";
import { getSupabase } from "../../shared/services/supabase.ts";

export const getProfiles = async (req: any, res: Response) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.json([]);
    }

    const userId = req.user.id;
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data.map((p: any) => JSON.parse(p.data)));
  } catch (err: any) {
    console.error("Failed to fetch profiles:", err);
    res.status(500).json({ error: err.message });
  }
};

export const saveProfile = async (req: any, res: Response) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(503).json({ error: "Database not configured" });
    }

    const profile = req.body;
    const userId = req.user.id;
    const { error } = await supabase
      .from('business_profiles')
      .upsert({
        id: profile.id,
        name: profile.name,
        user_id: userId,
        data: JSON.stringify(profile)
      }, { onConflict: 'id,user_id' });

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to save profile:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteProfile = async (req: any, res: Response) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(503).json({ error: "Database not configured" });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { error } = await supabase
      .from('business_profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete profile:", err);
    res.status(500).json({ error: err.message });
  }
};
