import { mkdir, writeFile } from "node:fs/promises";
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
