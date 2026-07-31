# CoastApply — Coastal Commercial Property

Clean-room, production-ready online application portal built from `CLEANROOM_SPEC.md`.

**Operator:** Coastal Commercial Property · **ABN** 39 101 817 798  
**Domain:** [coastapply.com](https://coastapply.com)  
**Notifications:** sammyscottreid44@gmail.com

Applicants complete a multi-step form, upload supporting documents, invite co-applicants, and submit a validated application. The API stores files (local or S3-compatible), generates a PDF summary packet, and sends transactional email via Resend.

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Storage | S3-compatible (`STORAGE_DRIVER=s3`) or local disk for development |
| Email | Resend (`EMAIL_DRIVER=resend`) or console logging for development |
| Hosting | Vercel (serverless API + static frontend) or single Node process |

## Repository layout

```
frontend/     React UI
backend/      Express API + services
api/          Vercel serverless entry (exports Express app)
scripts/      Smoke tests
.env.example  Required environment variables
```

## Prerequisites

- Node.js 20+
- npm 10+
- For production: S3-compatible bucket credentials + Resend API key + verified sending domain (`coastapply.com`)

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

- Web UI: http://localhost:5173
- API: http://localhost:3001
- Vite proxies `/api/*` to the backend

Default local drivers (from `.env.example`):

- `STORAGE_DRIVER=local` → files under `./uploads`, metadata under `./data`
- `EMAIL_DRIVER=console` → invite/notification emails logged to stdout
- `NOTIFY_EMAIL=sammyscottreid44@gmail.com`

### Production-like local run (built assets, single process)

```bash
cp .env.example .env
# edit .env with real S3 + Resend values, then:
npm install
npm run build
npm start
```

Open http://localhost:3001

## Environment variables

See `.env.example` for the full list. Production (`NODE_ENV=production`) **requires** real values for:

- `CORS_ORIGINS` (e.g. `https://coastapply.com,https://www.coastapply.com`)
- `APP_BASE_URL` (e.g. `https://coastapply.com`)
- `NOTIFY_EMAIL` (default operator inbox: `sammyscottreid44@gmail.com`)
- When `STORAGE_DRIVER=s3`: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- When `EMAIL_DRIVER=resend`: `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `CoastApply <applications@coastapply.com>`)

Missing required vars fail fast at startup.

## API

### `POST /api/application/submit`

- Content-Type: `multipart/form-data`
- Fields:
  - `payload` (JSON string): application data
  - `id_document`, `proof_of_income`, `proof_of_address` (required files)
  - `additional_documents` (optional, multiple)
  - `summary_pdf` (optional client PDF; server always generates an authoritative packet)
- Response:

```json
{
  "success": true,
  "message": "Application submitted successfully",
  "submission_id": "uuid"
}
```

### `POST /api/application/invite`

```json
{
  "invitee_email": "co@example.com",
  "inviter_name": "Alex Applicant",
  "inviter_email": "alex@example.com",
  "application_group": "group-uuid"
}
```

### `GET /api/health`

Liveness + active storage/email drivers.

## Domain on Squarespace + app on Vercel

Squarespace can own/register `coastapply.com` and manage DNS. It **cannot** host this Node.js + React application portal (APIs, uploads, PDF, email). Keep the domain at Squarespace; run the app on Vercel; point Squarespace DNS at Vercel.

Your current Squarespace website A records (`198.185.159.*` / `198.49.23.*`) are for Squarespace’s website builder. Replace those website records with Vercel’s so `coastapply.com` serves CoastApply.

### A) Squarespace DNS (you do this in Squarespace Domains)

1. Log in → **Domains** → `coastapply.com` → **DNS settings** / **DNS records**.
2. Remove or disable the Squarespace **website** A / CNAME records that point at Squarespace hosting (the `198.185.159.*` / `198.49.23.*` hints).
3. Add:

| Type | Host | Data |
| --- | --- | --- |
| **A** | `@` | `76.76.21.21` |
| **CNAME** | `www` | `cname.vercel-dns.com` |

4. Leave any Squarespace **email** / Resend verification TXT / MX / DKIM records alone when you add them later.
5. Save. Propagation is often minutes; can take up to 48 hours.

### B) Vercel app deploy

1. Create a Vercel project from this GitHub repository (root directory = repo root).
2. Project → **Settings → Domains** → add `coastapply.com` and `www.coastapply.com`.
3. In Resend, verify `coastapply.com` (add the TXT/DKIM records Resend shows back into Squarespace DNS).
4. Set Vercel environment variables:

```text
NODE_ENV=production
APP_BASE_URL=https://coastapply.com
CORS_ORIGINS=https://coastapply.com,https://www.coastapply.com
STORAGE_DRIVER=s3
S3_BUCKET=...
S3_REGION=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_ENDPOINT=                 # optional for R2/MinIO
S3_FORCE_PATH_STYLE=false
EMAIL_DRIVER=resend
RESEND_API_KEY=...
EMAIL_FROM=CoastApply <applications@coastapply.com>
NOTIFY_EMAIL=sammyscottreid44@gmail.com
```

5. Deploy:

```bash
npx vercel --prod
```

### Exact go-live command sequence

```bash
cp .env.example .env
# Fill production secrets in Vercel project settings (never commit .env)
npm install
npm run build
npm run smoke          # against a running local server first
npx vercel link        # once
npx vercel --prod
# After Squarespace DNS + Vercel domain are connected:
SMOKE_API_BASE=https://coastapply.com npm run smoke
```

> Note: Vercel serverless has request body size limits. For large document packets, run the Express server as a long-lived Node process (container/VM) pointed at the same env vars, and host the frontend on Vercel with `VITE_API_BASE_URL` set to that API origin (include `https://coastapply.com` in `CORS_ORIGINS`).

## Rollback

### Vercel

```bash
npx vercel ls
npx vercel rollback <deployment-url>
```

Or in the Vercel UI: Project → Deployments → ⋮ on a previous production deployment → **Promote to Production**.

### Node single-process host

```bash
git checkout <previous-git-sha>
npm install
npm run build
npm start
```

Confirm `/api/health` and a smoke submit against the rolled-back release.

## Admin access (view / download submissions)

Open `/admin` on your deployed site and sign in with `ADMIN_PASSWORD`.

- List all submissions
- Open full application details
- Download individual files or a full ZIP

See `docs/ADMIN_ACCESS.md`.

```bash
ADMIN_PASSWORD=your-long-random-password
```

## Smoke tests

```bash
npm run smoke
# or
SMOKE_API_BASE=https://coastapply.com npm run smoke
```

Checks: health, invite send, submit validation rejection, end-to-end submit with documents + PDF packet.

## Security controls

- Zod server-side validation for submit/invite payloads
- File MIME allow-list + per-file and total size caps
- Rate limiting on `/api/application/*`
- CORS restricted to configured origins
- Secrets only via environment variables
- Structured audit logs for submit/invite events
- Generic 500 responses (no stack traces to clients)

## Acceptance mapping

| Criterion | How verified |
| --- | --- |
| End-to-end application | UI flow + `npm run smoke` submit |
| Required validation | Client step validation + server Zod / required docs |
| Document uploads stored | S3 or `./uploads` + response file refs |
| Summary PDF generated | Server `pdfkit` packet stored as `summary_pdf` |
| Invite endpoint works | UI co-applicant step + smoke invite |
| Success/error UI states | Busy/success/error panels in React app |
| Reproducible deploy | This README + `.env.example` + `vercel.json` |
