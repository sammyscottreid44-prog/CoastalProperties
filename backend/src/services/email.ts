import nodemailer from "nodemailer";
import { Resend } from "resend";
import { brand } from "../brand.js";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import type { ApplicationPayload } from "../utils/validation.js";

export type EmailResult = {
  success: boolean;
  id?: string;
  error?: string;
  delivered: boolean;
  inviteUrl?: string;
};

async function sendViaResend(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<EmailResult> {
  if (!config.email.resendApiKey) {
    return { success: false, delivered: false, error: "RESEND_API_KEY is not configured" };
  }

  const resend = new Resend(config.email.resendApiKey);
  const { data, error } = await resend.emails.send({
    from: config.email.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    replyTo: params.replyTo,
  });

  if (error) {
    logger.error("email_send_failed", { driver: "resend", to: params.to, error: error.message });
    return { success: false, delivered: false, error: error.message };
  }

  logger.info("email_sent", { driver: "resend", to: params.to, id: data?.id });
  return { success: true, delivered: true, id: data?.id };
}

async function sendViaSmtp(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const { host, port, secure, user, pass } = config.email.smtp;
  if (!host || !user || !pass) {
    return { success: false, delivered: false, error: "SMTP is not fully configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: config.email.from || user,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
      replyTo: params.replyTo,
    });

    logger.info("email_sent", { driver: "smtp", to: params.to, id: info.messageId });
    return { success: true, delivered: true, id: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMTP send failed";
    logger.error("email_send_failed", { driver: "smtp", to: params.to, error: message });
    return { success: false, delivered: false, error: message };
  }
}

async function sendViaConsole(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<EmailResult> {
  logger.warn("email_not_configured", {
    to: params.to,
    subject: params.subject,
    hint: "Set RESEND_API_KEY (recommended) or SMTP_HOST/SMTP_USER/SMTP_PASS",
  });
  logger.info("email_console_delivery", {
    to: params.to,
    subject: params.subject,
    text: params.text,
  });
  return {
    success: false,
    delivered: false,
    error: "Email provider not configured",
  };
}

async function deliver(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  retries?: number;
}): Promise<EmailResult> {
  const attempts = params.retries ?? 2;
  let lastError = "Unknown email error";

  for (let i = 0; i <= attempts; i += 1) {
    try {
      let result: EmailResult;
      if (config.emailDriver === "resend") {
        result = await sendViaResend(params);
      } else if (config.emailDriver === "smtp") {
        result = await sendViaSmtp(params);
      } else if (config.email.resendApiKey) {
        result = await sendViaResend(params);
      } else if (config.email.smtp.host && config.email.smtp.user && config.email.smtp.pass) {
        result = await sendViaSmtp(params);
      } else {
        result = await sendViaConsole(params);
      }

      if (result.delivered) return result;
      lastError = result.error ?? lastError;
      if (config.emailDriver === "console" && !config.email.resendApiKey) {
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
    `Role: ${params.payload?.role === "co_applicant" ? "Co-applicant" : "Primary applicant"}`,
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
    </div>
  `;

  return deliver({
    to: config.email.notifyTo,
    subject,
    html,
    text,
    replyTo: params.applicantEmail,
    retries: 3,
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

  return deliver({ to: params.applicantEmail, subject, html, text });
}
