# Clean-Room Product Spec: Online Application Portal

## Purpose
Build a production-ready web application portal that allows applicants to submit a multi-step application, upload supporting documents, and optionally invite co-applicants.

## Clean-Room Rule
Implementation must be original and based only on this spec.
Do not copy or adapt code from prior files/repositories.

## Core User Flows

### A. Landing + Start
1. User opens landing page.
2. User can start a new application.
3. User sees progress indicator through all form steps.

### B. Multi-Step Application
Collect these sections:
1. Applicant details
2. Identity details
3. Employment/income
4. Address/rental history
5. Household details
6. References
7. Supporting documents
8. Review + declaration + submit

### C. Co-Applicant Invite
1. Primary applicant can add co-applicant email(s).
2. System sends invite email(s).
3. Track invite state (queued/sent/failed) in UI.

### D. Submission
1. User completes declaration.
2. App validates required fields and required files.
3. App generates summary packet (PDF).
4. App submits payload + files to backend.
5. User gets success/failure feedback.

## Functional Requirements

### Frontend
- Responsive UI for desktop/mobile.
- Step navigation: Next/Back.
- Save draft locally (local storage).
- Field-level validation and section-level validation.
- File upload UI with filename + size display.
- Review step summarizing all entered values.
- Submit state handling (busy, success, error).

### Backend APIs
#### 1) POST /api/application/submit
- Content-Type: multipart/form-data
- Accept:
  - structured application fields
  - generated summary PDF attachment
  - uploaded supporting docs
- Return JSON:
  - success: true/false
  - message
  - submission_id (on success)

#### 2) POST /api/application/invite
- Accept JSON or form payload:
  - invitee email
  - inviter name/email
  - application group/reference
- Send transactional invite email.
- Return JSON success/failure.

## Validation Rules
- Required fields must be enforced server-side.
- Email format validation.
- Numeric/date validation where applicable.
- File constraints:
  - allowed types (pdf/jpg/png/doc/docx etc)
  - max file size per file
  - max total upload size

## Security Requirements
- Server-side validation for all inputs.
- Rate limiting on submit/invite endpoints.
- CORS restricted to configured frontend origin(s).
- Secrets only in environment variables.
- No hardcoded credentials.
- Basic audit logging for submit/invite events.
- Graceful error handling without leaking internals.

## Storage Requirements
- Persist submission payload metadata.
- Persist uploaded documents + generated PDF packet.
- Return/store file references for later review.

## Email Requirements
- Invite email delivery.
- Submission notification email delivery.
- Retry/failure handling and useful error responses.

## Non-Functional Requirements
- Production-ready deployment configuration.
- HTTPS support.
- Clear environment config for dev/staging/prod.
- Readable logs for debugging.

## Deployment & Ops Deliverables
- `.env.example` with all required vars.
- README with:
  - local run steps
  - deployment steps
  - rollback steps
  - smoke test steps

## Acceptance Criteria (Must Pass)
1. New application can be completed end-to-end.
2. Required validation prevents bad submits.
3. Document uploads are accepted and stored.
4. Summary PDF is generated and included in submission.
5. Invite endpoint sends invites successfully.
6. Success and error states are visible in UI.
7. Deployment is reproducible from README.