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
