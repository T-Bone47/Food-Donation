# FoodShare — Component Migration & Architecture Map

## Overview
This document specifies the exact component mapping, UI reconstruction, and structural parity established between the reference frontend (`SIH-HACKATHON-lastupdate (1).zip`) and the production FoodShare Next.js platform.

---

## 1. Top-Level Layout & Navigation Components

| Reference Component (`SIH-HACKATHON`) | Migrated Component (`Food-Donation-main`) | Target Role / Path | Functional Enhancements & Adapters |
| :--- | :--- | :--- | :--- |
| `src/components/Navbar.tsx` | `frontend/src/components/Navbar.tsx` | Donor & Shared (`/donordash`, `/donate`, `/mydonations`, `/notification`, `/profile`) | Retains FeedChain brand title, horizontal emerald nav items, animated active pills, and Account dropdown. Wired to active Next.js session with one-click logout. |
| `src/components/volunavbar.tsx` | `frontend/src/components/volunavbar.tsx` | Volunteer (`/volunteerdash`, `/acceptpage`) | Reconstructs emerald navigation with links to *Home* (`/volunteerdash`), *My Service* (`/acceptpage`), *Notification*, and *Profile*. Realtime notification bell dot. |
| `src/components/adminnavbar.tsx` | `frontend/src/components/adminnavbar.tsx` | Admin (`/adminpage`, `/admin`) | Reconstructs administrative navigation bar with deep emerald branding, *Console*, *Users*, *Alerts*, and *System Status*. |
| *(New / Adapted)* `src/components/ngonavbar.tsx` | `frontend/src/components/ngonavbar.tsx` | NGO (`/ngodash`) | Custom component matching reference visual hierarchy with tabs: *Receiving Hub*, *Incoming Bay*, *Intake History*, plus role switcher. |

---

## 2. Operational & Domain Components

| Reference Component | Migrated Component | Key Visual & Behavioral Attributes | Backend Wiring |
| :--- | :--- | :--- | :--- |
| `src/components/DonationCard.tsx` | `frontend/src/components/DonationCard.tsx` | Elevated white card with border, countdown shelf-life timer with color-shifting warning, items badge list, donor location distance, and "Accept Donation" action. | Invokes `volunteerApi.claimTask(donation.id)`. Updates status locally and refetches task pool via Supabase Realtime. |
| `src/components/Chatbot.tsx` | `frontend/src/components/Chatbot.tsx` | Fixed floating circular emerald action button (`bottom-5 right-5`), expandable chat modal with emerald header, timestamped message bubbles, quick prompt tags, and auto-scrolling log. | Wired to Flask Gemini service on port 5002 (`/chat`), with resilient intelligent fallback responses for offline/demo scenarios. |
| `src/app/page.tsx` (Sign Up) | `frontend/src/app/page.tsx` | Hero background `signupbg.png`, glassmorphic centered signup card with Step 1 role selector (Donor, Volunteer, NGO, Admin) and Step 2 details form with auto-GPS. | Wired to `authApi.signup()` and demo switch triggers. Preserves shared demo session persistence. |
| `src/app/login/page.tsx` | `frontend/src/app/login/page.tsx` | Floating card over `signupbg.png` with emerald accent gradients, role switcher pills, direct demo login buttons, and password recovery triggers. | Wired to `authApi.login()`. Direct token storage, cookie persistence, and role-based redirect. |
| `src/app/donordash/page.tsx` | `frontend/src/app/donordash/page.tsx` | Emerald welcome hero banner, detected location badge, "Donate Food" prominent button, and 3 high-impact summary metric cards (Meals Donated, Active Rescues, CO₂ Diverted). | Wired to `impactApi.getSummary()`. Realtime refresh on donation status changes. |
| `src/app/donate/page.tsx` | `frontend/src/app/donate/page.tsx` | Centered form card with dynamic food item adder (`numFoods`), quantity dropdowns, shelf-life hours, prep timestamp, location auto-detect, and interactive map preview. | Wired to `donationsApi.create()`. Creates multi-item donation in PostgreSQL database. |
| `src/app/mydonations/page.tsx` | `frontend/src/app/mydonations/page.tsx` | List of donor's active and historical donations with color-coded status badges (`Pending`, `Accepted`, `Picked`, `Delivered`), volunteer contact cards, and cancel controls. | Wired to `donationsApi.getMine()`. Realtime custody sync via Supabase. |
| `src/app/volunteerdash/page.tsx` | `frontend/src/app/volunteerdash/page.tsx` | Available rescues feed, volunteer impact stats, rescuer tier badges (Gold/Silver/Bronze Rescuer), and real-time donation acceptance. | Wired to `volunteerApi.getTasks()` and `volunteerApi.claimTask()`. |
| `src/app/acceptpage/page.tsx` | `frontend/src/app/acceptpage/page.tsx` | Active pickup custody management screen, 3-stage progress stepper (`Accepted` $\rightarrow$ `Picked` $\rightarrow$ `Delivered`), pickup verification actions, and map directions. | Wired to `volunteerApi.confirmPickup()` and `volunteerApi.confirmDelivery()`. |
| `src/app/adminpage/page.tsx` | `frontend/src/app/adminpage/page.tsx` | System overview stats, multi-filter search box, split view with donation ledger cards on left and live inspection/reassignment details on right. | Wired to `adminApi.getDonations()`, `adminApi.getMetrics()`, and force transition triggers. |
| `src/app/ngodash/page.tsx` | `frontend/src/app/ngodash/page.tsx` | NGO receiving warehouse console with tab switcher (*Receiving Hub*, *Incoming Bay*, *Intake Ledger*), safety verification checklist modal, and delivery sign-off. | Wired to `ngoApi.getIncoming()`, `ngoApi.getHistory()`, and `ngoApi.confirmReceipt()`. |
| `src/app/notification/page.tsx` | `frontend/src/app/notification/page.tsx` | Full-page notification log with dismissible cards, timestamp badges, and unread counters. | Wired to `notificationsApi.getAll()` and `notificationsApi.markAsRead()`. |
| `src/app/profile/page.tsx` | `frontend/src/app/profile/page.tsx` | Editable user profile card (Full Name, Email, Organization, Phone, Address coordinates) with instant save feedback. | Wired to `authApi.updateMe()` and active Supabase user profile. |

---

## 3. UI Primitives & Atoms (`components/ui/`)

| Primitive Component | Source / Modification | Parity Status |
| :--- | :--- | :--- |
| `button.tsx` | Reference UI with `class-variance-authority` + added `loading?: boolean` spinner support | 100% Compatible |
| `card.tsx` | Reference card layout with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | 100% Exact Parity |
| `input.tsx` | Reference input component with focus rings + exported `controlClass` and `Textarea` for compatibility | 100% Exact Parity |
| `label.tsx` | Radix-based Label primitive from reference repository | 100% Exact Parity |
| `tabs.tsx` | Radix-based Tabs primitive from reference repository | 100% Exact Parity |
| `dropdown-menu.tsx` | Radix-based DropdownMenu primitive from reference repository | 100% Exact Parity |

---

## 4. Visual Identity Parity Guarantee
- Primary Accent: Emerald (`#16a34a` / `bg-green-600`, `hover:bg-green-700`)
- Surface Background: Light Mint/Ivory (`bg-green-50`, `bg-emerald-50/40`)
- Card Surfaces: Clean crisp white with subtle border (`bg-white border-green-100 shadow-sm`)
- Typography: Inter font family (`--font-inter`) with clear optical hierarchy
- Hero Imagery: `signupbg.png` faithfully placed on authentication and landing screens
