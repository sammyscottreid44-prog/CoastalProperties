# Email setup (Resend) — required for real invites & submission alerts

Right now, without a Resend API key, CoastApply **does not put mail in inboxes**.
It only logs messages on the server (`EMAIL_DRIVER=console`).

## What you need

1. Create a free account at https://resend.com
2. Create an API key
3. For testing, you can send **to your own Gmail** using Resend’s test sender:
   - `EMAIL_FROM=CoastApply <onboarding@resend.dev>`
   - `NOTIFY_EMAIL=sammyscottreid44@gmail.com`
4. For production on `coastapply.com`, verify that domain in Resend, then use:
   - `EMAIL_FROM=CoastApply <applications@coastapply.com>`

## Set on the server / host

```bash
EMAIL_DRIVER=resend
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=CoastApply <onboarding@resend.dev>
NOTIFY_EMAIL=sammyscottreid44@gmail.com
```

Restart the app after setting these.

## Until the key is set

- Co-applicant invites still generate a **copyable invite link** in the UI
- Submissions are still saved; notification emails will not arrive
