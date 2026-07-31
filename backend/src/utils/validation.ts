import { z } from "zod";

const emailSchema = z.string().trim().email("Invalid email format");
const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number is too short")
  .max(30, "Phone number is too long");
const nonEmpty = (label: string) => z.string().trim().min(1, `${label} is required`);
const optionalString = z.string().trim();
const positiveNumberString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid number")
  .refine((v) => Number(v) >= 0, "Must be zero or greater");
const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid date (YYYY-MM-DD)");
const monthYearString = z
  .string()
  .trim()
  .regex(/^(0[1-9]|1[0-2])\/\d{4}$/, "Must be MM/YYYY");

export const applicationPayloadSchema = z.object({
  application_group: nonEmpty("Application group"),
  applicant: z.object({
    first_name: nonEmpty("First name"),
    last_name: nonEmpty("Last name"),
    email: emailSchema,
    phone: phoneSchema,
    date_of_birth: dateString,
  }),
  identity: z.object({
    nationality: nonEmpty("Nationality"),
    drivers_licence: z.object({
      number: nonEmpty("Driver licence number"),
      state: nonEmpty("Driver licence state"),
      expiry: dateString,
    }),
    passport: z.object({
      number: nonEmpty("Passport number"),
      country: nonEmpty("Passport country"),
      expiry: dateString,
    }),
    medicare: z.object({
      card_number: nonEmpty("Medicare card number"),
      reference_number: z
        .string()
        .trim()
        .regex(/^[1-9]$/, "Medicare reference number must be 1–9"),
      card_colour: z.enum(["green", "blue", "yellow"]),
      expiry: monthYearString,
    }),
  }),
  employment: z.object({
    status: z.enum(["employed", "self_employed", "student", "unemployed", "retired"]),
    employer: optionalString,
    job_title: optionalString,
    monthly_income: positiveNumberString,
    start_date: optionalString,
  }),
  address: z.object({
    current_address: nonEmpty("Current address"),
    city: nonEmpty("City"),
    state: nonEmpty("State/Province"),
    postal_code: nonEmpty("Postal code"),
    years_at_address: z
      .string()
      .trim()
      .regex(/^\d+(\.\d+)?$/, "Years at address must be numeric"),
    monthly_rent: positiveNumberString,
    landlord_name: optionalString,
    landlord_phone: optionalString,
    previous_address: optionalString,
  }),
  household: z.object({
    people_living_in_household: z
      .string()
      .trim()
      .regex(/^[1-9]\d*$/, "People living in household must be a positive integer"),
    dependents: z
      .string()
      .trim()
      .regex(/^\d+$/, "Dependents must be a whole number"),
    has_pets: z.enum(["yes", "no"]),
    pet_details: optionalString,
  }),
  references: z.object({
    reference_1_name: nonEmpty("Reference 1 name"),
    reference_1_phone: phoneSchema,
    reference_1_email: emailSchema,
    reference_1_relationship: nonEmpty("Reference 1 relationship"),
    reference_2_name: nonEmpty("Reference 2 name"),
    reference_2_phone: phoneSchema,
    reference_2_email: emailSchema,
    reference_2_relationship: nonEmpty("Reference 2 relationship"),
  }),
  declaration: z.object({
    accepted: z.literal(true, {
      errorMap: () => ({ message: "Declaration must be accepted" }),
    }),
    signature_name: nonEmpty("Signature name"),
    signed_at: z.string().datetime({ offset: true }).or(z.string().datetime()),
  }),
  co_applicants: z
    .array(
      z.object({
        email: emailSchema,
          status: z.enum(["queued", "sent", "failed", "link_ready"]).optional(),
      }),
    )
    .max(5)
    .optional()
    .default([]),
});

export type ApplicationPayload = z.infer<typeof applicationPayloadSchema>;

export const invitePayloadSchema = z.object({
  invitee_email: emailSchema,
  inviter_name: nonEmpty("Inviter name"),
  inviter_email: emailSchema,
  application_group: nonEmpty("Application group"),
});

export type InvitePayload = z.infer<typeof invitePayloadSchema>;

export function parseJsonField<T>(raw: unknown, label: string): T {
  if (typeof raw !== "string") {
    throw new Error(`${label} must be a JSON string`);
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`${label} contains invalid JSON`);
  }
}
