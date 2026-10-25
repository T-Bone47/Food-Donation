import crypto from "node:crypto";
import { createApp } from "../../app.js";
import { supabase } from "../../supabase.js";
import bcrypt from "bcrypt";

let server;
let baseUrl;

export async function startTestServer() {
  if (server) return baseUrl;
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}/api/v1`;
  return baseUrl;
}

export async function stopTestServer() {
  if (!server) return;
  await new Promise((resolve) => server.close(resolve));
  server = null;
  baseUrl = null;
}

export function uniqueEmail(prefix = "user") {
  return `${prefix}.${Date.now()}.${Math.random()
    .toString(36)
    .slice(2, 8)}@example.test`;
}

export async function api(path, { method = "GET", token, body } = {}) {
  if (!baseUrl) await startTestServer();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let json = null;
  const text = await response.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }

  return { status: response.status, body: json };
}

export async function createUserFixture({
  role = "Donor",
  name,
  password = "Password123!",
  email,
  accountStatus = "active",
  area = "Test Area",
  pincode = "560001",
  state = "Karnataka",
  country = "India",
} = {}) {
  const userEmail = email || uniqueEmail(role.toLowerCase());
  const passwordHash = await bcrypt.hash(password, 4);

  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        name: name || `${role} Test User`,
        email: userEmail,
        password_hash: passwordHash,
        role,
        account_status: accountStatus,
        area,
        pincode,
        state,
        country,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Failed to create ${role}: ${error.message}`);

  return { ...data, password };
}

export async function loginAs(email, password) {
  const res = await api("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.token;
}

export async function createAndLogin(options = {}) {
  const user = await createUserFixture(options);
  const token = await loginAs(user.email, user.password);
  return { user, token };
}

export async function makeApprovedNgo(organizationName = "Test NGO") {
  const { user, token } = await createAndLogin({ role: "NGO" });
  const { data: profile, error } = await supabase
    .from("ngo_profiles")
    .insert([
      {
        user_id: user.id,
        organization_name: organizationName,
        registration_number: `REG-${Date.now()}`,
        address: "NGO Street 1",
        contact_person: "NGO Contact",
        contact_email: user.email,
        contact_phone: "9999999999",
        verification_status: "approved",
        verified_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Failed to create NGO profile: ${error.message}`);
  return { user, token, profile };
}

export async function createDonationFixture(donorId, overrides = {}) {
  const now = Date.now();
  const expiresAt = new Date(now + 4 * 60 * 60 * 1000);
  const pickupDeadline = new Date(now + 2 * 60 * 60 * 1000);

  const payload = {
    donor_id: donorId,
    title: "Test Meal",
    description: "Fresh test food",
    food_category: "Cooked Meal",
    quantity: 25,
    unit: "servings",
    prepared_at: new Date(now - 30 * 60 * 1000).toISOString(),
    expires_at: expiresAt.toISOString(),
    pickup_deadline: pickupDeadline.toISOString(),
    pickup_address: "12 Test Street",
    area: "Test Area",
    pincode: "560001",
    state: "Karnataka",
    country: "India",
    status: "AVAILABLE",
    ...overrides,
  };

  const { data, error } = await supabase
    .from("donations")
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(`Failed to create donation: ${error.message}`);
  return data;
}

export function buildDonationPayload(overrides = {}) {
  const now = Date.now();
  return {
    title: "API Test Meal",
    description: "API-created donation",
    food_category: "Cooked Meal",
    quantity: 20,
    unit: "servings",
    prepared_at: new Date(now - 15 * 60 * 1000).toISOString(),
    expires_at: new Date(now + 4 * 60 * 60 * 1000).toISOString(),
    pickup_deadline: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
    pickup_address: "42 API Road",
    area: "Test Area",
    pincode: "560001",
    state: "Karnataka",
    country: "India",
    ...overrides,
  };
}

export function signTestToken(payload, { expiresInSeconds = 3600 } = {}) {
  // Forge tokens with arbitrary expiry using the same HMAC scheme as the app.
  const issuedAt = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    jti: crypto.randomUUID(),
    iat: issuedAt,
    exp: issuedAt + expiresInSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", process.env.SESSION_SECRET)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export async function getNotifications(token) {
  const res = await api("/notifications", { token });
  if (res.status !== 200) {
    throw new Error(`Notifications failed: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.notifications;
}

export { supabase };
