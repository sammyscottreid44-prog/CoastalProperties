import { createReadStream } from "node:fs";
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import type { StoredFile } from "./storage.js";
import type { ApplicationPayload } from "../utils/validation.js";
import { storeFile } from "./storage.js";

export type SubmissionRecord = {
  submission_id: string;
  created_at: string;
  application_group: string;
  payload: ApplicationPayload;
  files: StoredFile[];
  summary_pdf: StoredFile;
};

export type SubmissionSummary = {
  submission_id: string;
  created_at: string;
  application_group: string;
  role: string;
  applicant_name: string;
  applicant_email: string;
  file_count: number;
};

export async function persistSubmissionMetadata(record: SubmissionRecord): Promise<void> {
  await mkdir(config.localDataDir, { recursive: true });
  const metaPath = path.join(config.localDataDir, `${record.submission_id}.json`);
  await writeFile(metaPath, JSON.stringify(record, null, 2), "utf8");

  if (config.storageDriver === "s3") {
    await storeFile({
      submissionId: record.submission_id,
      category: "metadata",
      originalName: "submission.json",
      mimeType: "application/json",
      body: Buffer.from(JSON.stringify(record), "utf8"),
    });
  }
}

export async function listSubmissions(): Promise<SubmissionSummary[]> {
  await mkdir(config.localDataDir, { recursive: true });
  const names = await readdir(config.localDataDir);
  const jsonFiles = names.filter((n) => n.endsWith(".json"));
  const items: SubmissionSummary[] = [];

  for (const name of jsonFiles) {
    try {
      const raw = await readFile(path.join(config.localDataDir, name), "utf8");
      const record = JSON.parse(raw) as SubmissionRecord;
      const applicant = record.payload?.applicant;
      items.push({
        submission_id: record.submission_id,
        created_at: record.created_at,
        application_group: record.application_group,
        role: record.payload?.role === "co_applicant" ? "co_applicant" : "primary",
        applicant_name: applicant
          ? `${applicant.first_name} ${applicant.last_name}`.trim()
          : "Unknown",
        applicant_email: applicant?.email ?? "",
        file_count: (record.files?.length ?? 0) + (record.summary_pdf ? 1 : 0),
      });
    } catch {
      // skip corrupt records
    }
  }

  items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return items;
}

export async function getSubmission(submissionId: string): Promise<SubmissionRecord | null> {
  const safeId = path.basename(submissionId);
  if (safeId !== submissionId || !safeId) return null;
  const metaPath = path.join(config.localDataDir, `${safeId}.json`);
  try {
    const raw = await readFile(metaPath, "utf8");
    return JSON.parse(raw) as SubmissionRecord;
  } catch {
    return null;
  }
}

export function resolveStoredFilePath(file: StoredFile): string | null {
  if (file.url.startsWith("file://")) {
    return file.url.replace("file://", "");
  }
  // Local driver stores under uploads/<key>
  const localPath = path.join(config.localUploadDir, file.key);
  return localPath;
}

export async function openStoredFileStream(file: StoredFile) {
  const fullPath = resolveStoredFilePath(file);
  if (!fullPath) {
    throw new Error("File path unavailable");
  }
  await access(fullPath);
  return {
    stream: createReadStream(fullPath),
    fullPath,
    mimeType: file.mimeType,
    originalName: file.originalName,
  };
}

export function allFilesForRecord(record: SubmissionRecord): StoredFile[] {
  const files = [...(record.files ?? [])];
  if (record.summary_pdf) {
    const already = files.some((f) => f.key === record.summary_pdf.key);
    if (!already) files.push(record.summary_pdf);
  }
  return files;
}
