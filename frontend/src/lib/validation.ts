import type { ApplicationForm, StepId } from "../types/application";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const phoneOk = (v: string) => v.trim().length >= 7 && v.trim().length <= 30;
const dateOk = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
const numberOk = (v: string) => /^\d+(\.\d{1,2})?$/.test(v.trim());

export function validateStep(step: StepId, form: ApplicationForm): string[] {
  const errors: string[] = [];

  switch (step) {
    case "landing":
      break;
    case "applicant": {
      const a = form.applicant;
      if (!a.first_name.trim()) errors.push("First name is required");
      if (!a.last_name.trim()) errors.push("Last name is required");
      if (!emailOk(a.email)) errors.push("A valid email is required");
      if (!phoneOk(a.phone)) errors.push("A valid phone number is required");
      if (!dateOk(a.date_of_birth)) errors.push("Date of birth is required");
      break;
    }
    case "identity": {
      if (!form.identity.id_type) errors.push("ID type is required");
      if (!form.identity.id_number.trim()) errors.push("ID number is required");
      if (!form.identity.nationality.trim()) errors.push("Nationality is required");
      break;
    }
    case "employment": {
      if (!form.employment.status) errors.push("Employment status is required");
      if (!numberOk(form.employment.monthly_income)) {
        errors.push("Monthly income must be a valid number");
      }
      if (
        (form.employment.status === "employed" || form.employment.status === "self_employed") &&
        !form.employment.employer.trim()
      ) {
        errors.push("Employer is required for employed applicants");
      }
      break;
    }
    case "address": {
      const a = form.address;
      if (!a.current_address.trim()) errors.push("Current address is required");
      if (!a.city.trim()) errors.push("City is required");
      if (!a.state.trim()) errors.push("State/Province is required");
      if (!a.postal_code.trim()) errors.push("Postal code is required");
      if (!/^\d+(\.\d+)?$/.test(a.years_at_address.trim())) {
        errors.push("Years at address must be numeric");
      }
      if (!numberOk(a.monthly_rent)) errors.push("Monthly rent must be a valid number");
      break;
    }
    case "household": {
      if (!/^[1-9]\d*$/.test(form.household.household_size.trim())) {
        errors.push("Household size must be a positive integer");
      }
      if (!/^\d+$/.test(form.household.dependents.trim())) {
        errors.push("Dependents must be a whole number");
      }
      if (!form.household.has_pets) errors.push("Please indicate whether you have pets");
      if (form.household.has_pets === "yes" && !form.household.pet_details.trim()) {
        errors.push("Pet details are required when pets are indicated");
      }
      break;
    }
    case "references": {
      const r = form.references;
      if (!r.reference_1_name.trim() || !phoneOk(r.reference_1_phone) || !emailOk(r.reference_1_email)) {
        errors.push("Reference 1 requires name, phone, and email");
      }
      if (!r.reference_1_relationship.trim()) errors.push("Reference 1 relationship is required");
      if (!r.reference_2_name.trim() || !phoneOk(r.reference_2_phone) || !emailOk(r.reference_2_email)) {
        errors.push("Reference 2 requires name, phone, and email");
      }
      if (!r.reference_2_relationship.trim()) errors.push("Reference 2 relationship is required");
      break;
    }
    case "documents": {
      if (!form.documents.id_document) errors.push("Government ID document is required");
      if (!form.documents.proof_of_income) errors.push("Proof of income is required");
      if (!form.documents.proof_of_address) errors.push("Proof of address is required");
      break;
    }
    case "invite":
      break;
    case "review": {
      if (!form.declaration.accepted) errors.push("You must accept the declaration");
      if (!form.declaration.signature_name.trim()) errors.push("Signature name is required");
      break;
    }
    default:
      break;
  }

  return errors;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
