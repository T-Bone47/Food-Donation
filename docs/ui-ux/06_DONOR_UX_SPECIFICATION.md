# FoodShare — Donor Experience UX Specification

**Document:** `docs/ui-ux/06_DONOR_UX_SPECIFICATION.md`  
**Platform:** FoodShare — The Food Rescue Operating Platform  
**Target Viewports:** 1920 × 1080 (Primary HD), 1440 × 900 (Laptop), 1024 × 768 (Tablet), 390 × 844 (Mobile)  
**Date:** November 2, 2026  
**Architect:** Principal Product Designer & Senior UX Architect  

---

## 1. Overview & Behavioral Principles

Food donors (restaurants, caterers, grocery stores, corporate cafeterias, and private citizens) require an interface that minimizes friction when listing surplus food under tight expiration deadlines.

The Donor experience answers three immediate questions upon login:
1. **What is currently active?** Which listings are awaiting pickup or currently in transit?
2. **What needs my immediate attention?** Are there upcoming collection deadlines within 2 hours?
3. **What is my community impact?** How many meals and kilograms of food have been rescued?

---

## 2. Key Pages & Workflows

### 1. Donor Hub (`/donordash`)
- **Active Surplus Overview:** High-visibility banner highlighting currently active listings.
- **Comparative Impact Counters:** Rescued meals, kilograms saved, and active listings.
- **Quick Listing Action:** Direct button to create a new donation manifest.
- **Recent Listings Ledger:** Status-badged cards showing live volunteer assignment status.

### 2. Surplus Manifest Creation (`/donate`)
- **2-Column Grouped Manifest Form:**
  - *Column 1 (Food Specifications):* Item Title, Category (`Cooked Meal`, `Fresh Produce`, etc.), Quantity & Unit (`servings`, `kg`, `liters`, etc.), Description & Allergens.
  - *Column 2 (Time & Geolocation Logistics):* Collection Deadline, Safe-to-Eat Expiration Date, Prepared At timestamp, and Geolocation Address with 1-click GPS auto-fill.
- **Client-Side Real-Time Validation:** Validates collection deadlines precede expiration dates; focuses first invalid input automatically.
- **Zero Data Loss Guarantee:** Server errors preserve all form input fields.

### 3. My Donations Ledger (`/mydonations`)
- **3-Column Widescreen Card Grid:** Responsive card layout on 1920×1080 screens displaying category tag, food volume, pickup deadline, and live lifecycle status badge.
- **Interactive Lifecycle Stepper:** Quick link to `/acceptpage/[id]` to inspect the 5-step Journey milestone tracker.

### 4. Donation Progress Journey (`/acceptpage/[id]`)
- **5-Step Milestone Stepper:**
  - `Listed` -> `Assigned to Volunteer` -> `Picked Up` -> `Delivered to NGO` -> `Completed & Confirmed`.
- Visual progress bar with status chips, volunteer contact details, and receiving NGO credentials.

