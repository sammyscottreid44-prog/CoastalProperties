import { createRequire } from "node:module";
import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import {
  allFilesForRecord,
  getSubmission,
  listSubmissions,
  openStoredFileStream,
} from "../services/submissions.js";

const require = createRequire(import.meta.url);
// CJS package; typed loosely for NodeNext ESM interop
const archiver = require("archiver") as (
  format: string,
  options?: { zlib?: { level?: number } },
) => {
  on: (event: string, cb: (err: Error) => void) => void;
  pipe: (dest: NodeJS.WritableStream) => void;
  append: (source: unknown, data: { name: string }) => void;
  finalize: () => Promise<void>;
};

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get("/submissions", async (_req, res, next) => {
  try {
    const items = await listSubmissions();
    res.json({ success: true, submissions: items });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/submissions/:id", async (req, res, next) => {
  try {
    const record = await getSubmission(req.params.id);
    if (!record) {
      res.status(404).json({ success: false, message: "Submission not found" });
      return;
    }
    res.json({
      success: true,
      submission: {
        ...record,
        files: allFilesForRecord(record).map((f) => ({
          key: f.key,
          originalName: f.originalName,
          mimeType: f.mimeType,
          size: f.size,
          category: f.key.split("/")[2] || "file",
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/submissions/:id/file", async (req, res, next) => {
  try {
    const record = await getSubmission(req.params.id);
    if (!record) {
      res.status(404).json({ success: false, message: "Submission not found" });
      return;
    }
    const fileKey = typeof req.query.key === "string" ? req.query.key : "";
    const file = allFilesForRecord(record).find((f) => f.key === fileKey);
    if (!file) {
      res.status(404).json({ success: false, message: "File not found" });
      return;
    }

    const opened = await openStoredFileStream(file);
    res.setHeader("Content-Type", opened.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${opened.originalName.replace(/"/g, "")}"`,
    );
    opened.stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/submissions/:id/download.zip", async (req, res, next) => {
  try {
    const record = await getSubmission(req.params.id);
    if (!record) {
      res.status(404).json({ success: false, message: "Submission not found" });
      return;
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="submission-${record.submission_id}.zip"`,
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err: Error) => next(err));
    archive.pipe(res);

    archive.append(JSON.stringify(record, null, 2), { name: "submission.json" });

    for (const file of allFilesForRecord(record)) {
      try {
        const opened = await openStoredFileStream(file);
        const parts = file.key.split("/");
        const folder = parts[2] || "files";
        archive.append(opened.stream, { name: `${folder}/${file.originalName}` });
      } catch {
        // skip missing files
      }
    }

    await archive.finalize();
  } catch (err) {
    next(err);
  }
});
