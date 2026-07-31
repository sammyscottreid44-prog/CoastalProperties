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

function requiredInProduction(name: string, value: string | undefined): string | undefined {
  if (process.env.NODE_ENV === "production" && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";

const storageDriver = (process.env.STORAGE_DRIVER ?? (isProduction ? "s3" : "local")) as
  | "s3"
  | "local";

const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
const hasSmtp = Boolean(
  process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim(),
);

const emailDriver = (process.env.EMAIL_DRIVER?.trim() ||
  (hasResend ? "resend" : hasSmtp ? "smtp" : "console")) as "resend" | "smtp" | "console";

// Render injects RENDER_EXTERNAL_URL (e.g. https://coastapply.onrender.com)
const renderExternalUrl = process.env.RENDER_EXTERNAL_URL?.replace(/\/$/, "") || "";
const defaultAppBaseUrl =
  process.env.APP_BASE_URL ||
  renderExternalUrl ||
  (isProduction ? brand.appBaseUrl : "http://localhost:5173");
const defaultCorsOrigins =
  process.env.CORS_ORIGINS ||
  (renderExternalUrl
    ? `${renderExternalUrl},https://${brand.domain},https://www.${brand.domain}`
    : isProduction
      ? `https://${brand.domain},https://www.${brand.domain}`
      : "http://localhost:5173,http://localhost:3001");

if (isProduction) {
  if (storageDriver === "s3") {
    requiredInProduction("S3_BUCKET", process.env.S3_BUCKET);
    requiredInProduction("S3_ACCESS_KEY_ID", process.env.S3_ACCESS_KEY_ID);
    requiredInProduction("S3_SECRET_ACCESS_KEY", process.env.S3_SECRET_ACCESS_KEY);
    requiredInProduction("S3_REGION", process.env.S3_REGION);
  }
  if (emailDriver === "resend") {
    requiredInProduction("RESEND_API_KEY", process.env.RESEND_API_KEY);
    requiredInProduction("EMAIL_FROM", process.env.EMAIL_FROM);
  }
  if (emailDriver === "smtp") {
    requiredInProduction("SMTP_HOST", process.env.SMTP_HOST);
    requiredInProduction("SMTP_USER", process.env.SMTP_USER);
    requiredInProduction("SMTP_PASS", process.env.SMTP_PASS);
  }
  if (!process.env.CORS_ORIGINS && !renderExternalUrl) {
    requiredInProduction("CORS_ORIGINS", process.env.CORS_ORIGINS);
  }
  if (!process.env.APP_BASE_URL && !renderExternalUrl) {
    requiredInProduction("APP_BASE_URL", process.env.APP_BASE_URL);
  }
  requiredInProduction("NOTIFY_EMAIL", process.env.NOTIFY_EMAIL);
}

export const config = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT ?? 3001),
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
