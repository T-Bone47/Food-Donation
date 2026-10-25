import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  issueSessionToken,
  verifySessionToken,
  revokeToken,
} from "../../lib/token.js";

const payload = {
  userId: "8a5c7c5e-8f1b-4f4e-9f3c-2d6b1a7e9c10",
  email: "user@example.test",
  role: "Donor",
};

function forgeToken({ expiresInSeconds = 3600, secret } = {}) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    jti: crypto.randomUUID(),
    iat: issuedAt,
    exp: issuedAt + expiresInSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret || process.env.SESSION_SECRET)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

test("issued tokens verify and contain a unique jti", () => {
  const first = issueSessionToken(payload);
  const second = issueSessionToken(payload);
  assert.notEqual(first, second);

  const decoded = verifySessionToken(first);
  assert.equal(decoded.userId, payload.userId);
  assert.equal(decoded.role, "Donor");
  assert.ok(decoded.jti);
});

test("tampered tokens are rejected", () => {
  const token = issueSessionToken(payload);
  const [encoded, signature] = token.split(".");
  const alteredPayload = Buffer.from(
    JSON.stringify({
      ...JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")),
      role: "Admin",
    })
  ).toString("base64url");

  assert.equal(verifySessionToken(`${alteredPayload}.${signature}`), null);
  assert.equal(verifySessionToken(`${encoded}.${signature.slice(0, -1)}x`), null);
  assert.equal(verifySessionToken("not.a.valid.token"), null);
  assert.equal(verifySessionToken(""), null);
});

test("expired tokens are rejected", () => {
  const expired = forgeToken({ expiresInSeconds: -60 });
  assert.equal(verifySessionToken(expired), null);

  const future = forgeToken({ expiresInSeconds: 60 });
  assert.ok(verifySessionToken(future));
});

test("tokens signed with a different secret are rejected", () => {
  const forged = forgeToken({
    secret: "a-different-secret-that-is-long-enough-12345",
  });
  assert.equal(verifySessionToken(forged), null);
});

test("revoked tokens cannot be reused", () => {
  const token = issueSessionToken(payload);
  assert.ok(verifySessionToken(token));
  revokeToken(token);
  assert.equal(verifySessionToken(token), null);
});

test("a missing or weak session secret fails closed", () => {
  const original = process.env.SESSION_SECRET;
  try {
    process.env.SESSION_SECRET = "too-short";
    assert.throws(() => issueSessionToken(payload), /at least 32/);
    const valid = forgeToken({ secret: original });
    assert.equal(verifySessionToken(valid), null);

    process.env.SESSION_SECRET = "";
    assert.throws(() => issueSessionToken(payload), /at least 32/);
  } finally {
    process.env.SESSION_SECRET = original;
  }
});
