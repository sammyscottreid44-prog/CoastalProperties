import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!config.adminPassword) {
    res.status(503).json({
      success: false,
      message: "Admin access is not configured. Set ADMIN_PASSWORD in the server environment.",
    });
    return;
  }

  const header = req.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const queryToken = typeof req.query.token === "string" ? req.query.token : "";
  const provided = bearer || queryToken;

  if (!provided || !safeEqual(provided, config.adminPassword)) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  next();
}
