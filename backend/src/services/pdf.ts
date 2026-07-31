import PDFDocument from "pdfkit";
import { brand } from "../brand.js";
import { ID_POINTS } from "../utils/identityPoints.js";
import type { ApplicationPayload } from "../utils/validation.js";

function section(doc: PDFKit.PDFDocument, title: string, rows: Array<[string, string]>) {
  doc.moveDown(0.6);
  doc.fontSize(13).fillColor("#1a6b5c").text(title, { underline: true });
  doc.moveDown(0.3);
  doc.fillColor("#0f1c24").fontSize(10);
  for (const [label, value] of rows) {
    doc.text(`${label}: ${value || "—"}`);
  }
}

export async function generateSummaryPdf(payload: ApplicationPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "LETTER" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).fillColor("#0f1c24").text(`${brand.productName} Application Summary`);
    doc
      .fontSize(10)
      .fillColor("#44555f")
      .text(`${brand.legalName} · ABN ${brand.abn}`)
      .text(`Application group: ${payload.application_group}`)
      .text(`Generated: ${new Date().toISOString()}`);

    section(doc, "Applicant Details", [
      ["Name", `${payload.applicant.first_name} ${payload.applicant.last_name}`],
      ["Email", payload.applicant.email],
      ["Phone", payload.applicant.phone],
      ["Date of birth", payload.applicant.date_of_birth],
    ]);

    const identityRows: Array<[string, string]> = [
      ["Nationality", payload.identity.nationality],
      ["100-point total", String(payload.identity.points_total)],
    ];
    if (payload.identity.drivers_licence) {
      identityRows.push(
        ["Driver licence", `${payload.identity.drivers_licence.number} (${payload.identity.drivers_licence.state}) — ${ID_POINTS.drivers_licence} pts`],
        ["Licence expiry", payload.identity.drivers_licence.expiry],
      );
    }
    if (payload.identity.passport) {
      identityRows.push(
        ["Passport", `${payload.identity.passport.number} (${payload.identity.passport.country}) — ${ID_POINTS.passport} pts`],
        ["Passport expiry", payload.identity.passport.expiry],
      );
    }
    if (payload.identity.medicare) {
      identityRows.push(
        [
          "Medicare",
          `${payload.identity.medicare.card_number} ref ${payload.identity.medicare.reference_number} (${payload.identity.medicare.card_colour}) — ${ID_POINTS.medicare} pts`,
        ],
        ["Medicare expiry", payload.identity.medicare.expiry],
      );
    }
    section(doc, "Identity (100 point check)", identityRows);

    section(doc, "Employment / Income", [
      ["Status", payload.employment.status],
      ["Employer", payload.employment.employer ?? ""],
      ["Job title", payload.employment.job_title ?? ""],
      ["Monthly income", payload.employment.monthly_income],
      ["Start date", payload.employment.start_date ?? ""],
    ]);

    section(doc, "Address / Rental History", [
      ["Current address", payload.address.current_address],
      ["City", payload.address.city],
      ["State", payload.address.state],
      ["Postal code", payload.address.postal_code],
      ["Years at address", payload.address.years_at_address],
      ["Monthly rent", payload.address.monthly_rent],
      ["Landlord", payload.address.landlord_name ?? ""],
      ["Landlord phone", payload.address.landlord_phone ?? ""],
      ["Previous address", payload.address.previous_address ?? ""],
    ]);

    section(doc, "Household", [
      ["People living in household", payload.household.people_living_in_household],
      ["Dependents", payload.household.dependents],
      ["Pets", payload.household.has_pets],
      ["Pet details", payload.household.pet_details ?? ""],
    ]);

    section(doc, "References", [
      [
        "Reference 1",
        `${payload.references.reference_1_name} / ${payload.references.reference_1_relationship} / ${payload.references.reference_1_phone} / ${payload.references.reference_1_email}`,
      ],
      [
        "Reference 2",
        `${payload.references.reference_2_name} / ${payload.references.reference_2_relationship} / ${payload.references.reference_2_phone} / ${payload.references.reference_2_email}`,
      ],
    ]);

    section(doc, "Declaration", [
      ["Accepted", payload.declaration.accepted ? "Yes" : "No"],
      ["Signature", payload.declaration.signature_name],
      ["Signed at", payload.declaration.signed_at],
    ]);

    if (payload.co_applicants?.length) {
      section(
        doc,
        "Co-Applicants",
        payload.co_applicants.map((c, i) => [
          `Invite ${i + 1}`,
          `${c.email}${c.status ? ` (${c.status})` : ""}`,
        ]),
      );
    }

    doc.end();
  });
}
