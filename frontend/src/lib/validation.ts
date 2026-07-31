import type { ApplicationForm, StepId } from "../types/application";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const phoneOk = (v: string) => v.trim().length >= 7 && v.trim().length <= 30;
const dateOk = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
const monthYearOk = (v: string) => /^(0[1-9]|1[0-2])\/\d{4}$/.test(v.trim());
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
      if (!form.identity.nationality.trim()) errors.push("Nationality is required");

      const dl = form.identity.drivers_licence;
      if (!dl.number.trim()) errors.push("Driver licence number is required");
      if (!dl.state.trim()) errors.push("Driver licence state is required");
      if (!dateOk(dl.expiry)) errors.push("Driver licence expiry is required");
      if (!dl.front) errors.push("Driver licence front photo is required");
      if (!dl.back) errors.push("Driver licence back photo is required");

      const passport = form.identity.passport;
      if (!passport.number.trim()) errors.push("Passport number is required");
      if (!passport.country.trim()) errors.push("Passport country is required");
      if (!dateOk(passport.expiry)) errors.push("Passport expiry is required");
      if (!passport.photo) errors.push("Passport photo is required");

      const medicare = form.identity.medicare;
      if (!medicare.card_number.trim()) errors.push("Medicare card number is required");
      if (!/^[1-9]$/.test(medicare.reference_number.trim())) {
        errors.push("Medicare reference number (1–9) is required");
      }
      if (!medicare.card_colour) errors.push("Medicare card colour is required");
      if (!monthYearOk(medicare.expiry)) {
        errors.push("Medicare expiry must be MM/YYYY");
      }
      if (!medicare.photo) errors.push("Medicare card photo is required");
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
      if (!/^[1-9]\d*$/.test(form.household.people_living_in_household.trim())) {
        errors.push("People living in household must be a positive integer");
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
      if (!form.documents.payslips.length) errors.push("At least one payslip is required");
      if (!form.documents.bank_statements.length) {
        errors.push("At least one bank statement is required");
      }
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
