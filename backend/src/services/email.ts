import { Resend } from "resend";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

export type EmailResult = {
  success: boolean;
  id?: string;
  error?: string;
};

async function sendViaResend(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  const resend = new Resend(config.email.resendApiKey);
  const { data, error } = await resend.emails.send({
    from: config.email.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (error) {
    logger.error("email_send_failed", { to: params.to, error: error.message });
    return { success: false, error: error.message };
  }

  return { success: true, id: data?.id };
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
  return { success: true, id: `console-${Date.now()}` };
}

async function deliver(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  retries?: number;
}): Promise<EmailResult> {
  const attempts = params.retries ?? 2;
  let lastError = "Unknown email error";

  for (let i = 0; i <= attempts; i += 1) {
    try {
      const result =
        config.emailDriver === "resend"
          ? await sendViaResend(params)
          : await sendViaConsole(params);

      if (result.success) {
        return result;
      }
      lastError = result.error ?? lastError;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Email delivery failed";
      logger.warn("email_retry", { attempt: i + 1, error: lastError });
    }
  }

  return { success: false, error: lastError };
}

export async function sendInviteEmail(params: {
  inviteeEmail: string;
  inviterName: string;
  inviterEmail: string;
  applicationGroup: string;
}): Promise<EmailResult> {
  const inviteUrl = `${config.appBaseUrl}/?invite=${encodeURIComponent(params.applicationGroup)}`;
  const subject = `${params.inviterName} invited you to a Northline application`;
  const text = [
    `${params.inviterName} (${params.inviterEmail}) invited you to join application ${params.applicationGroup}.`,
    `Open this link to continue: ${inviteUrl}`,
  ].join("\n");
  const html = `
    <div style="font-family: Georgia, serif; color: #0f1c24;">
      <h1 style="font-size: 22px;">You're invited to a Northline application</h1>
      <p><strong>${params.inviterName}</strong> (${params.inviterEmail}) asked you to join as a co-applicant.</p>
      <p>Application reference: <code>${params.applicationGroup}</code></p>
      <p><a href="${inviteUrl}" style="background:#1a6b5c;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px;">Open application</a></p>
    </div>
  `;

  return deliver({ to: params.inviteeEmail, subject, html, text });
}

export async function sendSubmissionNotification(params: {
  submissionId: string;
  applicantName: string;
  applicantEmail: string;
  applicationGroup: string;
}): Promise<EmailResult> {
  const subject = `New Northline submission ${params.submissionId}`;
  const text = [
    `Submission ID: ${params.submissionId}`,
    `Applicant: ${params.applicantName} <${params.applicantEmail}>`,
    `Application group: ${params.applicationGroup}`,
  ].join("\n");
  const html = `
    <div style="font-family: Georgia, serif; color: #0f1c24;">
      <h1 style="font-size: 22px;">New application submitted</h1>
      <p><strong>Submission ID:</strong> ${params.submissionId}</p>
      <p><strong>Applicant:</strong> ${params.applicantName} (${params.applicantEmail})</p>
      <p><strong>Group:</strong> ${params.applicationGroup}</p>
    </div>
  `;

  return deliver({ to: config.email.notifyTo, subject, html, text });
}
