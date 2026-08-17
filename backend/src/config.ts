import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { brand } from "./brand.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const rootEnv = path.resolve(repoRoot, ".env");
dotenv.config({ path: rootEnv });
dotenv.config();

function resolveFromRepo(value: string | undefined, fallbackRelative: string): string {
  if (!value) return path.resolve(repoRoot, fallbackRelative);
  return path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
}

function requiredWhen(driverActive: boolean, name: string, value: string | undefined): void {
  if (driverActive && process.env.NODE_ENV === "production" && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";

const storageDriver = (process.env.STORAGE_DRIVER ??
  (process.env.S3_BUCKET ? "s3" : "local")) as "s3" | "local";

const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
const hasSmtp = Boolean(
  process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim(),
);

const emailDriver = (process.env.EMAIL_DRIVER?.trim() ||
  (hasResend ? "resend" : hasSmtp ? "smtp" : "console")) as "resend" | "smtp" | "console";

// Platform-injected public URLs (Railway / Render) when APP_BASE_URL is not set
const railwayPublicDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.replace(/\/$/, "") || "";
const railwayPublicUrl = railwayPublicDomain
  ? railwayPublicDomain.startsWith("http")
    ? railwayPublicDomain
    : `https://${railwayPublicDomain}`
  : "";
const renderExternalUrl = process.env.RENDER_EXTERNAL_URL?.replace(/\/$/, "") || "";
const platformPublicUrl = railwayPublicUrl || renderExternalUrl;

const defaultAppBaseUrl =
  process.env.APP_BASE_URL ||
  platformPublicUrl ||
  (isProduction ? brand.appBaseUrl : "http://localhost:5173");
const defaultCorsOrigins =
  process.env.CORS_ORIGINS ||
  [
    platformPublicUrl,
    `https://${brand.domain}`,
    `https://www.${brand.domain}`,
    !isProduction ? "http://localhost:5173" : "",
    !isProduction ? "http://localhost:3001" : "",
  ]
    .filter(Boolean)
    .join(",");

requiredWhen(storageDriver === "s3", "S3_BUCKET", process.env.S3_BUCKET);
requiredWhen(storageDriver === "s3", "S3_ACCESS_KEY_ID", process.env.S3_ACCESS_KEY_ID);
requiredWhen(storageDriver === "s3", "S3_SECRET_ACCESS_KEY", process.env.S3_SECRET_ACCESS_KEY);
requiredWhen(storageDriver === "s3", "S3_REGION", process.env.S3_REGION);
requiredWhen(emailDriver === "resend", "RESEND_API_KEY", process.env.RESEND_API_KEY);
requiredWhen(emailDriver === "resend", "EMAIL_FROM", process.env.EMAIL_FROM);
requiredWhen(emailDriver === "smtp", "SMTP_HOST", process.env.SMTP_HOST);
requiredWhen(emailDriver === "smtp", "SMTP_USER", process.env.SMTP_USER);
requiredWhen(emailDriver === "smtp", "SMTP_PASS", process.env.SMTP_PASS);

// Boot-safe default so Railway/Render can start before custom env is filled in.
const adminPassword =
  process.env.ADMIN_PASSWORD?.trim() || (isProduction ? "KqKcSMDffHOc9AHrKqvZgZGi" : "");

export const config = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT ?? 3001),
  adminPassword,
  appBaseUrl: defaultAppBaseUrl,
  corsOrigins: defaultCorsOrigins
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  storageDriver,
  emailDriver,
  localUploadDir: resolveFromRepo(process.env.LOCAL_UPLOAD_DIR, "uploads"),
  localDataDir: resolveFromRepo(process.env.LOCAL_DATA_DIR, "data"),
  s3: {
    bucket: process.env.S3_BUCKET ?? "",
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.EMAIL_FROM ?? brand.emailFromDefault,
    notifyTo: process.env.NOTIFY_EMAIL ?? brand.contactEmail,
    smtp: {
      host: process.env.SMTP_HOST ?? "",
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER ?? "",
      pass: process.env.SMTP_PASS ?? "",
    },
  },
  limits: {
    maxFileBytes: Number(process.env.MAX_FILE_BYTES ?? 10 * 1024 * 1024),
    maxTotalUploadBytes: Number(process.env.MAX_TOTAL_UPLOAD_BYTES ?? 40 * 1024 * 1024),
    maxFiles: Number(process.env.MAX_FILES ?? 24),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 30),
  },
  allowedMimeTypes: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
} as const;
