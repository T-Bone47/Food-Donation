# FoodShare Infrastructure — 10. Developer Setup & Environment Guide

## 1. Prerequisites

Choose either the **Containerized Workflow (Docker)** or the **Native Local Workflow (Node.js & Python)**.

| Requirement | Containerized Workflow | Native Workflow |
|---|---|---|
| **Node.js** | Not required on host | Node.js v18+ (v20+ recommended) |
| **Python** | Not required on host | Python 3.10+ (3.12 recommended) |
| **Docker** | Docker 24+ & Docker Compose v2+ | Not required |
| **Git** | Git 2.30+ | Git 2.30+ |

---

## 2. Option A: Containerized Development (Docker Compose)

### Step 1: Clone & Configure Environment
```bash
cp .env.example .env
# Edit .env if configuring external Supabase or Google Gemini credentials
```

### Step 2: Build & Start All Services
```bash
docker compose up -d --build
```

### Step 3: Verify Running Services
```bash
docker compose ps
```
Services will become available at:
- **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Chatbot Service**: [http://localhost:5002](http://localhost:5002)

### Step 4: Stream Logs
```bash
docker compose logs -f
```

---

## 3. Option B: Native Host Development (Without Docker)

Run the three microservices in three dedicated terminal sessions:

### Terminal 1: Express Backend (Port 5000)
```powershell
cd Food-Donation-main/backend
npm install
npm run dev
```

### Terminal 2: Flask Chatbot (Port 5002)
```powershell
cd Food-Donation-main/chatbot_api
pip install -r requirements.txt
python app.py
```

### Terminal 3: Next.js Frontend (Port 3000)
```powershell
cd Food-Donation-main/frontend
npm install
npm run dev
```

---

## 4. Running Verification Test Suites

```powershell
# 1. Full Multi-Role End-to-End Test Suite
node presentation/run-e2e-suite.js

# 2. Real-Time Cross-Role SSE Synchronization Suite
node presentation/test-cross-role-realtime.js

# 3. Microservice Latency & Throughput Benchmark
node presentation/benchmark-baseline.js
```

