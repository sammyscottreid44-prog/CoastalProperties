# Email setup (required for inbox delivery)

Applicant UI never shows where submissions are sent.

Operator inbox: `sammyscottreid44@gmail.com` (`NOTIFY_EMAIL`)

## Fastest: Resend (recommended)

1. Go to https://resend.com/signup (free)
2. Create an API key: https://resend.com/api-keys
3. Put it in `.env`:

```bash
EMAIL_DRIVER=resend
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=CoastApply <onboarding@resend.dev>
NOTIFY_EMAIL=sammyscottreid44@gmail.com
```

4. Restart the server (`npm start`)

With `onboarding@resend.dev` you can send **to your own Gmail** for testing.
For production invites to any address, verify `coastapply.com` in Resend and switch `EMAIL_FROM`.

## Alternative: Gmail SMTP

1. Google Account → Security → 2-Step Verification → App passwords
2. Create an app password for Mail
3. Put in `.env`:

```bash
EMAIL_DRIVER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=sammyscottreid44@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=CoastApply <sammyscottreid44@gmail.com>
NOTIFY_EMAIL=sammyscottreid44@gmail.com
```

4. Restart the server
