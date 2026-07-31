import type { ApplicationForm } from "../types/application";
import { sumIdentityPoints } from "./identityPoints";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export type SubmitResult = {
  success: boolean;
  message: string;
  submission_id?: string;
  errors?: Array<{ path?: string; message: string }>;
};

export type InviteResult = {
  success: boolean;
  message: string;
  status?: string;
  error?: string;
};

function buildPayload(form: ApplicationForm) {
  const points = sumIdentityPoints({
    drivers_licence: form.identity.drivers_licence.enabled,
    passport: form.identity.passport.enabled,
    medicare: form.identity.medicare.enabled,
  });

  return {
    application_group: form.application_group,
    applicant: form.applicant,
    identity: {
      nationality: form.identity.nationality,
      points_total: points,
      drivers_licence: form.identity.drivers_licence.enabled
        ? {
            provided: true as const,
            number: form.identity.drivers_licence.number,
            state: form.identity.drivers_licence.state,
            expiry: form.identity.drivers_licence.expiry,
          }
        : null,
      passport: form.identity.passport.enabled
        ? {
            provided: true as const,
            number: form.identity.passport.number,
            country: form.identity.passport.country,
            expiry: form.identity.passport.expiry,
          }
        : null,
      medicare: form.identity.medicare.enabled
        ? {
            provided: true as const,
            card_number: form.identity.medicare.card_number,
            reference_number: form.identity.medicare.reference_number,
            card_colour: form.identity.medicare.card_colour,
            expiry: form.identity.medicare.expiry,
          }
        : null,
    },
    employment: form.employment,
    address: form.address,
    household: form.household,
    references: form.references,
    declaration: {
      accepted: true as const,
      signature_name: form.declaration.signature_name,
      signed_at: new Date().toISOString(),
    },
    co_applicants: form.co_applicants.map((c) => ({
      email: c.email,
      status: c.status,
    })),
  };
}

export async function submitApplication(form: ApplicationForm): Promise<SubmitResult> {
  const body = new FormData();
  body.append("payload", JSON.stringify(buildPayload(form)));

  if (form.identity.drivers_licence.enabled) {
    if (form.identity.drivers_licence.front) {
      body.append("drivers_licence_front", form.identity.drivers_licence.front);
    }
    if (form.identity.drivers_licence.back) {
      body.append("drivers_licence_back", form.identity.drivers_licence.back);
    }
  }
  if (form.identity.passport.enabled && form.identity.passport.photo) {
    body.append("passport_photo", form.identity.passport.photo);
  }
  if (form.identity.medicare.enabled && form.identity.medicare.photo) {
    body.append("medicare_photo", form.identity.medicare.photo);
  }

  for (const file of form.documents.payslips) {
    body.append("payslips", file);
  }
  for (const file of form.documents.bank_statements) {
    body.append("bank_statements", file);
  }
  for (const file of form.documents.other_documents) {
    body.append("other_documents", file);
  }

  const res = await fetch(`${API_BASE}/api/application/submit`, {
    method: "POST",
    body,
  });

  const data = (await res.json()) as SubmitResult;
  if (!res.ok && data.success !== false) {
    return { success: false, message: data.message || "Submission failed" };
  }
  return data;
}

export async function sendInvite(params: {
  invitee_email: string;
  inviter_name: string;
  inviter_email: string;
  application_group: string;
}): Promise<InviteResult> {
  const res = await fetch(`${API_BASE}/api/application/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = (await res.json()) as InviteResult;
  if (!res.ok && data.success !== false) {
    return { success: false, message: data.message || "Invite failed" };
  }
  return data;
}
