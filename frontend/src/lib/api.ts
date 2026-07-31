import type { ApplicationForm } from "../types/application";

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
  return {
    application_group: form.application_group,
    applicant: form.applicant,
    identity: form.identity,
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

  if (form.documents.id_document) {
    body.append("id_document", form.documents.id_document);
  }
  if (form.documents.proof_of_income) {
    body.append("proof_of_income", form.documents.proof_of_income);
  }
  if (form.documents.proof_of_address) {
    body.append("proof_of_address", form.documents.proof_of_address);
  }
  for (const file of form.documents.additional_documents) {
    body.append("additional_documents", file);
  }

  // Client-side marker PDF is optional; server always generates an authoritative packet.
  // We still attach a lightweight text blob labeled as summary when available from browser print path.
  // Backend generates the real PDF packet regardless.

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
