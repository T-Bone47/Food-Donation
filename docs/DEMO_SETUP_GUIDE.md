# FoodShare Platform — Demo Mode Setup & Operator Guide

## 1. Overview

The **FoodShare Interactive Demo Mode** is an out-of-the-box presentation capability embedded within the Unified Food Donation Platform. It requires **zero external cloud provisioning** and **zero database seeding scripts** to initialize. 

The demo environment auto-seeds on application startup with an interconnected 4-role lifecycle scenario (Donor, Volunteer, NGO, Admin) and operates in strict memory-isolated tenancy without touching production user accounts or database tables.

---

## 2. Environment Configuration

### 2.1 Backend Environment (`backend/.env`)
Ensure your `backend/.env` file has the standard required keys:

```bash
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Secret used to sign HMAC session tokens (Must be at least 32 characters)
SESSION_SECRET=replace-with-a-long-random-secret-minimum-32-chars

# Supabase configuration (Used for normal mode; demo mode runs safely regardless of cloud status)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key
```

### 2.2 Frontend Environment (`frontend/.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CHATBOT_URL=http://localhost:5002
```

---

## 3. Starting the Application

### 3.1 Step 1: Start Backend
In a terminal:
```bash
cd Food-Donation-main/backend
npm install
npm start
```
The server binds to port `5000`. You will see:
```text
[CONFIG] Loaded configuration for development
Server listening on port 5000
```

### 3.2 Step 2: Start Frontend
In a second terminal:
```bash
cd Food-Donation-main/frontend
npm install
npm run dev
```
The frontend starts at `http://localhost:3000`.

---

## 4. Launching Demo Mode

1. Open your browser and navigate to `http://localhost:3000/login`.
2. Notice the standard login form is active. Below the form, you will find the **"Explore Interactive Demo"** card.
3. Click **"Select Demo Role"**.
4. The **Role Selection Modal** opens with the four pre-configured platform accounts:
   - **Donor Demo** (`Demo Food Donor`)
   - **Volunteer Demo** (`Demo Volunteer`)
   - **NGO Demo** (`Demo NGO - Hope Shelter`)
   - **Admin Demo** (`Demo Administrator`)
5. Click **"Enter <Role> Demo"** on any card to immediately authenticate and navigate directly into that role's dashboard.

---

## 5. Verification via CLI / cURL

You can verify demo session issuance directly from the terminal:

### 5.1 Request Demo Session
```bash
curl -X POST http://localhost:5000/api/v1/demo/session \
  -H "Content-Type: application/json" \
  -d '{"role":"donor"}'
```

Expected Response:
```json
{
  "data": {
    "user": {
      "id": "d0000000-0000-0000-0000-000000000001",
      "name": "Demo Food Donor",
      "email": "demo-donor@foodshare.local",
      "role": "Donor",
      "is_demo": true
    },
    "token": "eyJhbGciOi...<signature>",
    "isDemo": true
  }
}
```

### 5.2 Reset Demo State
```bash
curl -X POST http://localhost:5000/api/v1/demo/reset \
  -H "Authorization: Bearer <DEMO_TOKEN>"
```

Expected Response:
```json
{
  "data": {
    "message": "Demo environment successfully reset to pristine seed state.",
    "seedSummary": {
      "users": 4,
      "donations": 5,
      "assignments": 3,
      "notifications": 4
    }
  }
}
```

---

## 6. Exiting Demo Mode

* Click on the user avatar icon in the top right of the navigation bar.
* Click **"Exit Demo"**.
* All local demo tokens and states are revoked and cleared from browser storage, returning you cleanly to `/login`.

