import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger.js";

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
  }

  if (err instanceof Error && err.message.includes("File too large")) {
    return res.status(400).json({
      success: false,
      message: "One or more files exceed the maximum allowed size",
    });
  }

  logger.error("unhandled_error", {
    error: err instanceof Error ? err.message : "unknown",
  });

  return res.status(500).json({
    success: false,
    message: "An unexpected error occurred",
  });
}
