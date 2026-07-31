export type InviteStatus = "queued" | "sent" | "failed";

export type CoApplicant = {
  email: string;
  status: InviteStatus;
  message?: string;
};

export type MedicareColour = "green" | "blue" | "yellow" | "";

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
    nationality: string;
    drivers_licence: {
      number: string;
      state: string;
      expiry: string;
      front: File | null;
      back: File | null;
    };
    passport: {
      number: string;
      country: string;
      expiry: string;
      photo: File | null;
    };
    medicare: {
      card_number: string;
      reference_number: string;
      card_colour: MedicareColour;
      expiry: string;
      photo: File | null;
    };
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
    people_living_in_household: string;
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
    payslips: File[];
    bank_statements: File[];
    other_documents: File[];
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
      nationality: "Australian",
      drivers_licence: {
        number: "",
        state: "",
        expiry: "",
        front: null,
        back: null,
      },
      passport: {
        number: "",
        country: "Australia",
        expiry: "",
        photo: null,
      },
      medicare: {
        card_number: "",
        reference_number: "",
        card_colour: "",
        expiry: "",
        photo: null,
      },
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
      people_living_in_household: "1",
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
      payslips: [],
      bank_statements: [],
      other_documents: [],
    },
    co_applicants: [],
    declaration: {
      accepted: false,
      signature_name: "",
    },
  };
}
