import type { Dispatch, SetStateAction } from "react";
import { Field, TextInput, TextSelect, TextTextarea } from "../components/Field";
import { FilePicker } from "../components/FilePicker";
import { sendInvite } from "../lib/api";
import type { ApplicationForm, CoApplicant } from "../types/application";

type Common = {
  form: ApplicationForm;
  setForm: Dispatch<SetStateAction<ApplicationForm>>;
};

export function ApplicantStep({ form, setForm }: Common) {
  const a = form.applicant;
  return (
    <div className="grid two">
      <Field label="First name *">
        <TextInput
          value={a.first_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, applicant: { ...f.applicant, first_name: e.target.value } }))
          }
        />
      </Field>
      <Field label="Last name *">
        <TextInput
          value={a.last_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, applicant: { ...f.applicant, last_name: e.target.value } }))
          }
        />
      </Field>
      <Field label="Email *">
        <TextInput
          type="email"
          value={a.email}
          onChange={(e) =>
            setForm((f) => ({ ...f, applicant: { ...f.applicant, email: e.target.value } }))
          }
        />
      </Field>
      <Field label="Phone *">
        <TextInput
          type="tel"
          value={a.phone}
          onChange={(e) =>
            setForm((f) => ({ ...f, applicant: { ...f.applicant, phone: e.target.value } }))
          }
        />
      </Field>
      <Field label="Date of birth *">
        <TextInput
          type="date"
          value={a.date_of_birth}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              applicant: { ...f.applicant, date_of_birth: e.target.value },
            }))
          }
        />
      </Field>
    </div>
  );
}

export function IdentityStep({ form, setForm }: Common) {
  const i = form.identity;
  return (
    <div className="grid two">
      <Field label="ID type *">
        <TextSelect
          value={i.id_type}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              identity: {
                ...f.identity,
                id_type: e.target.value as ApplicationForm["identity"]["id_type"],
              },
            }))
          }
        >
          <option value="">Select…</option>
          <option value="passport">Passport</option>
          <option value="drivers_license">Driver&apos;s license</option>
          <option value="national_id">National ID</option>
          <option value="other">Other</option>
        </TextSelect>
      </Field>
      <Field label="ID number *">
        <TextInput
          value={i.id_number}
          onChange={(e) =>
            setForm((f) => ({ ...f, identity: { ...f.identity, id_number: e.target.value } }))
          }
        />
      </Field>
      <Field label="Nationality *">
        <TextInput
          value={i.nationality}
          onChange={(e) =>
            setForm((f) => ({ ...f, identity: { ...f.identity, nationality: e.target.value } }))
          }
        />
      </Field>
    </div>
  );
}

export function EmploymentStep({ form, setForm }: Common) {
  const e = form.employment;
  return (
    <div className="grid two">
      <Field label="Employment status *">
        <TextSelect
          value={e.status}
          onChange={(ev) =>
            setForm((f) => ({
              ...f,
              employment: {
                ...f.employment,
                status: ev.target.value as ApplicationForm["employment"]["status"],
              },
            }))
          }
        >
          <option value="">Select…</option>
          <option value="employed">Employed</option>
          <option value="self_employed">Self-employed</option>
          <option value="student">Student</option>
          <option value="unemployed">Unemployed</option>
          <option value="retired">Retired</option>
        </TextSelect>
      </Field>
      <Field label="Monthly income *">
        <TextInput
          inputMode="decimal"
          value={e.monthly_income}
          onChange={(ev) =>
            setForm((f) => ({
              ...f,
              employment: { ...f.employment, monthly_income: ev.target.value },
            }))
          }
        />
      </Field>
      <Field label="Employer">
        <TextInput
          value={e.employer}
          onChange={(ev) =>
            setForm((f) => ({ ...f, employment: { ...f.employment, employer: ev.target.value } }))
          }
        />
      </Field>
      <Field label="Job title">
        <TextInput
          value={e.job_title}
          onChange={(ev) =>
            setForm((f) => ({ ...f, employment: { ...f.employment, job_title: ev.target.value } }))
          }
        />
      </Field>
      <Field label="Start date">
        <TextInput
          type="date"
          value={e.start_date}
          onChange={(ev) =>
            setForm((f) => ({ ...f, employment: { ...f.employment, start_date: ev.target.value } }))
          }
        />
      </Field>
    </div>
  );
}

export function AddressStep({ form, setForm }: Common) {
  const a = form.address;
  return (
    <div className="grid two">
      <Field label="Current address *">
        <TextInput
          value={a.current_address}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              address: { ...f.address, current_address: e.target.value },
            }))
          }
        />
      </Field>
      <Field label="City *">
        <TextInput
          value={a.city}
          onChange={(e) =>
            setForm((f) => ({ ...f, address: { ...f.address, city: e.target.value } }))
          }
        />
      </Field>
      <Field label="State / Province *">
        <TextInput
          value={a.state}
          onChange={(e) =>
            setForm((f) => ({ ...f, address: { ...f.address, state: e.target.value } }))
          }
        />
      </Field>
      <Field label="Postal code *">
        <TextInput
          value={a.postal_code}
          onChange={(e) =>
            setForm((f) => ({ ...f, address: { ...f.address, postal_code: e.target.value } }))
          }
        />
      </Field>
      <Field label="Years at address *">
        <TextInput
          value={a.years_at_address}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              address: { ...f.address, years_at_address: e.target.value },
            }))
          }
        />
      </Field>
      <Field label="Monthly rent *">
        <TextInput
          value={a.monthly_rent}
          onChange={(e) =>
            setForm((f) => ({ ...f, address: { ...f.address, monthly_rent: e.target.value } }))
          }
        />
      </Field>
      <Field label="Landlord name">
        <TextInput
          value={a.landlord_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, address: { ...f.address, landlord_name: e.target.value } }))
          }
        />
      </Field>
      <Field label="Landlord phone">
        <TextInput
          value={a.landlord_phone}
          onChange={(e) =>
            setForm((f) => ({ ...f, address: { ...f.address, landlord_phone: e.target.value } }))
          }
        />
      </Field>
      <Field label="Previous address">
        <TextInput
          value={a.previous_address}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              address: { ...f.address, previous_address: e.target.value },
            }))
          }
        />
      </Field>
    </div>
  );
}

export function HouseholdStep({ form, setForm }: Common) {
  const h = form.household;
  return (
    <div className="grid two">
      <Field label="Household size *">
        <TextInput
          value={h.household_size}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              household: { ...f.household, household_size: e.target.value },
            }))
          }
        />
      </Field>
      <Field label="Dependents *">
        <TextInput
          value={h.dependents}
          onChange={(e) =>
            setForm((f) => ({ ...f, household: { ...f.household, dependents: e.target.value } }))
          }
        />
      </Field>
      <Field label="Pets *">
        <TextSelect
          value={h.has_pets}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              household: {
                ...f.household,
                has_pets: e.target.value as ApplicationForm["household"]["has_pets"],
              },
            }))
          }
        >
          <option value="">Select…</option>
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </TextSelect>
      </Field>
      <Field label="Pet details" hint="Required if you have pets">
        <TextTextarea
          value={h.pet_details}
          onChange={(e) =>
            setForm((f) => ({ ...f, household: { ...f.household, pet_details: e.target.value } }))
          }
        />
      </Field>
    </div>
  );
}

export function ReferencesStep({ form, setForm }: Common) {
  const r = form.references;
  function setRef(key: keyof ApplicationForm["references"], value: string) {
    setForm((f) => ({ ...f, references: { ...f.references, [key]: value } }));
  }
  return (
    <div className="stack">
      <h3>Reference 1</h3>
      <div className="grid two">
        <Field label="Name *">
          <TextInput value={r.reference_1_name} onChange={(e) => setRef("reference_1_name", e.target.value)} />
        </Field>
        <Field label="Relationship *">
          <TextInput
            value={r.reference_1_relationship}
            onChange={(e) => setRef("reference_1_relationship", e.target.value)}
          />
        </Field>
        <Field label="Phone *">
          <TextInput value={r.reference_1_phone} onChange={(e) => setRef("reference_1_phone", e.target.value)} />
        </Field>
        <Field label="Email *">
          <TextInput
            type="email"
            value={r.reference_1_email}
            onChange={(e) => setRef("reference_1_email", e.target.value)}
          />
        </Field>
      </div>
      <h3>Reference 2</h3>
      <div className="grid two">
        <Field label="Name *">
          <TextInput value={r.reference_2_name} onChange={(e) => setRef("reference_2_name", e.target.value)} />
        </Field>
        <Field label="Relationship *">
          <TextInput
            value={r.reference_2_relationship}
            onChange={(e) => setRef("reference_2_relationship", e.target.value)}
          />
        </Field>
        <Field label="Phone *">
          <TextInput value={r.reference_2_phone} onChange={(e) => setRef("reference_2_phone", e.target.value)} />
        </Field>
        <Field label="Email *">
          <TextInput
            type="email"
            value={r.reference_2_email}
            onChange={(e) => setRef("reference_2_email", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

export function DocumentsStep({ form, setForm }: Common) {
  return (
    <div className="stack">
      <FilePicker
        label="Government ID"
        required
        files={form.documents.id_document ? [form.documents.id_document] : []}
        onChange={(files) =>
          setForm((f) => ({
            ...f,
            documents: { ...f.documents, id_document: files[0] ?? null },
          }))
        }
      />
      <FilePicker
        label="Proof of income"
        required
        files={form.documents.proof_of_income ? [form.documents.proof_of_income] : []}
        onChange={(files) =>
          setForm((f) => ({
            ...f,
            documents: { ...f.documents, proof_of_income: files[0] ?? null },
          }))
        }
      />
      <FilePicker
        label="Proof of address"
        required
        files={form.documents.proof_of_address ? [form.documents.proof_of_address] : []}
        onChange={(files) =>
          setForm((f) => ({
            ...f,
            documents: { ...f.documents, proof_of_address: files[0] ?? null },
          }))
        }
      />
      <FilePicker
        label="Additional documents"
        multiple
        files={form.documents.additional_documents}
        onChange={(files) =>
          setForm((f) => ({
            ...f,
            documents: { ...f.documents, additional_documents: files },
          }))
        }
      />
    </div>
  );
}

export function InviteStep({ form, setForm }: Common) {
  async function inviteOne(email: string, index: number) {
    setForm((f) => {
      const next = [...f.co_applicants];
      next[index] = { ...next[index], status: "queued", message: "Sending…" };
      return { ...f, co_applicants: next };
    });

    const result = await sendInvite({
      invitee_email: email,
      inviter_name: `${form.applicant.first_name} ${form.applicant.last_name}`.trim() || "Applicant",
      inviter_email: form.applicant.email || "unknown@example.com",
      application_group: form.application_group,
    });

    setForm((f) => {
      const next = [...f.co_applicants];
      next[index] = {
        ...next[index],
        status: result.success ? "sent" : "failed",
        message: result.message || result.error,
      };
      return { ...f, co_applicants: next };
    });
  }

  function addRow() {
    setForm((f) => ({
      ...f,
      co_applicants: [...f.co_applicants, { email: "", status: "queued" } satisfies CoApplicant],
    }));
  }

  return (
    <div className="stack">
      <p className="muted">
        Optionally invite co-applicants. Invites are sent immediately and status is tracked below.
      </p>
      {form.co_applicants.map((c, index) => (
        <div className="invite-row" key={`invite-${index}`}>
          <Field label="Co-applicant email">
            <TextInput
              type="email"
              value={c.email}
              onChange={(e) =>
                setForm((f) => {
                  const next = [...f.co_applicants];
                  next[index] = { ...next[index], email: e.target.value };
                  return { ...f, co_applicants: next };
                })
              }
            />
          </Field>
          <div className="invite-actions">
            <span className={`status-pill status-${c.status}`}>{c.status}</span>
            <button
              type="button"
              className="btn ghost"
              disabled={!c.email.includes("@") || c.status === "sent"}
              onClick={() => void inviteOne(c.email, index)}
            >
              Send invite
            </button>
            <button
              type="button"
              className="linkish"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  co_applicants: f.co_applicants.filter((_, i) => i !== index),
                }))
              }
            >
              Remove
            </button>
          </div>
          {c.message ? <p className="muted">{c.message}</p> : null}
        </div>
      ))}
      <button type="button" className="btn ghost" onClick={addRow}>
        Add co-applicant
      </button>
    </div>
  );
}

export function ReviewStep({ form, setForm }: Common) {
  return (
    <div className="stack">
      <div className="review-block">
        <h3>Applicant</h3>
        <p>
          {form.applicant.first_name} {form.applicant.last_name} · {form.applicant.email} ·{" "}
          {form.applicant.phone}
        </p>
      </div>
      <div className="review-block">
        <h3>Identity</h3>
        <p>
          {form.identity.id_type} · {form.identity.id_number} · {form.identity.nationality}
        </p>
      </div>
      <div className="review-block">
        <h3>Employment</h3>
        <p>
          {form.employment.status} · income {form.employment.monthly_income} ·{" "}
          {form.employment.employer || "n/a"}
        </p>
      </div>
      <div className="review-block">
        <h3>Address</h3>
        <p>
          {form.address.current_address}, {form.address.city}, {form.address.state}{" "}
          {form.address.postal_code}
        </p>
      </div>
      <div className="review-block">
        <h3>Household</h3>
        <p>
          Size {form.household.household_size}, dependents {form.household.dependents}, pets{" "}
          {form.household.has_pets}
        </p>
      </div>
      <div className="review-block">
        <h3>Documents</h3>
        <ul>
          <li>ID: {form.documents.id_document?.name ?? "missing"}</li>
          <li>Income: {form.documents.proof_of_income?.name ?? "missing"}</li>
          <li>Address: {form.documents.proof_of_address?.name ?? "missing"}</li>
          <li>Additional: {form.documents.additional_documents.length}</li>
        </ul>
      </div>
      <div className="review-block">
        <h3>Co-applicants</h3>
        {form.co_applicants.length === 0 ? (
          <p className="muted">None</p>
        ) : (
          <ul>
            {form.co_applicants.map((c) => (
              <li key={c.email}>
                {c.email} — {c.status}
              </li>
            ))}
          </ul>
        )}
      </div>
      <label className="declare">
        <input
          type="checkbox"
          checked={form.declaration.accepted}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              declaration: { ...f.declaration, accepted: e.target.checked },
            }))
          }
        />
        <span>
          I declare that the information provided is true and complete to the best of my knowledge.
        </span>
      </label>
      <Field label="Type your full name as signature *">
        <TextInput
          value={form.declaration.signature_name}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              declaration: { ...f.declaration, signature_name: e.target.value },
            }))
          }
        />
      </Field>
    </div>
  );
}
