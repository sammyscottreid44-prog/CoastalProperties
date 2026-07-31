import { useMemo, useState } from "react";
import { Progress } from "./components/Progress";
import { useDraft } from "./hooks/useDraft";
import { submitApplication } from "./lib/api";
import { brand } from "./lib/brand";
import { validateStep } from "./lib/validation";
import { Landing } from "./steps/Landing";
import {
  AddressStep,
  ApplicantStep,
  DocumentsStep,
  EmploymentStep,
  HouseholdStep,
  IdentityStep,
  InviteStep,
  ReferencesStep,
  ReviewStep,
} from "./steps/FormSteps";
import { STEPS, createEmptyForm } from "./types/application";

type SubmitState =
  | { status: "idle" }
  | { status: "busy" }
  | { status: "success"; submissionId: string; message: string }
  | { status: "error"; message: string };

export default function App() {
  const { form, setForm, stepIndex, setStepIndex, clearDraft } = useDraft();
  const [errors, setErrors] = useState<string[]>([]);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  const step = STEPS[stepIndex];
  const hasDraft = useMemo(() => {
    return Boolean(form.applicant.first_name || form.applicant.email);
  }, [form.applicant.email, form.applicant.first_name]);

  function goNext() {
    const issues = validateStep(step.id, form);
    setErrors(issues);
    if (issues.length) return;
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    setErrors([]);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function onSubmit() {
    const issues = [
      ...validateStep("documents", form),
      ...validateStep("review", form),
      ...validateStep("applicant", form),
    ];
    setErrors(issues);
    if (issues.length) return;

    setSubmitState({ status: "busy" });
    try {
      const result = await submitApplication(form);
      if (!result.success || !result.submission_id) {
        setSubmitState({
          status: "error",
          message: result.message || "Submission failed",
        });
        return;
      }
      setSubmitState({
        status: "success",
        submissionId: result.submission_id,
        message: result.message,
      });
      localStorage.removeItem("coastapply.application.draft.v2");
    } catch {
      setSubmitState({
        status: "error",
        message: "Network error while submitting. Please try again.",
      });
    }
  }

  function startFresh() {
    clearDraft();
    setForm(createEmptyForm());
    setSubmitState({ status: "idle" });
    setErrors([]);
    setStepIndex(1);
  }

  if (step.id === "landing") {
    return (
      <div className="shell landing-shell">
        <Landing
          hasDraft={hasDraft}
          onStart={startFresh}
          onContinue={() => setStepIndex(hasDraft ? Math.max(stepIndex, 1) : 1)}
        />
      </div>
    );
  }

  if (submitState.status === "success") {
    return (
      <div className="shell">
        <header className="topbar">
          <p className="brand-mark compact">{brand.productName}</p>
        </header>
        <main className="panel success-panel">
          <h1>Application submitted</h1>
          <p>{submitState.message}</p>
          <p className="submission-id">
            Submission ID: <code>{submitState.submissionId}</code>
          </p>
          <p className="muted">
            {brand.legalName} · ABN {brand.abn}
          </p>
          <button type="button" className="btn primary" onClick={startFresh}>
            Start another application
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="brand-mark compact">{brand.productName}</p>
          <p className="brand-legal compact">{brand.legalName}</p>
        </div>
        <p className="topbar-meta">Ref {form.application_group.slice(0, 8)}</p>
      </header>
      <Progress current={stepIndex} />
      <main className="panel">
        <div className="panel-head">
          <h1>{step.title}</h1>
          <p className="muted">Step {stepIndex} of {STEPS.length - 1}</p>
        </div>

        {step.id === "applicant" && <ApplicantStep form={form} setForm={setForm} />}
        {step.id === "identity" && <IdentityStep form={form} setForm={setForm} />}
        {step.id === "employment" && <EmploymentStep form={form} setForm={setForm} />}
        {step.id === "address" && <AddressStep form={form} setForm={setForm} />}
        {step.id === "household" && <HouseholdStep form={form} setForm={setForm} />}
        {step.id === "references" && <ReferencesStep form={form} setForm={setForm} />}
        {step.id === "documents" && <DocumentsStep form={form} setForm={setForm} />}
        {step.id === "invite" && <InviteStep form={form} setForm={setForm} />}
        {step.id === "review" && <ReviewStep form={form} setForm={setForm} />}

        {errors.length > 0 ? (
          <div className="alert error" role="alert">
            <strong>Please fix the following:</strong>
            <ul>
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {submitState.status === "error" ? (
          <div className="alert error" role="alert">
            {submitState.message}
          </div>
        ) : null}

        {submitState.status === "busy" ? (
          <div className="alert info" role="status">
            Submitting application and generating PDF packet…
          </div>
        ) : null}

        <div className="nav-row">
          <button type="button" className="btn ghost" onClick={goBack}>
            Back
          </button>
          {step.id === "review" ? (
            <button
              type="button"
              className="btn primary"
              disabled={submitState.status === "busy"}
              onClick={() => void onSubmit()}
            >
              {submitState.status === "busy" ? "Submitting…" : "Submit application"}
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={goNext}>
              Next
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
