export type InviteStatus = "queued" | "sent" | "failed";

export type CoApplicant = {
  email: string;
  status: InviteStatus;
  message?: string;
};

export type ApplicationForm = {
  application_group: string;
  applicant: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
  };
  identity: {
    id_type: "passport" | "drivers_license" | "national_id" | "other" | "";
    id_number: string;
    nationality: string;
  };
  employment: {
    status: "employed" | "self_employed" | "student" | "unemployed" | "retired" | "";
    employer: string;
    job_title: string;
    monthly_income: string;
    start_date: string;
  };
  address: {
    current_address: string;
    city: string;
    state: string;
    postal_code: string;
    years_at_address: string;
    monthly_rent: string;
    landlord_name: string;
    landlord_phone: string;
    previous_address: string;
  };
  household: {
    household_size: string;
    dependents: string;
    has_pets: "yes" | "no" | "";
    pet_details: string;
  };
  references: {
    reference_1_name: string;
    reference_1_phone: string;
    reference_1_email: string;
    reference_1_relationship: string;
    reference_2_name: string;
    reference_2_phone: string;
    reference_2_email: string;
    reference_2_relationship: string;
  };
  documents: {
    id_document: File | null;
    proof_of_income: File | null;
    proof_of_address: File | null;
    additional_documents: File[];
  };
  co_applicants: CoApplicant[];
  declaration: {
    accepted: boolean;
    signature_name: string;
  };
};

export const STEPS = [
  { id: "landing", title: "Start" },
  { id: "applicant", title: "Applicant" },
  { id: "identity", title: "Identity" },
  { id: "employment", title: "Employment" },
  { id: "address", title: "Address" },
  { id: "household", title: "Household" },
  { id: "references", title: "References" },
  { id: "documents", title: "Documents" },
  { id: "invite", title: "Co-applicants" },
  { id: "review", title: "Review" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export function createEmptyForm(): ApplicationForm {
  const group =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `app-${Date.now()}`;

  return {
    application_group: group,
    applicant: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      date_of_birth: "",
    },
    identity: {
      id_type: "",
      id_number: "",
      nationality: "",
    },
    employment: {
      status: "",
      employer: "",
      job_title: "",
      monthly_income: "",
      start_date: "",
    },
    address: {
      current_address: "",
      city: "",
      state: "",
      postal_code: "",
      years_at_address: "",
      monthly_rent: "",
      landlord_name: "",
      landlord_phone: "",
      previous_address: "",
    },
    household: {
      household_size: "1",
      dependents: "0",
      has_pets: "no",
      pet_details: "",
    },
    references: {
      reference_1_name: "",
      reference_1_phone: "",
      reference_1_email: "",
      reference_1_relationship: "",
      reference_2_name: "",
      reference_2_phone: "",
      reference_2_email: "",
      reference_2_relationship: "",
    },
    documents: {
      id_document: null,
      proof_of_income: null,
      proof_of_address: null,
      additional_documents: [],
    },
    co_applicants: [],
    declaration: {
      accepted: false,
      signature_name: "",
    },
  };
}
