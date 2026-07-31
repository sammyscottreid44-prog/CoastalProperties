import multer from "multer";
import { config } from "../config.js";
import { HttpError } from "./errorHandler.js";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: config.limits.maxFileBytes,
    files: config.limits.maxFiles,
  },
  fileFilter: (_req, file, cb) => {
    if (!(config.allowedMimeTypes as readonly string[]).includes(file.mimetype)) {
      cb(
        new HttpError(
          400,
          `Unsupported file type: ${file.mimetype}. Allowed: PDF, JPG, PNG, DOC, DOCX`,
        ),
      );
      return;
    }
    cb(null, true);
  },
});
