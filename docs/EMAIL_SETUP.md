# Email setup

## Submission alerts → your inbox (default)

Every successful application notifies:

`sammyscottreid44@gmail.com`

This is sent from the applicant’s browser via FormSubmit (no API key).

**First submission only:** check that Gmail (and spam) for a FormSubmit **activation / confirm** email. Click it once. After that, every new application lands in your inbox.

## Optional: Resend (invites + applicant confirmations)

```bash
EMAIL_DRIVER=resend
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=CoastApply <onboarding@resend.dev>
NOTIFY_EMAIL=sammyscottreid44@gmail.com
```

With Resend you also get co-applicant invite emails and applicant confirmation emails.
Without Resend, co-applicant invites still show a **copyable invite link** in the UI.
