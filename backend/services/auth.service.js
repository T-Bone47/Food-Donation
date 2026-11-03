import bcrypt from "bcrypt";
import { supabase } from "../supabase.js";
import { issueSessionToken } from "../lib/token.js";
import {
  ALLOWED_SIGNUP_ROLES,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
  normalizeRole,
  isNonEmptyText,
  isWithinLength,
  isValidPhone,
  isValidPincode,
  LIMITS,
} from "../lib/validators.js";
import { ValidationError, ConflictError, UnauthorizedError } from "../middleware/errorHandler.js";
import { isDemoUserId, getDemoUserById, DEMO_USERS } from "./demo.service.js";

const BCRYPT_ROUNDS = 12;

/**
 * Register a new user.
 * Returns { user, token } where user is the safe user profile and token is the session token.
 */
export async function registerUser(userData) {
  const { name, email, password, role, organization, phonenumber, area, pincode, state, country } = userData;

  // Validate required fields
  if (!name || !email || !password || !role) {
    throw new ValidationError("Missing required fields", [
      { field: "name", message: "Name is required" },
      { field: "email", message: "Email is required" },
      { field: "password", message: "Password is required" },
      { field: "role", message: "Role is required" },
    ].filter(e => !userData[e.field]));
  }

  if (!isNonEmptyText(name, LIMITS.name)) {
    throw new ValidationError(
      `Name is required and must be at most ${LIMITS.name} characters`
    );
  }

  for (const [field, max, value] of [
    ["organization", LIMITS.organization, organization],
    ["phonenumber", LIMITS.phone, phonenumber],
    ["area", LIMITS.area, area],
    ["pincode", LIMITS.pincode, pincode],
    ["state", LIMITS.state, state],
    ["country", LIMITS.country, country],
  ]) {
    if (!isWithinLength(value, max)) {
      throw new ValidationError(`${field} must be at most ${max} characters`);
    }
  }

  // Validate email
  if (!isValidEmail(email)) {
    throw new ValidationError("Invalid email format");
  }

  // Validate password
  if (!isValidPassword(password)) {
    throw new ValidationError("Password must be at least 6 characters");
  }

  // Normalize and validate role
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole || !ALLOWED_SIGNUP_ROLES.includes(normalizedRole)) {
    throw new ValidationError(`Invalid role. Allowed roles: ${ALLOWED_SIGNUP_ROLES.join(", ")}`);
  }

  // Normalize email
  const normEmail = normalizeEmail(email);

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", normEmail)
    .single();

  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Insert user
  const { data: user, error } = await supabase
    .from("users")
    .insert([
      {
        name: name.trim(),
        email: normEmail,
        password_hash: passwordHash,
        organization: organization?.trim() || null,
        phonenumber: phonenumber?.trim() || null,
        role: normalizedRole,
        area: area?.trim() || null,
        pincode: pincode?.trim() || null,
        state: state?.trim() || null,
        country: country?.trim() || "India",
        account_status: "active",
      },
    ])
    .select("id, name, email, role, organization, phonenumber, area, pincode, state, country, account_status, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new ConflictError("User with this email already exists");
    }
    throw new ValidationError(error.message);
  }

  // Issue session token
  const token = issueSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { user: safeUserProfile(user), token };
}

/**
 * Authenticate user with email and password.
 */
export async function loginUser(email, password) {
  if (!isValidEmail(email)) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const normEmail = normalizeEmail(email);

  // Check demo users first for immediate local demo session login
  const demoMatch = Object.values(DEMO_USERS).find(
    (u) => u.email.toLowerCase() === normEmail
  );
  if (demoMatch) {
    const token = issueSessionToken({
      userId: demoMatch.id,
      email: demoMatch.email,
      role: demoMatch.role,
      isDemo: true,
    });
    return { user: safeUserProfile(demoMatch), token, isDemo: true };
  }

  let user = null;
  let error = null;

  try {
    const res = await supabase
      .from("users")
      .select("id, name, email, password_hash, role, organization, phonenumber, area, pincode, state, country, account_status, created_at")
      .eq("email", normEmail)
      .single();
    user = res.data;
    error = res.error;
  } catch (dbErr) {
    console.warn(`[AUTH] Supabase login error: ${dbErr.message}`);
    throw new UnauthorizedError("Authentication database unavailable. Please select Demo Mode on the login screen to test.");
  }

  if (error || !user) {
    throw new UnauthorizedError("Invalid credentials");
  }

  if (user.account_status !== "active") {
    throw new UnauthorizedError("Account is not active");
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const token = issueSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    isDemo: false,
  });

  return { user: safeUserProfile(user), token, isDemo: false };
}

/**
 * Get user profile by ID.
 */
export async function getUserProfile(userId) {
  if (isDemoUserId(userId)) {
    const demoUser = getDemoUserById(userId);
    return demoUser ? safeUserProfile(demoUser) : null;
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, role, organization, phonenumber, area, pincode, state, country, account_status, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return null;
  }

  return safeUserProfile(user);
}

/**
 * Update user profile (allowed fields only).
 */
export async function updateUserProfile(userId, updates) {
  const allowedFields = [
    "name",
    "organization",
    "phonenumber",
    "area",
    "pincode",
    "state",
    "country",
  ];
  const filtered = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filtered[field] = updates[field];
    }
  }

  if (Object.keys(filtered).length === 0) {
    throw new ValidationError("No valid fields to update");
  }

  if (filtered.name !== undefined && !isNonEmptyText(filtered.name, LIMITS.name)) {
    throw new ValidationError(
      `Name is required and must be at most ${LIMITS.name} characters`
    );
  }

  if (filtered.phonenumber && !isValidPhone(filtered.phonenumber)) {
    throw new ValidationError("Invalid phone number format");
  }

  if (filtered.pincode && !isValidPincode(filtered.pincode)) {
    throw new ValidationError("Invalid pincode format");
  }

  for (const [field, max] of [
    ["organization", LIMITS.organization],
    ["phonenumber", LIMITS.phone],
    ["area", LIMITS.area],
    ["pincode", LIMITS.pincode],
    ["state", LIMITS.state],
    ["country", LIMITS.country],
  ]) {
    if (filtered[field] !== undefined && !isWithinLength(filtered[field], max)) {
      throw new ValidationError(`${field} must be at most ${max} characters`);
    }
    if (filtered[field] !== undefined) {
      filtered[field] = filtered[field]?.trim() || null;
    }
  }

  if (filtered.name !== undefined) {
    filtered.name = filtered.name.trim();
  }

  if (isDemoUserId(userId)) {
    const demoUser = getDemoUserById(userId);
    if (!demoUser) throw new ValidationError("Demo user not found");
    Object.assign(demoUser, filtered, { updated_at: new Date().toISOString() });
    return safeUserProfile(demoUser);
  }

  const { data: user, error } = await supabase
    .from("users")
    .update({ ...filtered, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("id, name, email, role, organization, phonenumber, area, pincode, state, country, account_status, created_at, updated_at")
    .single();

  if (error) {
    throw new ValidationError(error.message);
  }

  return safeUserProfile(user);
}

/**
 * Get user by email (for public profile lookups).
 */
export async function getUserByEmail(email) {
  const normEmail = normalizeEmail(email);

  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, role, organization, phonenumber, area, pincode, state, country, account_status, created_at")
    .eq("email", normEmail)
    .single();

  if (error || !user) {
    return null;
  }

  // Return only what an admin lookup needs; the route is admin-protected.
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: user.organization,
    area: user.area,
    pincode: user.pincode,
    state: user.state,
    country: user.country,
  };
}

function safeUserProfile(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: user.organization,
    phonenumber: user.phonenumber,
    area: user.area,
    pincode: user.pincode,
    state: user.state,
    country: user.country,
    accountStatus: user.account_status,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}