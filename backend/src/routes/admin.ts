import { ZipArchive } from "archiver";
import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import {
  allFilesForRecord,
  getSubmission,
  listSubmissions,
  openStoredFileStream,
} from "../services/submissions.js";

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
    const inline = req.query.inline === "1" || req.query.inline === "true";
    const safeName = opened.originalName.replace(/"/g, "");
    res.setHeader("Content-Type", opened.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `${inline ? "inline" : "attachment"}; filename="${safeName}"`,
    );
    res.setHeader("Cache-Control", "private, max-age=300");
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

    const applicant = (record.payload as { applicant?: { first_name?: string; last_name?: string } })
      .applicant;
    const nameParts = [applicant?.first_name, applicant?.last_name]
      .filter(Boolean)
      .join("-")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
    const zipBase = nameParts
      ? `${nameParts}-${record.submission_id.slice(0, 8)}`
      : `application-${record.submission_id.slice(0, 8)}`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipBase}.zip"`);

    const archive = new ZipArchive({ zlib: { level: 9 } });
    archive.on("error", (err: Error) => next(err));
    archive.pipe(res);

    archive.append(JSON.stringify(record, null, 2), { name: "submission.json" });
    archive.append(buildReadableSummary(record), { name: "application-summary.txt" });

    const usedNames = new Set<string>();
    for (const file of allFilesForRecord(record)) {
      try {
        const opened = await openStoredFileStream(file);
        const parts = file.key.split("/");
        const folder = parts[2] || "files";
        let entryName = `${folder}/${file.originalName}`;
        if (usedNames.has(entryName)) {
          const stamp = Date.now().toString(36);
          const dot = file.originalName.lastIndexOf(".");
          const renamed =
            dot > 0
              ? `${file.originalName.slice(0, dot)}-${stamp}${file.originalName.slice(dot)}`
              : `${file.originalName}-${stamp}`;
          entryName = `${folder}/${renamed}`;
        }
        usedNames.add(entryName);
        archive.append(opened.stream, { name: entryName });
      } catch {
        // skip missing files
      }
    }

    await archive.finalize();
  } catch (err) {
    next(err);
  }
});

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function line(label: string, value: unknown): string {
  const text = value === undefined || value === null || value === "" ? "—" : String(value);
  return `${label}: ${text}`;
}

function buildReadableSummary(record: {
  submission_id: string;
  created_at: string;
  application_group: string;
  payload: unknown;
}): string {
  const payload = asRecord(record.payload);
  const applicant = asRecord(payload.applicant);
  const identity = asRecord(payload.identity);
  const licence = asRecord(identity.drivers_licence);
  const passport = asRecord(identity.passport);
  const medicare = asRecord(identity.medicare);
  const employment = asRecord(payload.employment);
  const address = asRecord(payload.address);
  const household = asRecord(payload.household);
  const references = asRecord(payload.references);
  const declaration = asRecord(payload.declaration);
  const coApplicants = Array.isArray(payload.co_applicants) ? payload.co_applicants : [];

  const sections = [
    "CoastApply application summary",
    "==============================",
    line("Submission ID", record.submission_id),
    line("Submitted", record.created_at),
    line("Application group", record.application_group),
    line("Role", payload.role),
    "",
    "Applicant",
    "---------",
    line("Name", `${applicant.first_name ?? ""} ${applicant.last_name ?? ""}`.trim()),
    line("Email", applicant.email),
    line("Phone", applicant.phone),
    line("Date of birth", applicant.date_of_birth),
    "",
    "Identity",
    "--------",
    line("Nationality", identity.nationality),
    line("Driver licence number", licence.number),
    line("Driver licence state", licence.state),
    line("Driver licence expiry", licence.expiry),
    line("Passport number", passport.number),
    line("Passport country", passport.country),
    line("Passport expiry", passport.expiry),
    line("Medicare card number", medicare.card_number),
    line("Medicare IRN", medicare.reference_number),
    line("Medicare colour", medicare.card_colour),
    line("Medicare expiry", medicare.expiry),
    "",
    "Employment",
    "----------",
    line("Status", employment.status),
    line("Employer", employment.employer),
    line("Job title", employment.job_title),
    line("Monthly income", employment.monthly_income),
    line("Start date", employment.start_date),
    "",
    "Address",
    "-------",
    line("Current address", address.current_address),
    line("City", address.city),
    line("State", address.state),
    line("Postal code", address.postal_code),
    line("Years at address", address.years_at_address),
    line("Monthly rent", address.monthly_rent),
    line("Landlord name", address.landlord_name),
    line("Landlord phone", address.landlord_phone),
    line("Previous address", address.previous_address),
    "",
    "Household",
    "---------",
    line("People living in household", household.people_living_in_household),
    line("Dependents", household.dependents),
    line("Pets", household.has_pets),
    line("Pet details", household.pet_details),
    "",
    "References",
    "----------",
    line("Reference 1", references.reference_1_name),
    line("Phone", references.reference_1_phone),
    line("Email", references.reference_1_email),
    line("Relationship", references.reference_1_relationship),
    line("Reference 2", references.reference_2_name),
    line("Phone", references.reference_2_phone),
    line("Email", references.reference_2_email),
    line("Relationship", references.reference_2_relationship),
    "",
    "Declaration",
    "-----------",
    line("Accepted", declaration.accepted),
    line("Signature name", declaration.signature_name),
    line("Signed at", declaration.signed_at),
    "",
    "Co-applicants",
    "-------------",
    ...(coApplicants.length
      ? coApplicants.map((item, index) => {
          const row = asRecord(item);
          return `${index + 1}. ${row.email ?? "—"} (${row.status ?? "—"})`;
        })
      : ["None"]),
    "",
  ];

  return sections.join("\n");
}
