/**
 * Pure validation for sign-in, sign-up and profile forms. Mirrors backend/lib/validators.js and
 * backend/services/auth.service.js. Note: PATCH /auth/me applies NO server-side validation, so the profile
 * rules here are the only line of defence for that form.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const AUTH_LIMITS = {
  name: 150,
  email: 254,
  organization: 200,
  phone: 30,
  area: 120,
  pincode: 20,
  state: 120,
  country: 120,
  passwordMin: 6,
  passwordMax: 72,
};

export type Errors<K extends string> = Partial<Record<K, string>>;

export function validateLogin(v: { email: string; password: string }): Errors<"email" | "password"> {
  const e: Errors<"email" | "password"> = {};
  const email = v.email.trim();
  if (!email) e.email = "Enter your email address.";
  else if (email.length > AUTH_LIMITS.email || !EMAIL_PATTERN.test(email)) e.email = "Enter a valid email address, like name@example.org.";
  if (!v.password) e.password = "Enter your password.";
  return e;
}

export interface SignupValues {
  name: string;
  organization: string;
  email: string;
  phonenumber: string;
  password: string;
  pincode: string;
  area: string;
  state: string;
  country: string;
}

export function validateSignup(v: SignupValues): Errors<keyof SignupValues> {
  const e: Errors<keyof SignupValues> = {};
  const name = v.name.trim();
  if (!name) e.name = "Enter your name.";
  else if (name.length > AUTH_LIMITS.name) e.name = `Keep your name to ${AUTH_LIMITS.name} characters or fewer.`;
  if (v.organization.trim().length > AUTH_LIMITS.organization) e.organization = `Keep this to ${AUTH_LIMITS.organization} characters or fewer.`;
  const email = v.email.trim();
  if (!email) e.email = "Enter your email address.";
  else if (email.length > AUTH_LIMITS.email || !EMAIL_PATTERN.test(email)) e.email = "Enter a valid email address, like name@example.org.";
  const phone = v.phonenumber.trim();
  if (!phone) e.phonenumber = "Enter a phone number volunteers and NGOs can reach you on.";
  else if (phone.length > AUTH_LIMITS.phone) e.phonenumber = `Keep this to ${AUTH_LIMITS.phone} characters or fewer.`;
  if (v.password.length < AUTH_LIMITS.passwordMin) e.password = `Use at least ${AUTH_LIMITS.passwordMin} characters.`;
  else if (v.password.length > AUTH_LIMITS.passwordMax) e.password = `Use ${AUTH_LIMITS.passwordMax} characters or fewer.`;
  for (const [field, max] of [["area", AUTH_LIMITS.area], ["pincode", AUTH_LIMITS.pincode], ["state", AUTH_LIMITS.state], ["country", AUTH_LIMITS.country]] as const) {
    if (v[field].trim().length > max) e[field] = `Keep this to ${max} characters or fewer.`;
  }
  return e;
}

export interface ProfileValues {
  name: string;
  organization: string;
  phonenumber: string;
  area: string;
  pincode: string;
  state: string;
  country: string;
}

export function validateProfile(v: ProfileValues): Errors<keyof ProfileValues> {
  const e: Errors<keyof ProfileValues> = {};
  const name = v.name.trim();
  if (!name) e.name = "Your name can't be empty.";
  else if (name.length > AUTH_LIMITS.name) e.name = `Keep your name to ${AUTH_LIMITS.name} characters or fewer.`;
  for (const [field, max] of [["organization", AUTH_LIMITS.organization], ["phonenumber", AUTH_LIMITS.phone], ["area", AUTH_LIMITS.area], ["pincode", AUTH_LIMITS.pincode], ["state", AUTH_LIMITS.state], ["country", AUTH_LIMITS.country]] as const) {
    if (v[field].trim().length > max) e[field] = `Keep this to ${max} characters or fewer.`;
  }
  return e;
}
