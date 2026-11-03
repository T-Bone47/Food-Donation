# FoodShare / Unified Food Donation Platform
## Phase 2: Navigation Architecture & Information Hierarchy

**Date:** November 2, 2026  
**Document Status:** Production Navigation Specification  

---

## 1. Information Architecture by Role

FoodShare implements a strict role-based navigation model where users only see routes authorized for their active role.

```
+-------------------------------------------------------------------------------+
|  ROLE NAVIGATION MATRIX                                                       |
+-------------------+-----------------------------------------------------------+
|  Donor            | Overview (/donordash)                                     |
|                   | My Donations (/mydonations)                               |
|                   | Notifications (/notification)                             |
|                   | Profile (/profile)                                        |
|                   | Action CTA: Donate Food (/donate)                         |
+-------------------+-----------------------------------------------------------+
|  Volunteer        | Find Food (/volunteerdash)                                |
|                   | My Tasks (/volunteer/tasks)                               |
|                   | Notifications (/notification)                             |
|                   | Profile (/profile)                                        |
+-------------------+-----------------------------------------------------------+
|  NGO              | Deliveries (/ngodash)                                     |
|                   | Notifications (/notification)                             |
|                   | Profile (/profile)                                        |
+-------------------+-----------------------------------------------------------+
|  Admin            | Console (/adminpage)                                      |
|                   |   - Overview tab                                          |
|                   |   - Donations tab                                         |
|                   |   - Verifications tab                                     |
|                   |   - Users tab                                             |
|                   |   - Activity tab                                          |
|                   | Notifications (/notification)                             |
|                   | Profile (/profile)                                        |
+-------------------+-----------------------------------------------------------+
|  Public / Guest   | Home (/) · Sign in (/login) · Select Demo Role            |
+-------------------+-----------------------------------------------------------+
```

---

## 2. Desktop vs. Mobile Navigation Translation

1. **Desktop Standard (`>= 768px`):**
   - Fixed top navigation header (height: 64px, `sticky top-0 z-40`).
   - Brand lockup left, role navigation links center, user account menu and contextual action CTA right.
   - Active routes indicated by a primary bottom border underline and semibold font weight.
2. **Mobile Standard (`< 768px`):**
   - Sticky top bar compressed to brand lockup + user initial avatar.
   - Destinations rendered in a fixed bottom tab bar with 44px touch targets and Lucide vector icons.
   - Demo mode banner sticky at top of mobile viewport with 1-click Guided Demo trigger.

---

## 3. Account Menu & Session Controls (`UserMenu.tsx`)

- Clicking user initial avatar opens accessible dropdown menu (`data-ui="menu"`).
- Displays user display name, email, and current authenticated role.
- For Demo sessions, prominently highlights `DEMO MODE: [ROLE]` and offers one-click "Exit Demo" action which clears isolated session storage and returns to `/login`.

