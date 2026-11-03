const API_URL = "http://localhost:5000/api/v1";
const CHATBOT_URL = "http://localhost:5002";

async function measureEndpoint(name, url, options = {}, iterations = 20) {
  const times = [];
  let status = 0;
  let payloadSize = 0;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      const duration = performance.now() - start;
      times.push(duration);
      status = res.status;
      payloadSize = Buffer.byteLength(text, "utf8");
    } catch (e) {
      times.push(performance.now() - start);
      status = 500;
    }
  }

  times.sort((a, b) => a - b);
  const avg = times.reduce((s, t) => s + t, 0) / times.length;
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];

  return {
    name,
    status,
    payloadSize,
    avg: avg.toFixed(2),
    p50: p50.toFixed(2),
    p95: p95.toFixed(2),
    p99: p99.toFixed(2),
    min: times[0].toFixed(2),
    max: times[times.length - 1].toFixed(2),
  };
}

async function runBenchmark() {
  console.log("===============================================================");
  console.log("       FOODSHARE API & SERVICE LATENCY BENCHMARK BASELINE      ");
  console.log("===============================================================\n");

  // Authenticate demo roles to get tokens
  const roles = ["donor", "volunteer", "ngo", "admin"];
  const tokens = {};

  for (const r of roles) {
    const res = await fetch(`${API_URL}/demo/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: r }),
    });
    const json = await res.json();
    tokens[r] = json?.data?.token;
  }

  const results = [];

  // 1. Health & Reference
  results.push(await measureEndpoint("GET /health (Backend)", `${API_URL}/health`));
  results.push(await measureEndpoint("GET /demo/identities", `${API_URL}/demo/identities`));

  // 2. Auth & Sessions
  results.push(
    await measureEndpoint("POST /demo/session (Donor)", `${API_URL}/demo/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "donor" }),
    })
  );

  // 3. Donor Endpoints
  results.push(
    await measureEndpoint("GET /donations/mine", `${API_URL}/donations/mine`, {
      headers: { Authorization: `Bearer ${tokens.donor}` },
    })
  );

  // 4. Volunteer Endpoints
  results.push(
    await measureEndpoint("GET /donations/available", `${API_URL}/donations/available`, {
      headers: { Authorization: `Bearer ${tokens.volunteer}` },
    })
  );
  results.push(
    await measureEndpoint("GET /volunteer/tasks", `${API_URL}/volunteer/tasks`, {
      headers: { Authorization: `Bearer ${tokens.volunteer}` },
    })
  );

  // 5. NGO Endpoints
  results.push(
    await measureEndpoint("GET /ngos/incoming", `${API_URL}/ngos/incoming`, {
      headers: { Authorization: `Bearer ${tokens.ngo}` },
    })
  );

  // 6. Admin Endpoints
  results.push(
    await measureEndpoint("GET /admin/users", `${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
    })
  );
  results.push(
    await measureEndpoint("GET /admin/donations", `${API_URL}/admin/donations`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
    })
  );
  results.push(
    await measureEndpoint("GET /admin/audit-logs", `${API_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
    })
  );

  // 7. System Impact & Notifications
  results.push(
    await measureEndpoint("GET /impact/me", `${API_URL}/impact/me`, {
      headers: { Authorization: `Bearer ${tokens.donor}` },
    })
  );
  results.push(
    await measureEndpoint("GET /notifications", `${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokens.donor}` },
    })
  );

  // 8. Chatbot Microservice
  results.push(await measureEndpoint("GET /health (Chatbot)", `${CHATBOT_URL}/health`));
  results.push(await measureEndpoint("GET /api/suggestions (Chatbot)", `${CHATBOT_URL}/api/suggestions`));
  results.push(
    await measureEndpoint("POST /chat (Chatbot Fallback/Local)", `${CHATBOT_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What are safe food holding temperatures?" }),
    }, 5)
  );

  console.log("| Endpoint / Workflow | HTTP | Size (B) | Avg (ms) | p50 (ms) | p95 (ms) | p99 (ms) |");
  console.log("|---|---|---|---|---|---|---|");
  for (const r of results) {
    console.log(
      `| ${r.name.padEnd(36)} | ${r.status} | ${String(r.payloadSize).padStart(8)} | ${String(r.avg).padStart(8)} | ${String(r.p50).padStart(8)} | ${String(r.p95).padStart(8)} | ${String(r.p99).padStart(8)} |`
    );
  }

  return results;
}

runBenchmark().catch((e) => console.error("Benchmark error:", e));
