import { Router, raw, json } from "express";
import * as billingController from "../controllers/billingController.ts";
import { authenticate } from "../middleware/auth.ts";

const router = Router();

// Lemon Squeezy Webhook needs raw body for signature verification
router.post("/webhook", raw({ type: "application/json" }), billingController.handleBillingWebhook);

// Checkout session creation needs JSON body and authentication
router.post("/checkout", json(), authenticate, billingController.createCheckoutSession);

export default router;
