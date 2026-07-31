import { Resend } from "resend";
import { brand } from "../brand.js";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import type { ApplicationPayload } from "../utils/validation.js";

export type EmailResult = {
  success: boolean;
  id?: string;
  error?: string;
  /** true only when a real provider accepted the message */
  delivered: boolean;
  inviteUrl?: string;
};

async function sendViaResend(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  if (!config.email.resendApiKey) {
    return {
      success: false,
      delivered: false,
      error: "RESEND_API_KEY is not configured",
    };
  }

  const resend = new Resend(config.email.resendApiKey);
  const { data, error } = await resend.emails.send({
    from: config.email.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (error) {
    logger.error("email_send_failed", { to: params.to, error: error.message, driver: "resend" });
    return { success: false, delivered: false, error: error.message };
  }

  return { success: true, delivered: true, id: data?.id };
}

/**
 * Delivers to a fixed inbox via FormSubmit (no API key).
 * First-time use: FormSubmit emails the inbox an activation link — click it once.
 */
async function sendViaFormSubmit(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const endpoint = `https://formsubmit.co/ajax/${encodeURIComponent(params.to)}`;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _subject: params.subject,
        _template: "table",
        _captcha: "false",
        name: brand.productName,
        email: params.replyTo || config.email.notifyTo,
        message: params.text,
        html_body: params.html,
      }),
    });

    const body = (await res.json().catch(() => ({}))) as {
      success?: string | boolean;
      message?: string;
      error?: string;
    };

    if (!res.ok) {
      const err = body.message || body.error || `FormSubmit HTTP ${res.status}`;
      logger.error("email_send_failed", { to: params.to, error: err, driver: "formsubmit" });
      return { success: false, delivered: false, error: err };
    }

    const msg = String(body.message || body.success || "ok");
    logger.info("email_formsubmit_delivery", { to: params.to, message: msg });

    // Activation responses still count as "accepted" by the provider; inbox gets the activation mail.
    return {
      success: true,
      delivered: true,
      id: `formsubmit-${Date.now()}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "FormSubmit request failed";
    logger.error("email_send_failed", { to: params.to, error: message, driver: "formsubmit" });
    return { success: false, delivered: false, error: message };
  }
}

async function sendViaConsole(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  logger.info("email_console_delivery", {
    to: params.to,
    subject: params.subject,
    text: params.text,
  });
  return {
    success: false,
    delivered: false,
    id: `console-${Date.now()}`,
    error:
      "Email is in console mode. Set EMAIL_DRIVER=formsubmit (or resend) to deliver real emails.",
  };
}

async function deliver(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Prefer FormSubmit for fixed operator inbox when resend isn't configured */
  preferFormSubmit?: boolean;
  retries?: number;
}): Promise<EmailResult> {
  const attempts = params.retries ?? 2;
  let lastError = "Unknown email error";

  const driver =
    config.emailDriver === "resend" && config.email.resendApiKey
      ? "resend"
      : config.emailDriver === "console"
        ? "console"
        : "formsubmit";

  // Operator notifications: always allow FormSubmit fallback so submits reach the inbox
  const effectiveDriver =
    params.preferFormSubmit && driver === "console" ? "formsubmit" : driver;

  for (let i = 0; i <= attempts; i += 1) {
    try {
      let result: EmailResult;
      if (effectiveDriver === "resend") {
        result = await sendViaResend(params);
      } else if (effectiveDriver === "formsubmit") {
        result = await sendViaFormSubmit(params);
      } else {
        result = await sendViaConsole(params);
      }

      if (result.delivered) {
        return result;
      }
      lastError = result.error ?? lastError;
      if (effectiveDriver === "console") {
        return result;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Email delivery failed";
      logger.warn("email_retry", { attempt: i + 1, error: lastError });
    }
  }

  return { success: false, delivered: false, error: lastError };
}

export function buildInviteUrl(appBaseUrl: string, applicationGroup: string): string {
  const base = appBaseUrl.replace(/\/$/, "");
  return `${base}/?invite=${encodeURIComponent(applicationGroup)}`;
}

function formatSubmissionText(params: {
  submissionId: string;
  applicantName: string;
  applicantEmail: string;
  applicationGroup: string;
  appBaseUrl: string;
  payload?: ApplicationPayload;
  fileCount?: number;
}): string {
  const lines = [
    `${brand.legalName} (ABN ${brand.abn})`,
    `New CoastApply application submitted`,
    ``,
    `Submission ID: ${params.submissionId}`,
    `Application group: ${params.applicationGroup}`,
    `Applicant: ${params.applicantName}`,
    `Applicant email: ${params.applicantEmail}`,
    `Portal: ${params.appBaseUrl}`,
  ];

  if (params.payload) {
    const p = params.payload;
    lines.push(
      ``,
      `Phone: ${p.applicant.phone}`,
      `Date of birth: ${p.applicant.date_of_birth}`,
      `Nationality: ${p.identity.nationality}`,
      `Driver licence: ${p.identity.drivers_licence.number} (${p.identity.drivers_licence.state}) exp ${p.identity.drivers_licence.expiry}`,
      `Passport: ${p.identity.passport.number} (${p.identity.passport.country}) exp ${p.identity.passport.expiry}`,
      `Medicare: ${p.identity.medicare.card_number} ref ${p.identity.medicare.reference_number} (${p.identity.medicare.card_colour}) exp ${p.identity.medicare.expiry}`,
      `Employment: ${p.employment.status} / ${p.employment.employer || "n/a"} / income ${p.employment.monthly_income}`,
      `Address: ${p.address.current_address}, ${p.address.city} ${p.address.state} ${p.address.postal_code}`,
      `People living in household: ${p.household.people_living_in_household}`,
      `Files uploaded: ${params.fileCount ?? "n/a"}`,
      `Signature: ${p.declaration.signature_name}`,
    );
  }

  return lines.join("\n");
}

export async function sendInviteEmail(params: {
  inviteeEmail: string;
  inviterName: string;
  inviterEmail: string;
  applicationGroup: string;
  appBaseUrl: string;
}): Promise<EmailResult> {
  const inviteUrl = buildInviteUrl(params.appBaseUrl, params.applicationGroup);
  const subject = `${params.inviterName} invited you to a ${brand.productName} application`;
  const text = [
    `${params.inviterName} (${params.inviterEmail}) invited you to join a ${brand.legalName} application (${params.applicationGroup}).`,
    `Open this link to continue: ${inviteUrl}`,
  ].join("\n");
  const html = `
    <div style="font-family: Georgia, serif; color: #0f1c24;">
      <h1 style="font-size: 22px;">You're invited to a ${brand.productName} application</h1>
      <p><strong>${params.inviterName}</strong> (${params.inviterEmail}) asked you to join as a co-applicant for ${brand.legalName}.</p>
      <p>Application reference: <code>${params.applicationGroup}</code></p>
      <p>ABN ${brand.abn}</p>
      <p><a href="${inviteUrl}" style="background:#1a6b5c;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px;">Open application</a></p>
      <p style="margin-top:16px;font-size:12px;color:#44555f;">Or paste this link: ${inviteUrl}</p>
    </div>
  `;

  // Invites to arbitrary addresses need Resend; FormSubmit is inbox-owner only.
  const result = await deliver({
    to: params.inviteeEmail,
    subject,
    html,
    text,
    replyTo: params.inviterEmail,
  });
  return { ...result, inviteUrl };
}

export async function sendSubmissionNotification(params: {
  submissionId: string;
  applicantName: string;
  applicantEmail: string;
  applicationGroup: string;
  appBaseUrl: string;
  payload?: ApplicationPayload;
  fileCount?: number;
}): Promise<EmailResult> {
  const subject = `New ${brand.productName} submission — ${params.applicantName}`;
  const text = formatSubmissionText(params);
  const html = `
    <div style="font-family: Georgia, serif; color: #0f1c24;">
      <h1 style="font-size: 22px;">New application submitted</h1>
      <p>${brand.legalName} · ABN ${brand.abn}</p>
      <p><strong>Submission ID:</strong> ${params.submissionId}</p>
      <p><strong>Applicant:</strong> ${params.applicantName} (${params.applicantEmail})</p>
      <p><strong>Group:</strong> ${params.applicationGroup}</p>
      <pre style="white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:12px;background:#f4f7f8;padding:12px;border-radius:8px;">${text.replace(/</g, "&lt;")}</pre>
      <p><a href="${params.appBaseUrl}">Open CoastApply</a></p>
    </div>
  `;

  // Always deliver operator alerts to NOTIFY_EMAIL (FormSubmit if Resend unavailable)
  return deliver({
    to: config.email.notifyTo,
    subject,
    html,
    text,
    replyTo: params.applicantEmail,
    preferFormSubmit: true,
  });
}

export async function sendApplicantConfirmation(params: {
  submissionId: string;
  applicantName: string;
  applicantEmail: string;
  applicationGroup: string;
}): Promise<EmailResult> {
  const subject = `We received your ${brand.productName} application`;
  const text = [
    `Hi ${params.applicantName},`,
    ``,
    `Thanks — ${brand.legalName} has received your application.`,
    `Submission ID: ${params.submissionId}`,
    `Reference: ${params.applicationGroup}`,
    ``,
    `We will be in touch if anything further is needed.`,
  ].join("\n");
  const html = `
    <div style="font-family: Georgia, serif; color: #0f1c24;">
      <h1 style="font-size: 22px;">Application received</h1>
      <p>Hi ${params.applicantName},</p>
      <p>Thanks — <strong>${brand.legalName}</strong> has received your application.</p>
      <p><strong>Submission ID:</strong> ${params.submissionId}</p>
      <p><strong>Reference:</strong> ${params.applicationGroup}</p>
      <p>ABN ${brand.abn}</p>
    </div>
  `;

  // Only attempt when Resend is configured (arbitrary recipient)
  if (config.emailDriver === "resend" && config.email.resendApiKey) {
    return deliver({ to: params.applicantEmail, subject, html, text });
  }

  return {
    success: true,
    delivered: false,
    error: "Applicant confirmation skipped (requires Resend)",
  };
}
