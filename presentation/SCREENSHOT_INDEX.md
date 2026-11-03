# Unified Food Donation Platform — Presentation Screenshot Index

**Project:** Unified Food Donation Platform (FoodShare)  
**Evidence Collection Date:** 2026-11-02  
**Automation Engine:** Playwright / Chromium 156 (Headless Chrome Application)  
**Primary Desktop Viewport:** 1920 × 1080 (16:9 Desktop HD)  
**Mobile Viewport:** 390 × 844 (Apple iPhone / Modern Mobile Standard, 2x Scale)  
**Total Screenshots Captured:** 39 Genuine System Captures  

---

## 1. Executive Summary

This index catalogues all 39 genuine application screenshots captured directly from the live, running Unified Food Donation Platform prototype. Every screenshot represents actual DOM rendering, live API responses, authentic database/session states, and real UI components without mockups, static Figma renders, or synthetic dashboard replacements.

The screenshots are organized into 8 functional categories:
1. `01_public` — Public & Authentication Views (4)
2. `02_donor` — Donor Role & Creation Lifecycle (6)
3. `03_volunteer` — Volunteer Discovery, Pickup & Delivery Handover (5)
4. `04_ngo` — NGO Inspection, Receipt Confirmation & Impact (5)
5. `05_admin` — Platform Governance, Verifications, Users & Audit Logs (5)
6. `06_chatbot` — AI Conversational Assistant & Knowledge Retrieval (3)
7. `07_workflows` — Cross-Role Lifecycle Journey, Geo-Location & Notifications (4)
8. `08_mobile` — Mobile Responsive Experiences at 390×844 (7)

---

## 2. Complete Screenshot Inventory Table

| # | Group | Filename | Feature Name | Role | Route | Viewport | What is Demonstrated | Verification Status | Limitations / Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `01_public` | `01_landing_page.png` | Public Home & Hero | Public | `/` | 1920×1080 | Platform mission, live headline, call-to-action buttons, role discovery cards | Verified Genuine | No session active |
| 2 | `01_public` | `02_login_page.png` | Authentication Portal | Public | `/login` | 1920×1080 | Secure email/password login, demo role shortcut banner, accessible tab order | Verified Genuine | Clean login state |
| 3 | `01_public` | `03_registration_page.png` | Role-Aware Onboarding | Public | `/` (Donor selected) | 1920×1080 | Donor registration fields, geo-location lookup, password policy validations | Verified Genuine | Interactive signup |
| 4 | `01_public` | `04_demo_role_selection.png` | Demo Quick-Login Modal | Public | `/login` (Modal open) | 1920×1080 | 4-role demo selector dialog with instant session tokens and persona cards | Verified Genuine | Isolated demo tenant |
| 5 | `02_donor` | `05_donor_dashboard.png` | Donor Dashboard | Donor | `/donordash` | 1920×1080 | Donor statistics, active listings banner, quick-action donate button, live metrics | Verified Genuine | Demo donor persona |
| 6 | `02_donor` | `06_donor_create_donation.png` | Food Donation Listing Form | Donor | `/donate` | 1920×1080 | Multi-field donation creation (food category, meal quantity, prep & expiry timestamps) | Verified Genuine | Pre-filled sample listing |
| 7 | `02_donor` | `07_donor_my_donations.png` | My Donations Overview | Donor | `/mydonations` | 1920×1080 | Active and past donations, status badges (`AVAILABLE`, `ASSIGNED`), progress CTAs | Verified Genuine | Live filtered view |
| 8 | `02_donor` | `08_donor_donation_details.png` | Donation Progress & Journey | Donor | `/acceptpage/[id]` | 1920×1080 | Step-by-step donation timeline journey tracker, timestamps, pickup location | Verified Genuine | Live journey tracker |
| 9 | `02_donor` | `09_donor_notifications.png` | Notifications Feed | Donor | `/notification` | 1920×1080 | Real-time event notifications (pickup claimed, food delivered, receipt confirmed) | Verified Genuine | Real-time notification feed |
| 10 | `02_donor` | `10_donor_profile.png` | Donor Profile & Settings | Donor | `/profile` | 1920×1080 | Organization profile, contact number, geographic coordinates, address | Verified Genuine | Profile management |
| 11 | `03_volunteer` | `11_volunteer_dashboard.png` | Volunteer Dashboard Overview | Volunteer | `/volunteerdash` | 1920×1080 | Active task reminder banner, open pickups count, volunteer impact summary | Verified Genuine | Demo volunteer persona |
| 12 | `03_volunteer` | `12_volunteer_available_donations.png` | Open Food Pickups Feed | Volunteer | `/volunteerdash#open-pickups` | 1920×1080 | Grid of available donations awaiting collection, pickup deadline indicators | Verified Genuine | Area-filtered pickups |
| 13 | `03_volunteer` | `13_volunteer_assigned_tasks.png` | My Tasks & Active Assignment | Volunteer | `/volunteer/tasks` | 1920×1080 | Active assignment card, collection deadline countdown, complete task history | Verified Genuine | Active workflow step |
| 14 | `03_volunteer` | `14_volunteer_pickup_confirmation.png` | Pickup Confirmation Modal | Volunteer | `/volunteer/tasks` (Dialog) | 1920×1080 | Confirmation dialog ensuring physical collection from donor with state safety | Verified Genuine | Native HTML5 `<dialog>` |
| 15 | `03_volunteer` | `15_volunteer_delivery_confirmation.png` | Delivery Handover Step | Volunteer | `/volunteer/tasks` (Handover) | 1920×1080 | Post-pickup delivery state (`PICKED_UP`), NGO destination select, delivery button | Verified Genuine | Real state transition |
| 16 | `04_ngo` | `16_ngo_dashboard.png` | NGO Dashboard Overview | NGO | `/ngodash` | 1920×1080 | Approved NGO header, verification status badge, incoming delivery alerts | Verified Genuine | Hope Shelter persona |
| 17 | `04_ngo` | `17_ngo_incoming_donations.png` | Incoming Deliveries Feed | NGO | `/ngodash#awaiting` | 1920×1080 | Deliveries marked as delivered by volunteer, awaiting formal NGO inspection | Verified Genuine | Real-time intake queue |
| 18 | `04_ngo` | `18_ngo_donation_details.png` | Incoming Donation Card Details | NGO | `/ngodash` (Card focus) | 1920×1080 | Food category, quantity, volunteer delivery timestamp, inspection instructions | Verified Genuine | Detailed intake card |
| 19 | `04_ngo` | `19_ngo_receipt_confirmation.png` | Receipt Confirmation Dialog | NGO | `/ngodash` (Confirm modal) | 1920×1080 | Modal dialog confirming meal arrival, recording final lifecycle completion | Verified Genuine | Terminal state confirmation |
| 20 | `04_ngo` | `20_ngo_completed_donations.png` | Completed Deliveries & Totals | NGO | `/ngodash#completed` | 1920×1080 | History of accepted food donations and metric stats (meals received, kg rescued) | Verified Genuine | Verified delivery log |
| 21 | `05_admin` | `21_admin_dashboard.png` | Admin Console Overview | Admin | `/adminpage` | 1920×1080 | Platform metrics, active donation counts, pending NGO review alert, quick actions | Verified Genuine | Governance console |
| 22 | `05_admin` | `22_admin_donation_management.png` | Platform Donations Table | Admin | `/adminpage` (Donations tab) | 1920×1080 | System-wide donation table with status filters (`AVAILABLE`, `ASSIGNED`, etc.), search | Verified Genuine | Platform-wide oversight |
| 23 | `05_admin` | `23_admin_donation_details.png` | Admin Donation Inspection Modal | Admin | `/adminpage` (Detail modal) | 1920×1080 | Comprehensive lifecycle audit modal showing donor, volunteer attempts, NGO recipient | Verified Genuine | Full audit detail |
| 24 | `05_admin` | `24_admin_user_management.png` | User Account Management | Admin | `/adminpage` (Users tab) | 1920×1080 | User accounts across Donor, Volunteer, NGO, and Admin roles with status toggles | Verified Genuine | RBAC account list |
| 25 | `05_admin` | `25_admin_activity_audit_log.png` | Security & Activity Audit Log | Admin | `/adminpage` (Activity tab) | 1920×1080 | Immutable audit event stream recording creation, claims, pickups, handovers | Verified Genuine | Compliance audit trail |
| 26 | `06_chatbot` | `26_chatbot_initial_state.png` | AI Assistant Launch State | Donor / Public | `/donordash` (Chat open) | 1920×1080 | Sliding chat panel, welcome message, role-tailored prompt suggestion chips | Verified Genuine | Flask service port 5002 |
| 27 | `06_chatbot` | `27_chatbot_conversation.png` | Multi-Turn Listing Assistance | Donor | `/donordash` (Chat response) | 1920×1080 | Query: "How do I list surplus food?", formatted markdown answer with lifecycle stages | Verified Genuine | Rule-based domain engine |
| 28 | `06_chatbot` | `28_chatbot_contextual_response.png` | Policy Guidance with Citations | Donor | `/donordash` (Policy chat) | 1920×1080 | Query on temperature standards with regulatory citations to food safety documentation | Verified Genuine | Document attribution |
| 29 | `07_workflows` | `29_donation_lifecycle.png` | Visual Journey Step Tracker | Cross-Role | `/acceptpage/[id]` | 1920×1080 | Visual progression (`Available` -> `Assigned` -> `Picked Up` -> `Delivered` -> `Completed`) | Verified Genuine | Unified Journey component |
| 30 | `07_workflows` | `30_notification_flow.png` | Unified Notification Stream | Cross-Role | `/notification` | 1920×1080 | Real-time event notifications categorized by date and priority with action links | Verified Genuine | Event-driven UI updates |
| 31 | `07_workflows` | `31_map_location_view.png` | Geographic Location Integration | Volunteer | `/volunteer/tasks` | 1920×1080 | Pickup coordinates, complete address, external Google Maps navigation link | Verified Genuine | Location card |
| 32 | `07_workflows` | `32_mobile_responsive_view.png` | Responsive Navigation & Layout | Cross-Role | `/donordash` | 1920×1080 | Responsive layout with accessible navigation shell and interactive demo assistant | Verified Genuine | Tailwind CSS grid |
| 33 | `08_mobile` | `01_mobile_landing.png` | Mobile Public Landing Page | Public | `/` | 390×844 | Mobile viewport hero section, call-to-action cards, responsive typography | Verified Genuine | iPhone / Modern mobile |
| 34 | `08_mobile` | `02_mobile_login.png` | Mobile Login & Demo Selector | Public | `/login` | 390×844 | Touch-friendly login inputs, mobile demo selector, bottom sheet layout | Verified Genuine | Touch-target optimized |
| 35 | `08_mobile` | `03_mobile_donor_dashboard.png` | Mobile Donor Dashboard | Donor | `/donordash` | 390×844 | Compact metric cards, mobile navigation bar, quick donation creation button | Verified Genuine | Mobile dashboard |
| 36 | `08_mobile` | `04_mobile_volunteer_tasks.png` | Mobile Volunteer Task List | Volunteer | `/volunteer/tasks` | 390×844 | Mobile task card with action button ("Mark as picked up") and map link | Verified Genuine | Field volunteer view |
| 37 | `08_mobile` | `05_mobile_ngo_dashboard.png` | Mobile NGO Deliveries View | NGO | `/ngodash` | 390×844 | Mobile intake list with touch-friendly receipt confirmation button | Verified Genuine | Field NGO view |
| 38 | `08_mobile` | `06_mobile_admin_console.png` | Mobile Admin Console | Admin | `/adminpage` | 390×844 | Horizontally scrolling administrative tabs, mobile metric cards | Verified Genuine | Admin on mobile |
| 39 | `08_mobile` | `07_mobile_chatbot.png` | Mobile AI Chat Assistant | Donor / Public | `/donordash` | 390×844 | Full-height mobile chat drawer, touch suggestion chips, responsive message bubbles | Verified Genuine | Mobile conversational UI |

---

## 3. Directory Layout & Storage

The screenshots are persisted in two synchronized locations in the project workspace:
1. `Food-Donation-main/presentation/screenshots/`
2. `presentation/screenshots/`

```
presentation/
├── capture-screenshots.js
├── SCREENSHOT_INDEX.md
├── PPT_SCREENSHOT_REPORT.md
└── screenshots/
    ├── 01_public/
    │   ├── 01_landing_page.png
    │   ├── 02_login_page.png
    │   ├── 03_registration_page.png
    │   └── 04_demo_role_selection.png
    ├── 02_donor/
    │   ├── 05_donor_dashboard.png
    │   ├── 06_donor_create_donation.png
    │   ├── 07_donor_my_donations.png
    │   ├── 08_donor_donation_details.png
    │   ├── 09_donor_notifications.png
    │   └── 10_donor_profile.png
    ├── 03_volunteer/
    │   ├── 11_volunteer_dashboard.png
    │   ├── 12_volunteer_available_donations.png
    │   ├── 13_volunteer_assigned_tasks.png
    │   ├── 14_volunteer_pickup_confirmation.png
    │   └── 15_volunteer_delivery_confirmation.png
    ├── 04_ngo/
    │   ├── 16_ngo_dashboard.png
    │   ├── 17_ngo_incoming_donations.png
    │   ├── 18_ngo_donation_details.png
    │   ├── 19_ngo_receipt_confirmation.png
    │   └── 20_ngo_completed_donations.png
    ├── 05_admin/
    │   ├── 21_admin_dashboard.png
    │   ├── 22_admin_donation_management.png
    │   ├── 23_admin_donation_details.png
    │   ├── 24_admin_user_management.png
    │   └── 25_admin_activity_audit_log.png
    ├── 06_chatbot/
    │   ├── 26_chatbot_initial_state.png
    │   ├── 27_chatbot_conversation.png
    │   └── 28_chatbot_contextual_response.png
    ├── 07_workflows/
    │   ├── 29_donation_lifecycle.png
    │   ├── 30_notification_flow.png
    │   ├── 31_map_location_view.png
    │   └── 32_mobile_responsive_view.png
    └── 08_mobile/
        ├── 01_mobile_landing.png
        ├── 02_mobile_login.png
        ├── 03_mobile_donor_dashboard.png
        ├── 04_mobile_volunteer_tasks.png
        ├── 05_mobile_ngo_dashboard.png
        ├── 06_mobile_admin_console.png
        └── 07_mobile_chatbot.png
```

---

## 4. Verification Certification

Every screenshot listed in this index has been verified for:
1. **Source Authenticity:** Rendered by Google Chrome 156 against the live Next.js (port 3000), Express (port 5000), and Flask Chatbot (port 5002) runtimes.
2. **Visual Integrity:** No clipped navigation, no raw unrendered template code, no open devtools overlays, and clean typographic contrast.
3. **Security Compliance:** Zero hardcoded API keys, bearer tokens, or sensitive user passwords visible on screen.
4. **Resolution Standards:** Full standard HD (1920 × 1080) for desktop captures and standard Retina (390 × 844 @ 2x) for mobile captures.

