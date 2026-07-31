# Instant access (no Squarespace / no Vercel auth)

Use this when domain registrar login is blocked or slow.

## Option A — Live tunnel (available now)

While the cloud agent environment is running, CoastApply is exposed at a temporary public URL via Cloudflare Quick Tunnel (no account, no DNS change).

1. Open the tunnel URL from the agent (looks like `https://….trycloudflare.com`)
2. Use the full application there immediately
3. Note: the URL dies when the agent/tunnel stops — it is for demos/testing, not permanent go-live

## Option B — Render free URL (persistent, still no Squarespace)

1. Go to https://dashboard.render.com (GitHub login)
2. **New → Blueprint** → select this repo (`render.yaml` included)
3. Deploy → use the `https://coastapply.onrender.com` (or similar) URL immediately
4. Set `APP_BASE_URL` and `CORS_ORIGINS` to that Render URL
5. Later, when Squarespace login works, point `coastapply.com` at Render/Vercel

Local/console email + local disk storage work out of the box on Render free tier for smoke demos. Swap to S3 + Resend before real production traffic.

## What you do NOT need right now

- Squarespace auth code
- Vercel account
- Custom domain DNS changes
