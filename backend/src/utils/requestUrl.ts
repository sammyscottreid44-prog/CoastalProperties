import type { Request } from "express";
import { config } from "../config.js";

/** Prefer the browser-facing origin so invite links work on tunnels/custom domains. */
export function resolvePublicBaseUrl(req: Request): string {
  const origin = req.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin;
    } catch {
      /* fall through */
    }
  }

  const forwardedHost = req.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || req.get("host");
  if (host) {
    const protoHeader = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const proto =
      protoHeader ||
      (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
    return `${proto}://${host}`;
  }

  return config.appBaseUrl;
}
