import { rateLimit } from "express-rate-limit";

// 1. Budget Protection Rate Limiter (For expensive proxy routes)
export const proxyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50, // Limit each IP to 50 proxy calls per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later to protect our API budget." }
});

// 2. General API Rate Limiter
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 100,
  message: { error: "Rate limit exceeded." }
});
