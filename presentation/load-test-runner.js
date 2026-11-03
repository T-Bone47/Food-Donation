// ============================================================================
// FoodShare Production Load Test Runner
// Simulates concurrent authenticated user flows across Donor, Volunteer, NGO, Admin
// Measures latency percentiles (p50, p90, p95, p99), error rates, throughput (RPS)
// ============================================================================

const http = require('node:http');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const CHATBOT_URL = process.env.CHATBOT_URL || 'http://localhost:5002';

function parseUrl(urlStr) {
  const parsed = new URL(urlStr);
  return {
    hostname: parsed.hostname,
    port: parsed.port,
    path: parsed.pathname + parsed.search,
  };
}

function makeRequest(urlStr, options = {}) {
  return new Promise((resolve) => {
    const { hostname, port, path } = parseUrl(urlStr);
    const start = process.hrtime.bigint();
    const headers = options.headers || {};
    let postData = '';

    if (options.body) {
      postData = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        hostname,
        port: port || 80,
        path,
        method: options.method || 'GET',
        headers,
        timeout: 10000,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          const end = process.hrtime.bigint();
          const latencyMs = Number(end - start) / 1_000_000;
          resolve({
            status: res.statusCode,
            latencyMs,
            success: res.statusCode >= 200 && res.statusCode < 400,
            body: raw,
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      const end = process.hrtime.bigint();
      resolve({ status: 504, latencyMs: Number(end - start) / 1_000_000, success: false, error: 'TIMEOUT' });
    });

    req.on('error', (err) => {
      const end = process.hrtime.bigint();
      resolve({ status: 500, latencyMs: Number(end - start) / 1_000_000, success: false, error: err.message });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function obtainDemoToken(role) {
  const res = await makeRequest(`${BASE_URL}/api/v1/demo/session`, {
    method: 'POST',
    body: { role },
  });
  if (res.success) {
    try {
      const json = JSON.parse(res.body);
      return json.data?.token || json.token;
    } catch {
      return null;
    }
  }
  return null;
}

async function runScenario(scenario, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await makeRequest(scenario.url, {
    method: scenario.method || 'GET',
    headers,
    body: scenario.body,
  });

  return res;
}

async function runBatch(concurrency, totalIterations, scenarios, tokens) {
  const latencies = [];
  let successCount = 0;
  let failureCount = 0;

  const totalRequests = concurrency * totalIterations;
  let completed = 0;

  const overallStart = process.hrtime.bigint();

  const worker = async (workerId) => {
    for (let i = 0; i < totalIterations; i++) {
      const scenarioIndex = (workerId + i) % scenarios.length;
      const scenario = scenarios[scenarioIndex];
      const token = tokens[scenario.role] || null;

      const res = await runScenario(scenario, token);
      latencies.push(res.latencyMs);
      if (res.success) {
        successCount++;
      } else {
        failureCount++;
      }
      completed++;
    }
  };

  const promises = [];
  for (let c = 0; c < concurrency; c++) {
    promises.push(worker(c));
  }
  await Promise.all(promises);

  const overallEnd = process.hrtime.bigint();
  const wallClockMs = Number(overallEnd - overallStart) / 1_000_000;
  const wallClockSec = wallClockMs / 1000;
  const throughputRps = totalRequests / wallClockSec;

  const mean = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);

  return {
    concurrency,
    totalRequests,
    successCount,
    failureCount,
    errorRate: ((failureCount / totalRequests) * 100).toFixed(2) + '%',
    wallClockSec: wallClockSec.toFixed(2),
    throughputRps: throughputRps.toFixed(1),
    p50: percentile(latencies, 50).toFixed(2),
    p90: percentile(latencies, 90).toFixed(2),
    p95: percentile(latencies, 95).toFixed(2),
    p99: percentile(latencies, 99).toFixed(2),
    max: Math.max(...latencies).toFixed(2),
    mean: mean.toFixed(2),
  };
}

async function main() {
  console.log('='.repeat(72));
  console.log('  FoodShare Full-Stack Load Test Runner');
  console.log('  Target Backend:', BASE_URL);
  console.log('  Target Chatbot:', CHATBOT_URL);
  console.log('='.repeat(72));

  // 1. Pre-authenticate demo sessions
  console.log('\n[1/4] Establishing simulated role sessions...');
  const tokens = {
    Donor: await obtainDemoToken('Donor'),
    Volunteer: await obtainDemoToken('Volunteer'),
    NGO: await obtainDemoToken('NGO'),
    Admin: await obtainDemoToken('Admin'),
  };

  for (const [role, tok] of Object.entries(tokens)) {
    console.log(`  - ${role}: ${tok ? 'OK (Token obtained)' : 'FAILED'}`);
  }

  // 2. Define balanced scenario suite
  const scenarios = [
    { name: 'Public Health Check', url: `${BASE_URL}/api/v1/health` },
    { name: 'Donor Donations Mine', url: `${BASE_URL}/api/v1/donations/mine`, role: 'Donor' },
    { name: 'Donor Impact Me', url: `${BASE_URL}/api/v1/impact/me`, role: 'Donor' },
    { name: 'Volunteer Available Feed', url: `${BASE_URL}/api/v1/donations/available`, role: 'Volunteer' },
    { name: 'Volunteer Tasks', url: `${BASE_URL}/api/v1/volunteer/tasks`, role: 'Volunteer' },
    { name: 'Volunteer Dashboard', url: `${BASE_URL}/api/v1/volunteer/dashboard`, role: 'Volunteer' },
    { name: 'NGO Incoming Deliveries', url: `${BASE_URL}/api/v1/ngos/incoming`, role: 'NGO' },
    { name: 'NGO Approved List', url: `${BASE_URL}/api/v1/ngos/approved`, role: 'NGO' },
    { name: 'Admin Users Paging', url: `${BASE_URL}/api/v1/admin/users?role=NGO`, role: 'Admin' },
    { name: 'Admin Audit Logs', url: `${BASE_URL}/api/v1/admin/audit-logs?limit=20`, role: 'Admin' },
    { name: 'Admin Verifications', url: `${BASE_URL}/api/v1/admin/verifications`, role: 'Admin' },
    { name: 'Chatbot Health', url: `${CHATBOT_URL}/health` },
    { name: 'Chatbot Suggestions', url: `${CHATBOT_URL}/api/suggestions` },
  ];

  console.log(`\n[2/4] Executing test tiers across ${scenarios.length} realistic endpoint flows...`);

  const results = [];
  const testTiers = [
    { concurrency: 10, iterations: 20 },
    { concurrency: 25, iterations: 20 },
    { concurrency: 50, iterations: 15 },
  ];

  for (const tier of testTiers) {
    console.log(`\n  >> Running Tier: ${tier.concurrency} Concurrent Users (${tier.concurrency * tier.iterations} total operations)...`);
    const res = await runBatch(tier.concurrency, tier.iterations, scenarios, tokens);
    results.push(res);
    console.log(`     Completed in ${res.wallClockSec}s | Throughput: ${res.throughputRps} req/s | p95: ${res.p95}ms | Errors: ${res.errorRate}`);
  }

  // 3. Format Summary Table
  console.log('\n' + '='.repeat(72));
  console.log('  LOAD TEST EMPIRICAL RESULTS SUMMARY');
  console.log('='.repeat(72));
  console.log('| Users | Total Req | Throughput | Mean (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Max (ms) | Errors |');
  console.log('|-------|-----------|------------|-----------|----------|----------|----------|----------|--------|');
  for (const r of results) {
    console.log(
      `| ${String(r.concurrency).padEnd(5)} | ${String(r.totalRequests).padEnd(9)} | ${(r.throughputRps + ' r/s').padEnd(10)} | ${String(r.mean).padEnd(9)} | ${String(r.p50).padEnd(8)} | ${String(r.p95).padEnd(8)} | ${String(r.p99).padEnd(8)} | ${String(r.max).padEnd(8)} | ${String(r.errorRate).padEnd(6)} |`
    );
  }
  console.log('='.repeat(72));

  // Save JSON for report integration
  const fs = require('node:fs');
  const path = require('node:path');
  const outPath = path.join(__dirname, 'load-test-results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nResults written to: ${outPath}\n`);
}

main().catch(console.error);

