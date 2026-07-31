import { useEffect, useState } from "react";
import { createEmptyForm, type ApplicationForm } from "../types/application";

const STORAGE_KEY = "coastapply.application.draft.v1";

type DraftShape = Omit<ApplicationForm, "documents"> & {
  stepIndex: number;
};

function loadDraft(): { form: ApplicationForm; stepIndex: number } {
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

  return { form, setForm, stepIndex, setStepIndex, clearDraft };
}
