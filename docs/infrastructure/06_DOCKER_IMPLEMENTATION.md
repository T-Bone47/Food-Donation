# FoodShare Infrastructure — 06. Docker Implementation & Containerization Guide

## 1. Container Hierarchy & Image Topologies

All container builds follow an immutable, multi-stage paradigm designed to minimize surface area and enforce non-root privilege boundaries:

```
[foodshare-backend]
  ├── Base: node:20-slim
  ├── Execution User: node (UID 1000)
  ├── Build Artifacts: npm ci --omit=dev
  └── Signal Management: Native Node.js SIGTERM / SIGINT graceful drain

[foodshare-chatbot]
  ├── Base: python:3.12-slim
  ├── Execution User: appuser (UID 1001)
  ├── WSGI Layer: Gunicorn (2 workers, 4 threads, timeout 60s)
  └── Resilience: Local deterministic grounded retrieval fallback

[foodshare-frontend]
  ├── Base: node:20-alpine
  ├── Execution User: nextjs (UID 1001)
  ├── Output Mode: Next.js 15 Standalone (.next/standalone + .next/static)
  └── Compression: Stripped development dependencies (~140 MB final image)
```

---

## 2. Verified Docker & Compose Operational Commands

### A. Development Build & Spin-up
```bash
# Validate Docker compose syntax and configuration
docker compose config

# Build all microservices without cache
docker compose build --no-cache

# Spin up all three tiers in detached mode with automated health monitoring
docker compose up -d

# Check live container health status
docker compose ps
```

### B. Service Diagnostics & Streamed Logs
```bash
# Follow logs across all containers in real time
docker compose logs -f

# Follow specific microservice logs
docker compose logs -f backend
docker compose logs -f chatbot
docker compose logs -f frontend

# Query backend health probe directly
curl -I http://localhost:5000/api/v1/health

# Query chatbot health probe directly
curl -I http://localhost:5002/health
```

### C. Graceful Teardown & Reconstruction
```bash
# Gracefully signal SIGTERM to all containers (allowing active HTTP transactions to complete)
docker compose stop

# Teardown containers and virtual networks without removing persistent state
docker compose down

# Rebuild a single modified service (e.g. backend) without downtime
docker compose up -d --no-deps --build backend
```

---

## 3. Host Non-Docker Development Fallback

Non-Docker local development remains 100% supported and functional:

```powershell
# Terminal 1: Express Backend
cd Food-Donation-main/backend
npm run dev

# Terminal 2: Flask Chatbot
cd Food-Donation-main/chatbot_api
python app.py

# Terminal 3: Next.js Frontend
cd Food-Donation-main/frontend
npm run dev
```

