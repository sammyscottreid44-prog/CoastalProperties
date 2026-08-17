import rateLimit from "express-rate-limit";
import { config } from "../config.js";

export const apiRateLimiter = rateLimit({
  windowMs: config.limits.rateLimitWindowMs,
  max: config.limits.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// Admin UI loads lists/files/ZIPs; keep this much higher than public submit limits.
export const adminRateLimiter = rateLimit({
  windowMs: config.limits.rateLimitWindowMs,
  max: Number(process.env.ADMIN_RATE_LIMIT_MAX ?? 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many admin requests. Please wait a few minutes and try again.",
  },
});
