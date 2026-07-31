import { brand } from "./brand";
import type { ApplicationForm } from "../types/application";

/** Browser-side delivery to the operator inbox (works without Resend API key). */
export async function notifyOperatorOfSubmission(params: {
  submissionId: string;
  form: ApplicationForm;
}): Promise<{ delivered: boolean; error?: string }> {
  const to = brand.contactEmail;
  const endpoint = `https://formsubmit.co/ajax/${encodeURIComponent(to)}`;
  const f = params.form;

  const message = [
    `${brand.legalName} (ABN ${brand.abn})`,
    `New CoastApply application submitted`,
    ``,
    `Submission ID: ${params.submissionId}`,
    `Reference: ${f.application_group}`,
    `Role: ${f.role === "co_applicant" ? "Co-applicant" : "Primary applicant"}`,
    `Applicant: ${f.applicant.first_name} ${f.applicant.last_name}`,
    `Email: ${f.applicant.email}`,
    `Phone: ${f.applicant.phone}`,
    `DOB: ${f.applicant.date_of_birth}`,
    `Nationality: ${f.identity.nationality}`,
    `Driver licence: ${f.identity.drivers_licence.number} (${f.identity.drivers_licence.state})`,
    `Passport: ${f.identity.passport.number} (${f.identity.passport.country})`,
    `Medicare: ${f.identity.medicare.card_number} ref ${f.identity.medicare.reference_number}`,
    `Employment: ${f.employment.status} / ${f.employment.employer || "n/a"} / $${f.employment.monthly_income}`,
    `Address: ${f.address.current_address}, ${f.address.city} ${f.address.state} ${f.address.postal_code}`,
    `People in household: ${f.household.people_living_in_household}`,
    `Payslips: ${f.documents.payslips.length}`,
    `Bank statements: ${f.documents.bank_statements.length}`,
    `Signature: ${f.declaration.signature_name}`,
  ].join("\n");

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _subject: `New CoastApply submission — ${f.applicant.first_name} ${f.applicant.last_name}`,
        _template: "table",
        _captcha: "false",
        name: `${f.applicant.first_name} ${f.applicant.last_name}`,
        email: f.applicant.email,
        message,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { delivered: false, error: text.slice(0, 200) || `HTTP ${res.status}` };
    }

    return { delivered: true };
  } catch (err) {
    return {
      delivered: false,
      error: err instanceof Error ? err.message : "Notification request failed",
    };
  }
}
