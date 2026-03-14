import { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../lib/prisma.ts";
import { lemonSqueezySetup, createCheckout } from "@lemonsqueezy/lemonsqueezy.js";

// Initialize Lemon Squeezy
const lsApiKey = process.env.LEMON_SQUEEZY_API_KEY || "";
lemonSqueezySetup({ apiKey: lsApiKey });

export const createCheckoutSession = async (req: any, res: Response) => {
  try {
    const { planName } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID || "";

    if (!planName) {
      return res.status(400).json({ error: "Plan name is required" });
    }

    let variantId = "";
    if (planName === "Starter") {
      variantId = process.env.LEMON_SQUEEZY_VARIANT_ID_STARTER || "";
    } else if (planName === "Growth Pro") {
      variantId = process.env.LEMON_SQUEEZY_VARIANT_ID_PRO || "";
    } else if (planName === "Scale") {
      variantId = process.env.LEMON_SQUEEZY_VARIANT_ID_SCALE || "";
    }

    if (!variantId) {
      return res.status(400).json({ error: "Invalid plan or missing variant ID configuration" });
    }

    const checkout = await createCheckout(storeId, variantId, {
      checkoutData: {
        email: userEmail,
        custom: {
          user_id: userId,
        },
      },
      productOptions: {
        redirectUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard?checkout=success`,
      },
    });

    res.json({ url: checkout.data?.data.attributes.url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};

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

    if (!userId) {
      return res.status(200).json({ received: true });
    }

    if (eventName === "subscription_created" || eventName === "subscription_updated") {
      const subscription = payload.data.attributes;
      const status = subscription.status;
      const variantId = subscription.variant_id.toString();
      const subscriptionId = payload.data.id;

      let plan: 'FREE' | 'PRO' | 'AGENCY' = 'FREE';
      let credits = 100;

      if (variantId === process.env.LEMON_SQUEEZY_VARIANT_ID_STARTER) {
        plan = 'FREE'; // Or whatever Starter maps to
        credits = 50;
      } else if (variantId === process.env.LEMON_SQUEEZY_VARIANT_ID_PRO) {
        plan = 'PRO';
        credits = 500;
      } else if (variantId === process.env.LEMON_SQUEEZY_VARIANT_ID_SCALE) {
        plan = 'AGENCY';
        credits = 2500;
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: status,
          subscriptionId: subscriptionId,
          variantId: variantId,
          plan: plan,
          credits: credits
        }
      });
    }

    if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'expired',
          credits: 0
        }
      });
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    res.status(500).send("Webhook handler failed");
  }
};
