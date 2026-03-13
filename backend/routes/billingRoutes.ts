import { Router, raw } from "express";
import * as billingController from "../controllers/billingController.ts";

const router = Router();

// Lemon Squeezy Webhook needs raw body for signature verification
router.post("/webhook", raw({ type: "application/json" }), billingController.handleBillingWebhook);

export default router;
