import { useEffect, useState, type FormEvent } from "react";
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

const TOKEN_KEY = "coastapply.admin.token";

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export default function AdminApp() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SubmissionSummary[]>([]);
  const [selected, setSelected] = useState<SubmissionDetail | null>(null);

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
    const url = `/api/admin/submissions/${submissionId}/file?key=${encodeURIComponent(file.key)}&token=${encodeURIComponent(token)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function downloadZip(submissionId: string) {
    const url = `/api/admin/submissions/${submissionId}/download.zip?token=${encodeURIComponent(token)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setSelected(null);
    setItems([]);
  }

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
        <main className="panel stack">
          <div className="panel-head">
            <div>
              <h1>{selected.submission_id.slice(0, 8)}…</h1>
              <p className="muted">{new Date(selected.created_at).toLocaleString()}</p>
            </div>
            <div className="cta-row">
              <button type="button" className="btn primary" onClick={() => downloadZip(selected.submission_id)}>
                Download ZIP
              </button>
              <button type="button" className="btn ghost" onClick={() => setSelected(null)}>
                Back to list
              </button>
            </div>
          </div>

          <div className="review-block">
            <h3>Applicant</h3>
            <pre className="admin-pre">{JSON.stringify(selected.payload, null, 2)}</pre>
          </div>

          <div className="review-block">
            <h3>Files ({selected.files.length})</h3>
            <ul className="admin-file-list">
              {selected.files.map((file) => (
                <li key={file.key}>
                  <div>
                    <strong>{file.originalName}</strong>
                    <span className="muted">
                      {" "}
                      · {file.category} · {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => downloadFile(selected.submission_id, file)}
                  >
                    Download
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </main>
      ) : (
        <main className="panel">
          <div className="panel-head">
            <h1>All submissions</h1>
            <p className="muted">{loading ? "Loading…" : `${items.length} total`}</p>
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
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.submission_id}>
                      <td>{new Date(item.created_at).toLocaleString()}</td>
                      <td>
                        <div>{item.applicant_name}</div>
                        <div className="muted">{item.applicant_email}</div>
                      </td>
                      <td>{item.role === "co_applicant" ? "Co-applicant" : "Primary"}</td>
                      <td>{item.file_count}</td>
                      <td>
                        <button
                          type="button"
                          className="btn ghost"
                          onClick={() => void openSubmission(item.submission_id)}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
