import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { brand } from "../lib/brand";

type SubmissionSummary = {
  submission_id: string;
  created_at: string;
  application_group: string;
  role: string;
  applicant_name: string;
  applicant_email: string;
  file_count: number;
};

type SubmissionFile = {
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
};

type SubmissionDetail = {
  submission_id: string;
  created_at: string;
  application_group: string;
  payload: Record<string, unknown>;
  files: SubmissionFile[];
};

type PreviewFile = {
  submissionId: string;
  file: SubmissionFile;
};

const TOKEN_KEY = "coastapply.admin.token";

const CATEGORY_LABELS: Record<string, string> = {
  drivers_licence_front: "Driver licence — front",
  drivers_licence_back: "Driver licence — back",
  passport_photo: "Passport photo",
  medicare_photo: "Medicare card",
  payslips: "Payslip",
  bank_statements: "Bank statement",
  other_documents: "Other document",
};

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function display(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(file: SubmissionFile): boolean {
  return file.mimeType.startsWith("image/");
}

function isPdf(file: SubmissionFile): boolean {
  return file.mimeType === "application/pdf" || file.originalName.toLowerCase().endsWith(".pdf");
}

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category.replace(/_/g, " ");
}

function fileUrl(
  token: string,
  submissionId: string,
  file: SubmissionFile,
  inline = false,
): string {
  const params = new URLSearchParams({
    key: file.key,
    token,
  });
  if (inline) params.set("inline", "1");
  return `/api/admin/submissions/${submissionId}/file?${params.toString()}`;
}

function zipUrl(token: string, submissionId: string): string {
  return `/api/admin/submissions/${submissionId}/download.zip?token=${encodeURIComponent(token)}`;
}

function InfoGrid({ items }: { items: Array<{ label: string; value: unknown }> }) {
  return (
    <dl className="admin-info-grid">
      {items.map((item) => (
        <div key={item.label} className="admin-info-item">
          <dt>{item.label}</dt>
          <dd>{display(item.value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="admin-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function AdminApp() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SubmissionSummary[]>([]);
  const [selected, setSelected] = useState<SubmissionDetail | null>(null);
  const [preview, setPreview] = useState<PreviewFile | null>(null);

  async function loadList(activeToken: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/submissions", {
        headers: authHeaders(activeToken),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken("");
        setError(data.message || "Login failed");
        return;
      }
      setItems(data.submissions ?? []);
    } catch {
      setError("Could not load submissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      void loadList(token);
    }
  }, [token]);

  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview]);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    const value = password.trim();
    if (!value) return;
    sessionStorage.setItem(TOKEN_KEY, value);
    setToken(value);
    setPassword("");
  }

  async function openSubmission(id: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        headers: authHeaders(token),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Could not open submission");
        return;
      }
      setSelected(data.submission as SubmissionDetail);
    } catch {
      setError("Could not open submission");
    } finally {
      setLoading(false);
    }
  }

  function downloadFile(submissionId: string, file: SubmissionFile) {
    window.open(fileUrl(token, submissionId, file, false), "_blank", "noopener,noreferrer");
  }

  function viewFile(submissionId: string, file: SubmissionFile) {
    if (isImage(file)) {
      setPreview({ submissionId, file });
      return;
    }
    window.open(fileUrl(token, submissionId, file, true), "_blank", "noopener,noreferrer");
  }

  function downloadZip(submissionId: string) {
    window.open(zipUrl(token, submissionId), "_blank", "noopener,noreferrer");
  }

  function downloadAllZips() {
    const url = `/api/admin/submissions/download-all.zip?token=${encodeURIComponent(token)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setSelected(null);
    setItems([]);
    setPreview(null);
  }

  const payload = useMemo(() => asRecord(selected?.payload), [selected]);
  const applicant = asRecord(payload.applicant);
  const identity = asRecord(payload.identity);
  const licence = asRecord(identity.drivers_licence);
  const passport = asRecord(identity.passport);
  const medicare = asRecord(identity.medicare);
  const employment = asRecord(payload.employment);
  const address = asRecord(payload.address);
  const household = asRecord(payload.household);
  const references = asRecord(payload.references);
  const declaration = asRecord(payload.declaration);
  const coApplicants = Array.isArray(payload.co_applicants) ? payload.co_applicants : [];

  const filesByCategory = useMemo(() => {
    if (!selected) return [] as Array<[string, SubmissionFile[]]>;
    const map = new Map<string, SubmissionFile[]>();
    for (const file of selected.files) {
      const list = map.get(file.category) ?? [];
      list.push(file);
      map.set(file.category, list);
    }
    return Array.from(map.entries());
  }, [selected]);

  const applicantTitle = selected
    ? `${display(applicant.first_name)} ${display(applicant.last_name)}`.replace(/— /g, "").trim() ||
      selected.submission_id.slice(0, 8)
    : "";

  if (!token) {
    return (
      <div className="shell">
        <header className="topbar">
          <div>
            <p className="brand-mark compact">{brand.productName}</p>
            <p className="brand-legal compact">Admin access</p>
          </div>
          <a className="linkish" href="/">
            Back to application
          </a>
        </header>
        <main className="panel" style={{ maxWidth: 480 }}>
          <h1>Admin login</h1>
          <p className="muted">Enter your admin password to view and download submissions.</p>
          <form className="stack" onSubmit={(e) => void onLogin(e)}>
            <label className="field">
              <span className="field-label">Admin password</span>
              <input
                className="control"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            {error ? (
              <div className="alert error" role="alert">
                {error}
              </div>
            ) : null}
            <button className="btn primary" type="submit">
              Sign in
            </button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="brand-mark compact">{brand.productName}</p>
          <p className="brand-legal compact">Submissions admin</p>
        </div>
        <div className="cta-row">
          <button type="button" className="btn ghost" onClick={() => void loadList(token)}>
            Refresh
          </button>
          <button type="button" className="btn ghost" onClick={logout}>
            Log out
          </button>
          <a className="linkish" href="/">
            Application form
          </a>
        </div>
      </header>

      {error ? (
        <div className="alert error" role="alert">
          {error}
        </div>
      ) : null}

      {selected ? (
        <main className="panel stack admin-detail">
          <div className="panel-head admin-detail-head">
            <div>
              <p className="admin-eyebrow">
                {payload.role === "co_applicant" ? "Co-applicant" : "Primary applicant"}
              </p>
              <h1>{applicantTitle}</h1>
              <p className="muted">
                Submitted {new Date(selected.created_at).toLocaleString()} · Group{" "}
                <code>{selected.application_group}</code>
              </p>
            </div>
            <div className="cta-row">
              <button
                type="button"
                className="btn primary"
                onClick={() => downloadZip(selected.submission_id)}
              >
                Download application ZIP
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setSelected(null);
                  setPreview(null);
                }}
              >
                Back to list
              </button>
            </div>
          </div>

          <Section title="Applicant">
            <InfoGrid
              items={[
                { label: "First name", value: applicant.first_name },
                { label: "Last name", value: applicant.last_name },
                { label: "Email", value: applicant.email },
                { label: "Phone", value: applicant.phone },
                { label: "Date of birth", value: applicant.date_of_birth },
              ]}
            />
          </Section>

          <Section title="Identity">
            <InfoGrid items={[{ label: "Nationality", value: identity.nationality }]} />
            <div className="admin-subgrid">
              <div className="admin-subsection">
                <h3>Driver licence</h3>
                <InfoGrid
                  items={[
                    { label: "Number", value: licence.number },
                    { label: "State", value: licence.state },
                    { label: "Expiry", value: licence.expiry },
                  ]}
                />
              </div>
              <div className="admin-subsection">
                <h3>Passport</h3>
                <InfoGrid
                  items={[
                    { label: "Number", value: passport.number },
                    { label: "Country", value: passport.country },
                    { label: "Expiry", value: passport.expiry },
                  ]}
                />
              </div>
              <div className="admin-subsection">
                <h3>Medicare</h3>
                <InfoGrid
                  items={[
                    { label: "Card number", value: medicare.card_number },
                    { label: "IRN", value: medicare.reference_number },
                    { label: "Colour", value: medicare.card_colour },
                    { label: "Expiry", value: medicare.expiry },
                  ]}
                />
              </div>
            </div>
          </Section>

          <Section title="Employment">
            <InfoGrid
              items={[
                { label: "Status", value: employment.status },
                { label: "Employer", value: employment.employer },
                { label: "Job title", value: employment.job_title },
                { label: "Monthly income", value: employment.monthly_income },
                { label: "Start date", value: employment.start_date },
              ]}
            />
          </Section>

          <Section title="Address">
            <InfoGrid
              items={[
                { label: "Current address", value: address.current_address },
                { label: "City", value: address.city },
                { label: "State", value: address.state },
                { label: "Postal code", value: address.postal_code },
                { label: "Years at address", value: address.years_at_address },
                { label: "Monthly rent", value: address.monthly_rent },
                { label: "Landlord name", value: address.landlord_name },
                { label: "Landlord phone", value: address.landlord_phone },
                { label: "Previous address", value: address.previous_address },
              ]}
            />
          </Section>

          <Section title="Household">
            <InfoGrid
              items={[
                {
                  label: "People living in household",
                  value: household.people_living_in_household,
                },
                { label: "Dependents", value: household.dependents },
                { label: "Pets", value: household.has_pets },
                { label: "Pet details", value: household.pet_details },
              ]}
            />
          </Section>

          <Section title="References">
            <div className="admin-subgrid">
              <div className="admin-subsection">
                <h3>Reference 1</h3>
                <InfoGrid
                  items={[
                    { label: "Name", value: references.reference_1_name },
                    { label: "Phone", value: references.reference_1_phone },
                    { label: "Email", value: references.reference_1_email },
                    { label: "Relationship", value: references.reference_1_relationship },
                  ]}
                />
              </div>
              <div className="admin-subsection">
                <h3>Reference 2</h3>
                <InfoGrid
                  items={[
                    { label: "Name", value: references.reference_2_name },
                    { label: "Phone", value: references.reference_2_phone },
                    { label: "Email", value: references.reference_2_email },
                    { label: "Relationship", value: references.reference_2_relationship },
                  ]}
                />
              </div>
            </div>
          </Section>

          <Section title="Declaration">
            <InfoGrid
              items={[
                { label: "Accepted", value: declaration.accepted },
                { label: "Signature name", value: declaration.signature_name },
                { label: "Signed at", value: declaration.signed_at },
              ]}
            />
          </Section>

          {coApplicants.length > 0 ? (
            <Section title="Co-applicants">
              <ul className="admin-simple-list">
                {coApplicants.map((item, index) => {
                  const row = asRecord(item);
                  return (
                    <li key={`${display(row.email)}-${index}`}>
                      <strong>{display(row.email)}</strong>
                      <span className="muted"> · {display(row.status)}</span>
                    </li>
                  );
                })}
              </ul>
            </Section>
          ) : null}

          <Section title={`Uploaded files (${selected.files.length})`}>
            {selected.files.length === 0 ? (
              <p className="muted">No files uploaded.</p>
            ) : (
              <div className="admin-file-groups">
                {filesByCategory.map(([category, files]) => (
                  <div key={category} className="admin-file-group">
                    <h3>{categoryLabel(category)}</h3>
                    <ul className="admin-file-list">
                      {files.map((file) => (
                        <li key={file.key}>
                          <div className="admin-file-meta">
                            {isImage(file) ? (
                              <button
                                type="button"
                                className="admin-thumb-btn"
                                onClick={() => viewFile(selected.submission_id, file)}
                                aria-label={`View ${file.originalName}`}
                              >
                                <img
                                  src={fileUrl(token, selected.submission_id, file, true)}
                                  alt=""
                                  className="admin-thumb"
                                />
                              </button>
                            ) : (
                              <div className={`admin-file-icon ${isPdf(file) ? "pdf" : ""}`}>
                                {isPdf(file) ? "PDF" : "FILE"}
                              </div>
                            )}
                            <div>
                              <strong>{file.originalName}</strong>
                              <div className="muted">
                                {file.mimeType || "unknown type"} · {formatBytes(file.size)}
                              </div>
                            </div>
                          </div>
                          <div className="admin-file-actions">
                            {(isImage(file) || isPdf(file)) && (
                              <button
                                type="button"
                                className="btn primary"
                                onClick={() => viewFile(selected.submission_id, file)}
                              >
                                View
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn ghost"
                              onClick={() => downloadFile(selected.submission_id, file)}
                            >
                              Download
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <div className="admin-detail-footer">
            <button
              type="button"
              className="btn primary"
              onClick={() => downloadZip(selected.submission_id)}
            >
              Download full application ZIP
            </button>
            <p className="muted">
              ZIP includes a readable summary, JSON record, and all uploaded files in folders.
            </p>
          </div>
        </main>
      ) : (
        <main className="panel">
          <div className="panel-head">
            <div>
              <h1>All applications</h1>
              <p className="muted">{loading ? "Loading…" : `${items.length} total`}</p>
            </div>
            {items.length > 0 ? (
              <button type="button" className="btn primary" onClick={downloadAllZips}>
                Download all ZIPs
              </button>
            ) : null}
          </div>
          {items.length === 0 && !loading ? (
            <p className="muted">No submissions yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Applicant</th>
                    <th>Role</th>
                    <th>Files</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.submission_id}>
                      <td>{new Date(item.created_at).toLocaleString()}</td>
                      <td>
                        <div className="admin-name">{item.applicant_name || "Unnamed"}</div>
                        <div className="muted">{item.applicant_email}</div>
                      </td>
                      <td>{item.role === "co_applicant" ? "Co-applicant" : "Primary"}</td>
                      <td>{item.file_count}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="btn primary"
                            onClick={() => void openSubmission(item.submission_id)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="btn ghost"
                            onClick={() => downloadZip(item.submission_id)}
                          >
                            ZIP
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      )}

      {preview ? (
        <div
          className="admin-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={preview.file.originalName}
          onClick={() => setPreview(null)}
        >
          <div className="admin-lightbox-panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-lightbox-head">
              <div>
                <strong>{preview.file.originalName}</strong>
                <div className="muted">{categoryLabel(preview.file.category)}</div>
              </div>
              <div className="cta-row">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => downloadFile(preview.submissionId, preview.file)}
                >
                  Download
                </button>
                <button type="button" className="btn primary" onClick={() => setPreview(null)}>
                  Close
                </button>
              </div>
            </div>
            <img
              src={fileUrl(token, preview.submissionId, preview.file, true)}
              alt={preview.file.originalName}
              className="admin-lightbox-image"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
