# SIH HACKATHON

# Local Food Waste → Community Meals Platform

A Smart India Hackathon 2025 project.  
A platform that connects restaurants/caterers with surplus food to volunteers/NGOs, ensuring food is picked up and distributed before it goes to waste.

---

## Overview
India wastes ~67 million tons of food annually while millions go hungry.  
This project aims to reduce food waste and feed communities by building a real-time food donation and distribution platform.

**Core Idea:**  
Donors list surplus food → Volunteers get notified → Food is picked up → Meals reach the needy.

---

## Problem
- ~67M tons of food wasted annually in India.  
- Millions sleep hungry every night.  
- Restaurants/caterers often throw away usable food.  
- Volunteers/NGOs lack real-time info.  
- Food waste contributes to methane emissions in landfills.  

---

## Solution
A lightweight platform that:  
- Lets donors post surplus food (quantity, expiry, photo).  
- Alerts nearby volunteers instantly via app/WhatsApp/SMS.  
- Provides a dashboard to track meals saved.  
- Includes an admin panel for fraud checks and analytics.  

---

## Features
- Donor Module: Food listing, expiry tracking, photo uploads.  
- Volunteer Module: Nearby food pickups, map navigation.  
- Dashboard: Impact counter showing meals saved.  
- Admin Panel: Monitor users, block fake donors, generate reports.  
- Notifications: Push / WhatsApp / SMS alerts.  
- Add-ons: Volunteer rewards, expiry timers, gamification.  

---

## Competitor Analysis

| Product/App            | Features                          | Gaps                         | Opportunity                  |
|-------------------------|-----------------------------------|------------------------------|------------------------------|
| Feeding India (Zomato) | Food donation at scale            | Limited to partner networks  | Open-to-all donor platform   |
| No Food Waste (NGO)    | Local collection & distribution   | Region-limited, manual ops   | Automation & real-time alerts|
| OLIO (UK app)          | Food sharing between individuals  | Not focused on India         | Local-first, NGO integrated  |

**Takeaway:** A scalable, real-time, India-first donation system.  

---

## Workflow
1. Donor posts food → backend saves entry.  
2. Nearest volunteer gets notified.  
3. Volunteer accepts pickup → status changes to *Picked Up*.  
4. Delivery complete → status marked as *Completed*.  
5. Dashboard updates with impact counter.  

---

## Technical Architecture
- **Frontend:** React.js / Next.js + Tailwind CSS  
- **Backend:** Node.js (Express) or Python (FastAPI)  
- **Database:** PostgreSQL  
- **Maps:** Leaflet.js / Google Maps API  
- **Notifications:** Firebase Cloud Messaging / Twilio WhatsApp API  
- **Deployment:** Vercel (frontend), Railway/Heroku (backend)  

---

## Impact & Benefits
**Beneficiaries:**  
- Restaurants: Reduce disposal costs, CSR contribution.  
- Citizens in need: Free meals, improved nutrition.  
- Volunteers/NGOs: Easy pickup coordination, recognition.  
- Society/Government: Reduced food waste, less landfill usage.  

**Projections:**  
- 1 donor restaurant/day → ~50 meals saved.  
- 100 restaurants → ~5,000 meals/day.  
- 1 city, 1 year → ~1.8M meals saved.  

---

## Challenges & Risks

| Challenge                | Risk                               | Mitigation                          |
|--------------------------|------------------------------------|-------------------------------------|
| Fake donors              | Volunteers waste time              | OTP verification, reputation scores |
| Food safety              | Expired food reaches people        | Expiry timers, donor photo uploads  |
| Volunteer availability   | No one near pickup                 | Multi-channel alerts, NGO backups   |
| Scalability              | High load issues                   | Cloud scaling, modular backend      |
| Connectivity             | Internet not available             | SMS-based fallback                  |
| Data privacy             | Sensitive info exposure            | Secure APIs, encryption, role access|

---

## Future Roadmap
- **Phase 1 (Hackathon MVP):** Donor + Volunteer app, basic notifications, dashboard counter.  
- **Phase 2 (3–6 months):** Launch in 1–2 cities, volunteer reward system, stronger fraud detection.  
- **Phase 3 (1 year):** Nationwide rollout, AI-driven matching, multilingual support.  
- **Phase 4 (Beyond food):** Expand to clothes, medicines, and blood donation requests.  

---

## Vision
From saving surplus meals to building a **sustainable giving ecosystem**.  
Our mission is to fight hunger, reduce waste, and empower communities through technology.  
