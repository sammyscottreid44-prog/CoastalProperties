import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config.js";
import { HttpError } from "../middleware/errorHandler.js";
import { upload } from "../middleware/upload.js";
import {
  sendApplicantConfirmation,
  sendInviteEmail,
  sendSubmissionNotification,
} from "../services/email.js";
import { generateSummaryPdf } from "../services/pdf.js";
import { storeFile, type StoredFile } from "../services/storage.js";
import { persistSubmissionMetadata } from "../services/submissions.js";
import { logger } from "../utils/logger.js";
import { resolvePublicBaseUrl } from "../utils/requestUrl.js";
import {
  applicationPayloadSchema,
  invitePayloadSchema,
  parseJsonField,
  type ApplicationPayload,
} from "../utils/validation.js";

export const applicationRouter = Router();

const REQUIRED_IDENTITY_FILES = [
  "drivers_licence_front",
  "drivers_licence_back",
  "passport_photo",
  "medicare_photo",
] as const;

applicationRouter.post(
  "/submit",
  upload.fields([
    { name: "drivers_licence_front", maxCount: 1 },
    { name: "drivers_licence_back", maxCount: 1 },
    { name: "passport_photo", maxCount: 1 },
    { name: "medicare_photo", maxCount: 1 },
    { name: "payslips", maxCount: 8 },
    { name: "bank_statements", maxCount: 8 },
    { name: "other_documents", maxCount: 8 },
    { name: "summary_pdf", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const rawPayload = req.body?.payload;
      const parsedUnknown = parseJsonField<unknown>(rawPayload, "payload");
      const payload: ApplicationPayload = applicationPayloadSchema.parse(parsedUnknown);

      const files = (req.files as Record<string, Express.Multer.File[]> | undefined) ?? {};

      for (const field of REQUIRED_IDENTITY_FILES) {
        if (!files[field]?.length) {
          throw new HttpError(400, `Missing required identity upload: ${field}`);
        }
      }
      if (!files.payslips?.length) {
        throw new HttpError(400, "At least one payslip is required");
      }
      if (!files.bank_statements?.length) {
        throw new HttpError(400, "At least one bank statement is required");
      }

      const allUploads = Object.values(files).flat();
      if (!allUploads.length) {
        throw new HttpError(400, "Supporting documents are required");
      }
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

      const appBaseUrl = resolvePublicBaseUrl(req);
      const applicantName = `${payload.applicant.first_name} ${payload.applicant.last_name}`;
      const notify = await sendSubmissionNotification({
        submissionId,
        applicantName,
        applicantEmail: payload.applicant.email,
        applicationGroup: payload.application_group,
        appBaseUrl,
        payload,
        fileCount: storedFiles.length + 1,
      });
      const applicantMail = await sendApplicantConfirmation({
        submissionId,
        applicantName,
        applicantEmail: payload.applicant.email,
        applicationGroup: payload.application_group,
      });

      logger.audit("application_submit", {
        submission_id: submissionId,
        application_group: payload.application_group,
        file_count: storedFiles.length + 1,
        notify_to: config.email.notifyTo,
        notify_delivered: notify.delivered,
        notify_error: notify.error,
        applicant_mail_delivered: applicantMail.delivered,
      });

      return res.status(201).json({
        success: true,
        message: notify.delivered
          ? "Application submitted successfully"
          : "Application submitted, but the notification email could not be delivered",
        submission_id: submissionId,
        email_delivered: notify.delivered,
        email_to: config.email.notifyTo,
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
    const appBaseUrl = resolvePublicBaseUrl(req);
    const result = await sendInviteEmail({
      inviteeEmail: invite.invitee_email,
      inviterName: invite.inviter_name,
      inviterEmail: invite.inviter_email,
      applicationGroup: invite.application_group,
      appBaseUrl,
    });

    logger.audit("application_invite", {
      application_group: invite.application_group,
      invitee_email: invite.invitee_email,
      delivered: result.delivered,
      email_id: result.id,
      invite_url: result.inviteUrl,
    });

    return res.status(200).json({
      success: true,
      message: result.delivered
        ? "Invite email sent successfully"
        : "Invite link ready — email was not delivered. Copy the link and share it.",
      email_id: result.id,
      email_delivered: result.delivered,
      invite_url: result.inviteUrl,
      status: result.delivered ? "sent" : "failed",
      error: result.delivered ? undefined : result.error,
    });
  } catch (err) {
    return next(err);
  }
});
