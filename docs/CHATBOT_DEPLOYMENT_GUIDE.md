# FoodShare AI Chatbot — Production Deployment & Operations Guide

## 1. Production Architecture Overview

The **FoodShare Chatbot** is packaged as an independent Python microservice designed for zero-downtime integration with the existing Node.js/Express backend and Next.js frontend.

```
                              Internet / Client Browsers
                                          |
                                    HTTPS Port 443
                                          |
                            +-------------v-------------+
                            |       Reverse Proxy       |
                            |       (Nginx / Caddy)     |
                            +------+-------------+------+
                                   |             |
                     /api/v1/*     |             |  /api/chat/*
                                   |             |  (or direct port 5002)
                    +--------------v-+         +-v------------------+
                    | Node.js /      |         | Python Chatbot API |
                    | Express API    |         | (Waitress/Gunicorn)|
                    | Port 5000      |         | Port 5002          |
                    +----------------+         +--------------------+
```

---

## 2. System Requirements & Prerequisites

* **Operating System**: Linux (Ubuntu 22.04 LTS / Debian 12 / RHEL 9) or Windows Server 2022.
* **Python Runtime**: Python 3.10, 3.11, or 3.12.
* **Node.js**: Node.js 20 LTS or Node.js 22 (for backend & frontend).
* **Network**: Outbound HTTPS (port 443) connectivity to `generativelanguage.googleapis.com` for Gemini API calls.

---

## 3. Environment Variables Configuration

Create a `.env` file in `chatbot_api/` (never commit this file to version control):

```bash
# Server Port & Host Binding
CHATBOT_PORT=5002
CHATBOT_HOST=0.0.0.0
CHATBOT_ENV=production

# Backend Integration
BACKEND_URL=http://localhost:5000
FRONTEND_ORIGINS=http://localhost:3000,https://foodshare.example.com

# HMAC Session Secret (MUST match Express backend SESSION_SECRET)
SESSION_SECRET=your_super_secret_session_key_minimum_32_characters_long

# Google Gemini API
GEMINI_API_KEY=AIzaSy...your_gemini_api_key...
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT_SECONDS=15
GEMINI_MAX_RETRIES=3

# Operational Controls & Rate Limiting
RATE_LIMIT_PER_MINUTE=60
MAX_HISTORY_TURNS=10
SESSION_TTL_HOURS=24
BM25_K1=1.5
BM25_B=0.75
BM25_ROLE_BOOST=1.25
```

### Environment Variable Matrix

| Variable | Required | Default | Purpose |
| :--- | :---: | :--- | :--- |
| `CHATBOT_PORT` | No | `5002` | Port on which the chatbot WSGI server listens. |
| `BACKEND_URL` | No | `http://localhost:5000` | Address of the Node.js/Express API. |
| `SESSION_SECRET` | **Yes** | — | Shared secret for verifying user JWT/session tokens. |
| `GEMINI_API_KEY` | No | `None` | Google Gemini API key. If omitted, engine uses local fallback. |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model identifier. |
| `RATE_LIMIT_PER_MINUTE` | No | `60` | Maximum requests per IP per minute. |

---

## 4. Production WSGI Server Setup

Do not run `python app.py` (Flask development server) in production. Use a production WSGI server.

### 4.1 Linux Deployment (Gunicorn)

Install production dependencies:
```bash
pip install gunicorn
```

Launch with 4 worker processes:
```bash
cd chatbot_api
gunicorn --workers 4 \
         --bind 0.0.0.0:5002 \
         --timeout 30 \
         --access-logfile - \
         --error-logfile - \
         app:app
```

### 4.2 Windows Deployment (Waitress)

Install Waitress:
```bash
pip install waitress
```

Launch:
```powershell
cd chatbot_api
waitress-serve --listen=0.0.0.0:5002 app:app
```

---

## 5. Process Management

### 5.1 Systemd Service (Linux)

Create `/etc/systemd/system/foodshare-chatbot.service`:
```ini
[Unit]
Description=FoodShare AI Chatbot Service
After=network.target

[Service]
Type=simple
User=foodshare
WorkingDirectory=/var/www/foodshare/Food-Donation-main/chatbot_api
EnvironmentFile=/var/www/foodshare/Food-Donation-main/chatbot_api/.env
ExecStart=/var/www/foodshare/venv/bin/gunicorn --workers 4 --bind 127.0.0.1:5002 --timeout 30 app:app
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable foodshare-chatbot
sudo systemctl start foodshare-chatbot
```

### 5.2 PM2 Process Manager (Cross-Platform)

```bash
cd chatbot_api
pm2 start "waitress-serve --listen=127.0.0.1:5002 app:app" --name foodshare-chatbot
pm2 save
```

---

## 6. Reverse Proxy Configuration (Nginx)

Add the following location block to your Nginx site configuration:

```nginx
# Chatbot API Reverse Proxy
location /api/chat {
    proxy_pass http://127.0.0.1:5002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 30s;
}

# Chatbot Suggestions & Health Endpoints
location /api/suggestions {
    proxy_pass http://127.0.0.1:5002;
    proxy_set_header Host $host;
}

location /chatbot/health {
    proxy_pass http://127.0.0.1:5002/health;
}
```

---

## 7. Health Checks & Observability

### 7.1 Liveness Probe
```bash
curl -f http://localhost:5002/health || exit 1
```
Expected response:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "provider": "gemini",
  "offline_resilience": true
}
```

### 7.2 Metrics & Telemetry
```bash
curl -f http://localhost:5002/api/metrics
```
Provides counters on total requests, latency, rate limits, and fallback usage.

---

## 8. Failure Recovery & Disaster SOPs

| Failure Mode | Impact | Automatic Mitigation | Manual Action |
| :--- | :--- | :--- | :--- |
| **Gemini Quota Exceeded (429)** | External API calls fail. | System immediately switches to **Local Grounded Fallback Synthesizer** without error to users. | Increase Gemini API billing tier or quotas in Google Cloud Console. |
| **Network Partition to Gemini** | Network timeouts. | Engine retries with exponential backoff (3 attempts), then invokes fallback. | Check outbound firewall rules for port 443. |
| **Backend Express API Down** | Tool queries fail. | Tool handlers return graceful errors without crashing the chatbot. | Restart Express backend (`systemctl restart foodshare-backend`). |
| **High Memory Spike** | Host memory pressure. | Idle conversation sessions are pruned every 24 hours. | Restart WSGI workers or trigger compaction. |

