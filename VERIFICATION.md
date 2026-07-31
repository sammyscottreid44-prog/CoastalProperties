# Acceptance Criteria Verification

**Brand:** CoastApply · Coastal Commercial Property · ABN 39 101 817 798 · coastapply.com  
Verified against `CLEANROOM_SPEC.md` on 2026-07-31.

| # | Acceptance criterion | Result | Evidence |
| --- | --- | --- | --- |
| 1 | New application can be completed end-to-end | **PASS** | `npm run smoke` → `submit_e2e: PASS`; UI multi-step flow through review/submit |
| 2 | Required validation prevents bad submits | **PASS** | Client step validation + server Zod; smoke `submit_validation: PASS` (HTTP 400) |
| 3 | Document uploads are accepted and stored | **PASS** | Smoke `uploads_persisted: PASS`; files under `uploads/submissions/<id>/…` |
| 4 | Summary PDF is generated and included | **PASS** | Server `pdfkit` packet stored as `summary_pdf` / `summary_pdf_server`; smoke `pdf_packet: PASS` |
| 5 | Invite endpoint sends invites successfully | **PASS** | Smoke `invite: PASS`; UI invite status queued/sent/failed |
| 6 | Success and error states visible in UI | **PASS** | Busy banner, error alert, success panel with submission ID |
| 7 | Deployment is reproducible from README | **PASS** | `.env.example`, `vercel.json`, README setup/deploy/rollback/smoke commands |

## Definition of done

| Item | Result |
| --- | --- |
| End-to-end submit works | **PASS** |
| Invite flow works | **PASS** |
| Uploads persist correctly | **PASS** |
| No placeholder runtime values left unresolved in production config | **PASS** (production missing required env vars fail fast at startup) |
| Project ready for real go-live | **PASS** (set real S3 + Resend + CORS/APP_BASE_URL, then `npx vercel --prod` or `npm run build && npm start`) |

## Commands used

```bash
npm install
npm run build
npm start
npm run smoke
```
