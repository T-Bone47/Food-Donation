import test from "node:test";
import assert from "node:assert/strict";
import { rateLimit } from "../../middleware/rateLimit.js";

function fakeRequest(ip = "127.0.0.1") {
  return { ip, headers: {} };
}

function fakeResponse() {
  return {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
}

test("rate limiter blocks requests beyond the configured maximum", () => {
  const previous = process.env.RATE_LIMIT_DISABLED;
  process.env.RATE_LIMIT_DISABLED = "false";

  try {
    const limiter = rateLimit({
      windowMs: 60_000,
      max: 2,
      keyPrefix: `unit-${Date.now()}`,
    });

    const req = fakeRequest("10.0.0.1");
    const res = fakeResponse();
    const nextCalls = [];
    const errors = [];

    limiter(req, res, (err) => {
      if (err) errors.push(err);
      else nextCalls.push(true);
    });
    limiter(req, fakeResponse(), (err) => {
      if (err) errors.push(err);
      else nextCalls.push(true);
    });
    limiter(req, fakeResponse(), (err) => {
      if (err) errors.push(err);
      else nextCalls.push(true);
    });

    assert.equal(nextCalls.length, 2);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].name, "RateLimitError");
    assert.equal(res.headers["X-RateLimit-Limit"], 2);
  } finally {
    process.env.RATE_LIMIT_DISABLED = previous;
  }
});

test("rate limiter can be explicitly disabled for tests", () => {
  const previous = process.env.RATE_LIMIT_DISABLED;
  process.env.RATE_LIMIT_DISABLED = "true";
  try {
    const limiter = rateLimit({ max: 1, keyPrefix: `disabled-${Date.now()}` });
    const nextCalls = [];
    limiter(fakeRequest("10.0.0.2"), fakeResponse(), () => nextCalls.push(1));
    limiter(fakeRequest("10.0.0.2"), fakeResponse(), () => nextCalls.push(1));
    assert.equal(nextCalls.length, 2);
  } finally {
    process.env.RATE_LIMIT_DISABLED = previous;
  }
});
