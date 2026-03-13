import { Request, Response } from "express";
import crypto from "crypto";
import { getSupabase } from "../../shared/services/supabase.ts";

export const handleBillingWebhook = async (req: Request, res: Response) => {
  try {
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "";
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(req.body).digest("hex"), "utf8");
    const signature = Buffer.from(req.get("X-Signature") || "", "utf8");

    if (digest.length !== signature.length || !crypto.timingSafeEqual(digest, signature)) {
      return res.status(401).send("Invalid signature");
    }

    const payload = JSON.parse(req.body.toString());
    const eventName = payload.meta.event_name;
    const customData = payload.meta.custom_data;
    const userId = customData?.user_id;

    console.log(`Lemon Squeezy Webhook: ${eventName} for user ${userId}`);

    const supabase = getSupabase();
    if (!supabase || !userId) {
      return res.status(200).json({ received: true });
    }

    if (eventName === "subscription_created" || eventName === "subscription_updated") {
      const subscription = payload.data.attributes;
      const status = subscription.status;
      const variantId = subscription.variant_id;
      const subscriptionId = payload.data.id;

      const { error } = await supabase
        .from('users')
        .update({
          subscription_status: status,
          subscription_id: subscriptionId,
          variant_id: variantId,
          credits: variantId.toString() === process.env.LEMON_SQUEEZY_VARIANT_ID_PRO ? 1000 : 100
        })
        .eq('id', userId);

      if (error) throw error;
    }

    if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
      await supabase
        .from('users')
        .update({
          subscription_status: 'expired',
          credits: 0
        })
        .eq('id', userId);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    res.status(500).send("Webhook handler failed");
  }
};
