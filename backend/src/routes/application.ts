import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config.js";
import { HttpError } from "../middleware/errorHandler.js";
import { upload } from "../middleware/upload.js";
import { sendInviteEmail, sendSubmissionNotification } from "../services/email.js";
import { generateSummaryPdf } from "../services/pdf.js";
import { storeFile, type StoredFile } from "../services/storage.js";
import { persistSubmissionMetadata } from "../services/submissions.js";
import { logger } from "../utils/logger.js";
import {
  applicationPayloadSchema,
  invitePayloadSchema,
  parseJsonField,
  type ApplicationPayload,
} from "../utils/validation.js";

export const applicationRouter = Router();

const REQUIRED_DOC_FIELDS = ["id_document", "proof_of_income", "proof_of_address"] as const;

applicationRouter.post(
  "/submit",
  upload.fields([
    { name: "id_document", maxCount: 1 },
    { name: "proof_of_income", maxCount: 1 },
    { name: "proof_of_address", maxCount: 1 },
    { name: "additional_documents", maxCount: 8 },
    { name: "summary_pdf", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const rawPayload = req.body?.payload;
      const parsedUnknown = parseJsonField<unknown>(rawPayload, "payload");
      const payload: ApplicationPayload = applicationPayloadSchema.parse(parsedUnknown);

      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      if (!files) {
        throw new HttpError(400, "Supporting documents are required");
      }

      for (const field of REQUIRED_DOC_FIELDS) {
        if (!files[field]?.length) {
          throw new HttpError(400, `Missing required document: ${field}`);
        }
      }

      const allUploads = Object.values(files).flat();
      const totalBytes = allUploads.reduce((sum, f) => sum + f.size, 0);
      if (totalBytes > config.limits.maxTotalUploadBytes) {
        throw new HttpError(400, "Total upload size exceeds the allowed limit");
      }

      const submissionId = uuidv4();
      const storedFiles: StoredFile[] = [];

      for (const [field, list] of Object.entries(files)) {
        if (field === "summary_pdf") continue;
        for (const file of list) {
          const stored = await storeFile({
            submissionId,
            category: field,
            originalName: file.originalname,
            mimeType: file.mimetype,
            body: file.buffer,
          });
          storedFiles.push(stored);
        }
      }

      let summaryPdf: StoredFile;
      const clientPdf = files.summary_pdf?.[0];
      if (clientPdf) {
        summaryPdf = await storeFile({
          submissionId,
          category: "summary_pdf",
          originalName: clientPdf.originalname || "application-summary.pdf",
          mimeType: "application/pdf",
          body: clientPdf.buffer,
        });
      } else {
        const generated = await generateSummaryPdf(payload);
        summaryPdf = await storeFile({
          submissionId,
          category: "summary_pdf",
          originalName: "application-summary.pdf",
          mimeType: "application/pdf",
          body: generated,
        });
      }

      // Always also generate a server-side packet for integrity when client PDF was provided
      if (clientPdf) {
        const serverPacket = await generateSummaryPdf(payload);
        const serverStored = await storeFile({
          submissionId,
          category: "summary_pdf_server",
          originalName: "application-summary-server.pdf",
          mimeType: "application/pdf",
          body: serverPacket,
        });
        storedFiles.push(serverStored);
      }

      const record = {
        submission_id: submissionId,
        created_at: new Date().toISOString(),
        application_group: payload.application_group,
        payload,
        files: storedFiles,
        summary_pdf: summaryPdf,
      };

      await persistSubmissionMetadata(record);

      const notify = await sendSubmissionNotification({
        submissionId,
        applicantName: `${payload.applicant.first_name} ${payload.applicant.last_name}`,
        applicantEmail: payload.applicant.email,
        applicationGroup: payload.application_group,
      });

      logger.audit("application_submit", {
        submission_id: submissionId,
        application_group: payload.application_group,
        file_count: storedFiles.length + 1,
        notify_success: notify.success,
      });

      return res.status(201).json({
        success: true,
        message: notify.success
          ? "Application submitted successfully"
          : "Application submitted; notification email could not be delivered",
        submission_id: submissionId,
        files: [...storedFiles, summaryPdf].map((f) => ({
          key: f.key,
          originalName: f.originalName,
          size: f.size,
          url: f.url,
        })),
      });
    } catch (err) {
      return next(err);
    }
  },
);

applicationRouter.post("/invite", async (req, res, next) => {
  try {
    const body =
      typeof req.body?.invitee_email === "string"
        ? req.body
        : typeof req.body?.payload === "string"
          ? parseJsonField<unknown>(req.body.payload, "payload")
          : req.body;

    const invite = invitePayloadSchema.parse(body);
    const result = await sendInviteEmail({
      inviteeEmail: invite.invitee_email,
      inviterName: invite.inviter_name,
      inviterEmail: invite.inviter_email,
      applicationGroup: invite.application_group,
    });

    logger.audit("application_invite", {
      application_group: invite.application_group,
      invitee_email: invite.invitee_email,
      success: result.success,
      email_id: result.id,
    });

    if (!result.success) {
      return res.status(502).json({
        success: false,
        message: "Invite email failed to send",
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invite sent successfully",
      email_id: result.id,
      status: "sent",
    });
  } catch (err) {
    return next(err);
  }
});
