# Point coastapply.com at CoastApply (Squarespace → Render)

**Public URL:** https://coastapply.com  
**Host:** Render (Node app from this repo)  
**DNS:** Squarespace Domains

Squarespace cannot run this app. Keep the domain there; point DNS at Render.

## 1) Deploy the app (once)

Open this link (GitHub login):

https://render.com/deploy?repo=https://github.com/sammyscottreid44-prog/CoastalProperties

1. Create / select the Blueprint from `render.yaml`
2. Set `ADMIN_PASSWORD` (and `RESEND_API_KEY` when ready)
3. Deploy → note your service URL, e.g. `https://coastapply.onrender.com`
4. In the service → **Settings → Custom Domains** → add:
   - `coastapply.com`
   - `www.coastapply.com`

## 2) Squarespace DNS (replace website records)

Squarespace → **Domains** → **coastapply.com** → **DNS**

**Delete** the Squarespace website A records (`198.185.159.*` / `198.49.23.*`) and any AAAA on `@` / `www`.

**Add:**

| Type | Host | Data |
| --- | --- | --- |
| **A** | `@` | `216.24.57.1` |
| **CNAME** | `www` | `coastapply.onrender.com` |

Use your real Render hostname if it differs from `coastapply.onrender.com`.

Save. Wait for Render to show the domains as verified / SSL issued.

## 3) Confirm

- https://coastapply.com → CoastApply form
- https://coastapply.com/api/health → OK
- https://coastapply.com/admin → admin login

## Email (later)

When verifying `coastapply.com` in Resend, add Resend’s TXT/CNAME/MX in the same Squarespace DNS panel. Do not remove the Render A/CNAME website records.
