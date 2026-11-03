const http = require("http");

const BASE_API = "http://localhost:5000/api/v1";
const CHATBOT_API = "http://localhost:5002";

async function measureEndpoint(name, url, options = {}, iterations = 50) {
  const latencies = [];
  let errorCount = 0;

  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        errorCount++;
      }
      await res.json().catch(() => {});
      latencies.push(performance.now() - t0);
    } catch {
      errorCount++;
      latencies.push(performance.now() - t0);
    }
  }

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)].toFixed(2);
  const p95 = latencies[Math.floor(latencies.length * 0.95)].toFixed(2);
  const p99 = latencies[Math.floor(latencies.length * 0.99)].toFixed(2);
  const min = latencies[0].toFixed(2);
  const max = latencies[latencies.length - 1].toFixed(2);
  const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);

  return {
    name,
    iterations,
    errorCount,
    errorRate: ((errorCount / iterations) * 100).toFixed(1) + "%",
    min: Number(min),
    avg: Number(avg),
    p50: Number(p50),
    p95: Number(p95),
    p99: Number(p99),
    max: Number(max),
  };
}

async function runBenchmark() {
  console.log("===============================================================");
  console.log("       FOODSHARE ARCHITECTURE PERFORMANCE BENCHMARK SUITE      ");
  console.log("===============================================================\n");

  // Authenticate as Demo Donor
  const sessRes = await fetch(`${BASE_API}/demo/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "donor" }),
  });
  const { token } = (await sessRes.json()).data;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const results = [];

  console.log("1. Benchmarking Health Endpoint (/api/v1/health)...");
  results.push(await measureEndpoint("GET /api/v1/health", `${BASE_API}/health`, {}, 60));

  console.log("2. Benchmarking Unauthenticated Endpoint (/api/v1/demo/identities)...");
  results.push(await measureEndpoint("GET /api/v1/demo/identities", `${BASE_API}/demo/identities`, {}, 60));

  console.log("3. Benchmarking Authenticated Stats (/api/v1/impact/donor)...");
  results.push(await measureEndpoint("GET /api/v1/impact/donor", `${BASE_API}/impact/donor`, { headers: authHeaders }, 60));

  console.log("4. Benchmarking Authenticated Feed (/api/v1/donations/mine)...");
  results.push(await measureEndpoint("GET /api/v1/donations/mine", `${BASE_API}/donations/mine`, { headers: authHeaders }, 60));

  console.log("5. Benchmarking Chatbot Health Endpoint (/health)...");
  results.push(await measureEndpoint("GET /health (Flask)", `${CHATBOT_API}/health`, {}, 40));

  console.log("6. Benchmarking Chatbot Conversational API (/chat)...");
  results.push(await measureEndpoint("POST /chat (Flask Grounded)", `${CHATBOT_API}/chat`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ message: "What are the rules for cooked food donation?", conversation_id: "bench-test-conv" }),
  }, 20));

  console.log("\n==========================================================================================");
  console.log("| Endpoint                        | Req | Errors | Min(ms) | Avg(ms) | p50(ms) | p95(ms) | p99(ms) |");
  console.log("==========================================================================================");
  for (const r of results) {
    const pad = (s, l) => String(s).padEnd(l);
    console.log(
      `| ${pad(r.name, 31)} | ${pad(r.iterations, 3)} | ${pad(r.errorRate, 6)} | ${pad(r.min, 7)} | ${pad(r.avg, 7)} | ${pad(r.p50, 7)} | ${pad(r.p95, 7)} | ${pad(r.p99, 7)} |`
    );
  }
  console.log("==========================================================================================\n");

  const fs = require("fs");
  fs.writeFileSync(
    "presentation/benchmark-results.json",
    JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
  );
  console.log("Results written to presentation/benchmark-results.json");
}

runBenchmark().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});

