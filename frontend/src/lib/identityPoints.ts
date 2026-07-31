export const ID_POINTS = {
  passport: 70,
  drivers_licence: 40,
  medicare: 25,
} as const;

export const MIN_IDENTITY_POINTS = 100;

export function sumIdentityPoints(flags: {
  passport: boolean;
  drivers_licence: boolean;
  medicare: boolean;
}): number {
  let total = 0;
  if (flags.passport) total += ID_POINTS.passport;
  if (flags.drivers_licence) total += ID_POINTS.drivers_licence;
  if (flags.medicare) total += ID_POINTS.medicare;
  return total;
}
