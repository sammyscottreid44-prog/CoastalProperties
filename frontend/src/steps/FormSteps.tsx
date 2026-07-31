import type { Dispatch, SetStateAction } from "react";
import { Field, TextInput, TextSelect, TextTextarea } from "../components/Field";
import { FilePicker } from "../components/FilePicker";
import { sendInvite } from "../lib/api";
import { brand } from "../lib/brand";
import type { ApplicationForm, CoApplicant, MedicareColour } from "../types/application";

const PHOTO_ACCEPT = ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";
const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

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
    <div className="stack">
      <p className="muted">
        Provide details and clear photos for all three identification documents: Australian driver
        licence (front and back), passport, and Medicare card.
      </p>

      <Field label="Nationality *">
        <TextInput
          value={i.nationality}
          onChange={(e) =>
            setForm((f) => ({ ...f, identity: { ...f.identity, nationality: e.target.value } }))
          }
        />
      </Field>

      <div className="id-block">
        <h3>Australian driver licence</h3>
        <div className="stack nested">
          <div className="grid two">
            <Field label="Licence number *">
              <TextInput
                value={i.drivers_licence.number}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    identity: {
                      ...f.identity,
                      drivers_licence: { ...f.identity.drivers_licence, number: e.target.value },
                    },
                  }))
                }
              />
            </Field>
            <Field label="State *">
              <TextSelect
                value={i.drivers_licence.state}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    identity: {
                      ...f.identity,
                      drivers_licence: { ...f.identity.drivers_licence, state: e.target.value },
                    },
                  }))
                }
              >
                <option value="">Select…</option>
                {AU_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field label="Expiry *">
              <TextInput
                type="date"
                value={i.drivers_licence.expiry}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    identity: {
                      ...f.identity,
                      drivers_licence: { ...f.identity.drivers_licence, expiry: e.target.value },
                    },
                  }))
                }
              />
            </Field>
          </div>
          <FilePicker
            label="Licence photo — front"
            required
            accept={PHOTO_ACCEPT}
            files={i.drivers_licence.front ? [i.drivers_licence.front] : []}
            onChange={(files) =>
              setForm((f) => ({
                ...f,
                identity: {
                  ...f.identity,
                  drivers_licence: { ...f.identity.drivers_licence, front: files[0] ?? null },
                },
              }))
            }
          />
          <FilePicker
            label="Licence photo — back"
            required
            accept={PHOTO_ACCEPT}
            files={i.drivers_licence.back ? [i.drivers_licence.back] : []}
            onChange={(files) =>
              setForm((f) => ({
                ...f,
                identity: {
                  ...f.identity,
                  drivers_licence: { ...f.identity.drivers_licence, back: files[0] ?? null },
                },
              }))
            }
          />
        </div>
      </div>

      <div className="id-block">
        <h3>Passport</h3>
        <div className="stack nested">
          <div className="grid two">
            <Field label="Passport number *">
              <TextInput
                value={i.passport.number}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    identity: {
                      ...f.identity,
                      passport: { ...f.identity.passport, number: e.target.value },
                    },
                  }))
                }
              />
            </Field>
            <Field label="Country of issue *">
              <TextInput
                value={i.passport.country}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    identity: {
                      ...f.identity,
                      passport: { ...f.identity.passport, country: e.target.value },
                    },
                  }))
                }
              />
            </Field>
            <Field label="Expiry *">
              <TextInput
                type="date"
                value={i.passport.expiry}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    identity: {
                      ...f.identity,
                      passport: { ...f.identity.passport, expiry: e.target.value },
                    },
                  }))
                }
              />
            </Field>
          </div>
          <FilePicker
            label="Passport photo page"
            required
            accept={PHOTO_ACCEPT}
            files={i.passport.photo ? [i.passport.photo] : []}
            onChange={(files) =>
              setForm((f) => ({
                ...f,
                identity: {
                  ...f.identity,
                  passport: { ...f.identity.passport, photo: files[0] ?? null },
                },
              }))
            }
          />
        </div>
      </div>

      <div className="id-block">
        <h3>Medicare card</h3>
        <div className="stack nested">
          <div className="grid two">
            <Field label="Card number *">
              <TextInput
                value={i.medicare.card_number}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    identity: {
                      ...f.identity,
                      medicare: { ...f.identity.medicare, card_number: e.target.value },
                    },
                  }))
                }
              />
            </Field>
            <Field label="Reference number (IRN) *" hint="The number next to your name (1–9)">
              <TextInput
                inputMode="numeric"
                maxLength={1}
                value={i.medicare.reference_number}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    identity: {
                      ...f.identity,
                      medicare: { ...f.identity.medicare, reference_number: e.target.value },
                    },
                  }))
                }
              />
            </Field>
            <Field label="Card colour *">
              <TextSelect
                value={i.medicare.card_colour}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    identity: {
                      ...f.identity,
                      medicare: {
                        ...f.identity.medicare,
                        card_colour: e.target.value as MedicareColour,
                      },
                    },
                  }))
                }
              >
                <option value="">Select…</option>
                <option value="green">Green</option>
                <option value="blue">Blue</option>
                <option value="yellow">Yellow</option>
              </TextSelect>
            </Field>
            <Field label="Expiry (MM/YYYY) *">
              <TextInput
                placeholder="MM/YYYY"
                value={i.medicare.expiry}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    identity: {
                      ...f.identity,
                      medicare: { ...f.identity.medicare, expiry: e.target.value },
                    },
                  }))
                }
              />
            </Field>
          </div>
          <FilePicker
            label="Medicare card photo"
            required
            accept={PHOTO_ACCEPT}
            files={i.medicare.photo ? [i.medicare.photo] : []}
            onChange={(files) =>
              setForm((f) => ({
                ...f,
                identity: {
                  ...f.identity,
                  medicare: { ...f.identity.medicare, photo: files[0] ?? null },
                },
              }))
            }
          />
        </div>
      </div>
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
      <Field label="People living in household *">
        <TextInput
          value={h.people_living_in_household}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              household: { ...f.household, people_living_in_household: e.target.value },
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
      <p className="muted">
        Identity photos are collected in the Identity step. Upload income and banking evidence here.
      </p>
      <FilePicker
        label="Payslips"
        required
        multiple
        files={form.documents.payslips}
        onChange={(files) =>
          setForm((f) => ({
            ...f,
            documents: { ...f.documents, payslips: files },
          }))
        }
      />
      <FilePicker
        label="Bank statements"
        required
        multiple
        files={form.documents.bank_statements}
        onChange={(files) =>
          setForm((f) => ({
            ...f,
            documents: { ...f.documents, bank_statements: files },
          }))
        }
      />
      <FilePicker
        label="Other documents"
        multiple
        files={form.documents.other_documents}
        onChange={(files) =>
          setForm((f) => ({
            ...f,
            documents: { ...f.documents, other_documents: files },
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
      inviter_email: form.applicant.email || brand.contactEmail,
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
        <p>Nationality: {form.identity.nationality}</p>
        <ul>
          <li>
            Driver licence: {form.identity.drivers_licence.number} /{" "}
            {form.identity.drivers_licence.state} · front+back photos{" "}
            {form.identity.drivers_licence.front && form.identity.drivers_licence.back
              ? "attached"
              : "missing"}
          </li>
          <li>
            Passport: {form.identity.passport.number} / {form.identity.passport.country} · photo{" "}
            {form.identity.passport.photo ? "attached" : "missing"}
          </li>
          <li>
            Medicare: {form.identity.medicare.card_number} ref{" "}
            {form.identity.medicare.reference_number} ({form.identity.medicare.card_colour}) · photo{" "}
            {form.identity.medicare.photo ? "attached" : "missing"}
          </li>
        </ul>
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
          People living in household {form.household.people_living_in_household}, dependents{" "}
          {form.household.dependents}, pets {form.household.has_pets}
        </p>
      </div>
      <div className="review-block">
        <h3>Documents</h3>
        <ul>
          <li>Payslips: {form.documents.payslips.length}</li>
          <li>Bank statements: {form.documents.bank_statements.length}</li>
          <li>Other: {form.documents.other_documents.length}</li>
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
          I declare that the information provided is true and complete to the best of my
          knowledge, and I understand it will be used by {brand.legalName} (ABN {brand.abn})
          for application assessment.
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
