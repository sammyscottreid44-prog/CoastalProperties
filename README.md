# Northline Application Portal

Clean-room, production-ready online application portal built from `CLEANROOM_SPEC.md`.

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
- For production: S3-compatible bucket credentials + Resend API key + verified sending domain

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

### Production-like local run (built assets, single process)

```bash
cp .env.example .env
# edit .env with real S3 + Resend values, then:
export NODE_ENV=production
# or keep development and set STORAGE_DRIVER=s3 / EMAIL_DRIVER=resend
npm install
npm run build
npm start
```

Open http://localhost:3001

## Environment variables

See `.env.example` for the full list. Production (`NODE_ENV=production`) **requires** real values for:

- `CORS_ORIGINS`
- `APP_BASE_URL`
- `NOTIFY_EMAIL`
- When `STORAGE_DRIVER=s3`: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- When `EMAIL_DRIVER=resend`: `RESEND_API_KEY`, `EMAIL_FROM`

There are no unresolved placeholder credentials in production config: missing required vars fail fast at startup.

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

## Deploy to Vercel

1. Create a Vercel project from this repository.
2. Set **Root Directory** to the repo root.
3. Configure environment variables in the Vercel dashboard (use production values from `.env.example`):

```text
NODE_ENV=production
APP_BASE_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app
STORAGE_DRIVER=s3
S3_BUCKET=...
S3_REGION=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_ENDPOINT=                 # optional for R2/MinIO
S3_FORCE_PATH_STYLE=false
EMAIL_DRIVER=resend
RESEND_API_KEY=...
EMAIL_FROM=Northline Applications <applications@your-domain.com>
NOTIFY_EMAIL=operations@your-domain.com
```

4. Deploy:

```bash
npx vercel --prod
```

Or connect the GitHub repo and deploy via the Vercel Git integration.

### Exact go-live command sequence

```bash
cp .env.example .env
# Fill production secrets in .env and Vercel project settings (never commit .env)
npm install
npm run build
npm run smoke          # against a running local server first
npx vercel link        # once
npx vercel env pull    # optional sync check
npx vercel --prod
SMOKE_API_BASE=https://your-app.vercel.app npm run smoke
```

> Note: Vercel serverless has request body size limits. For large document packets, run the Express server as a long-lived Node process (container/VM) pointed at the same env vars, and host the frontend on Vercel with `VITE_API_BASE_URL` set to that API origin (include that origin’s frontend URL in `CORS_ORIGINS`).

## Rollback

### Vercel

```bash
npx vercel ls
npx vercel rollback <deployment-url>
```

Or in the Vercel UI: Project → Deployments → ⋮ on a previous production deployment → **Promote to Production**.

### Node single-process host

1. Keep the previous release artifact/image.
2. Redeploy the last known-good commit/tag:

```bash
git checkout <previous-git-sha>
npm install
npm run build
npm start
```

3. Confirm `/api/health` and a smoke submit against the rolled-back release.

## Smoke tests

Start the API (or full stack), then:

```bash
npm run smoke
# or
SMOKE_API_BASE=http://localhost:3001 npm run smoke
```

Checks:

1. Health endpoint
2. Invite send
3. Submit validation rejection
4. End-to-end submit with documents + PDF packet persistence

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
