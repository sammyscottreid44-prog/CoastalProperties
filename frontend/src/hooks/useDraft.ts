import { useEffect, useState } from "react";
import { createEmptyForm, type ApplicationForm } from "../types/application";

const STORAGE_KEY = "coastapply.application.draft.v4";

type DraftShape = Omit<ApplicationForm, "documents"> & {
  stepIndex: number;
};

function readInviteGroup(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite")?.trim();
    return invite || null;
  } catch {
    return null;
  }
}

function clearInviteParamFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("invite")) return;
  url.searchParams.delete("invite");
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", next);
}

function loadDraft(): { form: ApplicationForm; stepIndex: number } {
  const inviteGroup = readInviteGroup();

  // Co-applicant invite: always wipe any existing draft and start a blank form
  // linked to the same application group.
  if (inviteGroup) {
    localStorage.removeItem(STORAGE_KEY);
    clearInviteParamFromUrl();
    return {
      form: createEmptyForm({
        applicationGroup: inviteGroup,
        role: "co_applicant",
      }),
      stepIndex: 1, // Applicant details — skip landing
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { form: createEmptyForm(), stepIndex: 0 };
    }
    const parsed = JSON.parse(raw) as DraftShape;
    const base = createEmptyForm();
    return {
      stepIndex: typeof parsed.stepIndex === "number" ? parsed.stepIndex : 0,
      form: {
        ...base,
        ...parsed,
        role: parsed.role === "co_applicant" ? "co_applicant" : "primary",
        documents: base.documents,
        co_applicants: parsed.co_applicants ?? [],
        declaration: parsed.declaration ?? base.declaration,
      },
    };
  } catch {
    return { form: createEmptyForm(), stepIndex: 0 };
  }
}

export function useDraft() {
  const initial = loadDraft();
  const [form, setForm] = useState<ApplicationForm>(initial.form);
  const [stepIndex, setStepIndex] = useState(initial.stepIndex);

  useEffect(() => {
    const { documents: _docs, ...rest } = form;
    const draft: DraftShape = { ...rest, stepIndex };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [form, stepIndex]);

  function clearDraft() {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = createEmptyForm();
    setForm(fresh);
    setStepIndex(0);
  }

  function startCoApplicant(applicationGroup: string) {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = createEmptyForm({
      applicationGroup,
      role: "co_applicant",
    });
    setForm(fresh);
    setStepIndex(1);
  }

  return { form, setForm, stepIndex, setStepIndex, clearDraft, startCoApplicant };
}
