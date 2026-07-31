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
| Hosting | Render (Node process) at **coastapply.com** |

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

## Go live: https://coastapply.com

Public applicants should only ever see **coastapply.com**.

1. **Deploy the app on Render** (GitHub login, no Vercel):  
   https://render.com/deploy?repo=https://github.com/sammyscottreid44-prog/CoastalProperties
2. **Point the domain** in Squarespace DNS (details in `docs/SQUARESPACE_DNS.md`):

| Type | Host | Data |
| --- | --- | --- |
| **A** | `@` | `216.24.57.1` |
| **CNAME** | `www` | `coastapply.onrender.com` |

(Use your real `*.onrender.com` hostname if Render names it differently. Delete the old Squarespace website A records first.)

3. In Render → Custom Domains → add `coastapply.com` + `www.coastapply.com`.
4. Confirm https://coastapply.com and https://coastapply.com/api/health.

Optional later: set `RESEND_API_KEY` / S3 vars on Render for real email + durable file storage.

## Rollback

```bash
git checkout <previous-git-sha>
npm install
npm run build
npm start
```

Or in Render: Deployments → redeploy a previous successful deploy.

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
| Reproducible deploy | This README + `.env.example` + `render.yaml` |
