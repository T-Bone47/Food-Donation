# FoodShare — Desktop-First Application Shell Architecture

**Document:** `docs/ui-ux/04_APPLICATION_SHELL.md`  
**Platform:** FoodShare — The Food Rescue Operating Platform  
**Target Viewports:** 1920 × 1080 (Primary Desktop HD), 1440 × 900 (Laptop), 1024 × 768 (Tablet), 390 × 844 (Mobile)  
**Date:** November 2, 2026  
**Architect:** Senior UX Architect & Principal Frontend Engineer  

---

## 1. Architectural Overview & Rationale

Prior versions of the platform relied on a single horizontal navigation strip at the top of the viewport. This caused two severe UX problems:
1. **Heading-Header Collision:** On various viewports and scroll positions, the page title (`h1`) clipped under the sticky header.
2. **Horizontal Information Cramming:** Secondary and tertiary role capabilities were forced into generic sub-tabs on a single page, wasting the widescreen display potential.

The redesigned **Desktop-First Application Shell** (`AppShell.tsx`) transitions FoodShare into an enterprise command utility with a persistent dual-pane structure:
- **Left Navigation Rail (`AppSidebar.tsx`):** Fixed `w-64` (256px) full-height rail organizing role-aware operational groups.
- **Top Workspace Header (`AppHeader.tsx`):** Unified `h-16` (64px) horizontal bar displaying live breadcrumbs, quick search, notification bell with unread badge, and demo role switcher.
- **Main Workspace Canvas (`main`):** Responsive fluid workspace (`max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8`) with guaranteed zero heading overlap.

```
+--------------------------------------------------------------------------------------------------+
|                                    DESKTOP SHELL LAYOUT (1920x1080)                              |
+----------------------+---------------------------------------------------------------------------+
|                      |  APP HEADER (h-16, sticky top-0, z-20)                                    |
|  APP SIDEBAR         |  [Breadcrumbs: Governance > Admin Console]      [Search] [Bell] [Profile] |
|  (w-64, fixed left)  +---------------------------------------------------------------------------+
|                      |                                                                           |
|  - Brand & Version   |  MAIN WORKSPACE CANVAS (max-w-7xl, py-8, pl-64)                           |
|  - Persona Card      |                                                                           |
|  - Role Nav Groups   |  H1 PAGE TITLE (Guaranteed Clearance from Header)                         |
|  - Demo Switcher     |                                                                           |
|  - Guided Demo CTA   |  [Operational Command Cards / Tables / Form Manifests]                    |
|  - Sign Out          |                                                                           |
+----------------------+---------------------------------------------------------------------------+
```

---

## 2. Left Sidebar Component Specifications (`AppSidebar.tsx`)

### Dimensions & Positioning
- **Desktop (`>= 1024px`):** `fixed inset-y-0 left-0 w-64 z-30 flex flex-col border-r border-border bg-card/95`.
- **Mobile (`< 1024px`):** Slide-over modal drawer (`fixed inset-0 z-50`) with darkened backdrop blur (`bg-black/60`).

### Content Hierarchy
1. **Brand Area:**
   - Vector Flame icon in rounded container with 150ms hover scale (`group-hover:scale-105`).
   - Wordmark: "FoodShare" in **Outfit Bold** (`font-display font-bold text-lg`).
   - Micro-subtitle: "RESCUE PLATFORM" in uppercase tracking (`tracking-wider text-[11px]`).
2. **Authenticated Persona Pill:**
   - Displays User Monogram, Full Name, and Role Badge with role-specific color pairing (Donor = emerald, Volunteer = sky, NGO = teal, Admin = amber).
   - "DEMO" badge chip indicating safe isolated demo execution.
3. **Role-Specific Navigation Groups:**
   - **Admin:** OVERVIEW (Command Center), OPERATIONS (Donation Ledger, User Directory, NGO Vetting), INSIGHTS (System Activity), SYSTEM (Notifications, Profile).
   - **Donor:** OVERVIEW (Donor Hub), SURPLUS INVENTORY (List Surplus Food, My Donations), ACCOUNT (Notifications, Profile).
   - **Volunteer:** OVERVIEW (Rescue Dispatch), FIELD MISSIONS (Available Pickups, Assigned Tasks), ACCOUNT (Notifications, Profile).
   - **NGO:** OVERVIEW (Intake Hub), COMMUNITY DISTRIBUTION (Inbound Deliveries, Completed Receipts), ACCOUNT (Notifications, Profile).
4. **Footer Utilities:**
   - "Guided Demo Script" button with sparkle icon opening `GuidedDemoAssistant.tsx`.
   - "Switch Role" button opening `DemoRoleSelectorModal.tsx`.
   - Accessible "Sign Out" button.

---

## 3. Top Workspace Header Specifications (`AppHeader.tsx`)

- **Dimensions:** Fixed height `h-16`, sticky top positioning with backdrop blur (`backdrop-blur-md bg-card/85`).
- **Left Alignments:**
  - Hamburger toggle button (`lg:hidden`) for mobile drawer.
  - Section Breadcrumbs: `parent > current` mapping providing immediate cognitive orientation.
- **Right Alignments:**
  - Guided Demo quick-pill.
  - Active role pill button.
  - Notification icon with unread badge dot.
  - User avatar with name truncate.

---

## 4. Heading Clipping Prevention & Scroll Math

The page heading collision bug has been permanently resolved through physical layout decoupling:
- The header is rendered outside the `<main>` container in its own sticky row.
- The `<main>` landmark receives top padding (`py-6 sm:py-8 lg:py-8`) and left padding on desktop (`lg:pl-64`).
- Scroll anchoring targets `<main id="main-content">` directly, guaranteeing page titles render with generous vertical breathing room below the header line.
