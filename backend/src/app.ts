import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { errorHandler, HttpError } from "./middleware/errorHandler.js";
import { apiRateLimiter } from "./middleware/rateLimit.js";
import { applicationRouter } from "./routes/application.js";
import { logger } from "./utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (config.corsOrigins.includes(origin) || config.corsOrigins.includes("*")) {
          callback(null, true);
          return;
        }
        callback(new HttpError(403, "Origin not allowed"));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      message: "ok",
      env: config.nodeEnv,
      storage: config.storageDriver,
      email: config.emailDriver,
    });
  });

  app.use("/api/application", apiRateLimiter, applicationRouter);

  const frontendDist = path.resolve(__dirname, "../../frontend/dist");
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api\/).*/, (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    res.sendFile(path.join(frontendDist, "index.html"), (err) => {
      if (err) next();
    });
  });

  app.use(errorHandler);

  return app;
}

export function logStartup() {
  logger.info("app_configured", {
    env: config.nodeEnv,
    storageDriver: config.storageDriver,
    emailDriver: config.emailDriver,
    corsOrigins: config.corsOrigins,
  });
}
