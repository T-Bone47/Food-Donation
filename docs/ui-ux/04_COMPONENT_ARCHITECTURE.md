# FoodShare / Unified Food Donation Platform
## Phase 2: Component Architecture & Interface Hierarchy

**Date:** November 2, 2026  
**Document Status:** Production Component Architecture  

---

## 1. Component Layering Model

The frontend application adopts a four-tier component architecture:

```
+-------------------------------------------------------------------------------+
|  Tier 4: Role-Specific Views & Page Workflows                                 |
|  (DonorHome, Tasks, NgoDashboard, AdminConsole, SignupPage)                   |
+-------------------------------------------------------------------------------+
|  Tier 3: Domain Entity Components                                             |
|  (DonationCard, Journey, StatusBadge, VerificationBadge, Chatbot)             |
+-------------------------------------------------------------------------------+
|  Tier 2: Application Shell & Navigators                                       |
|  (AppShell, AppNav, UserMenu, AuthLayout, GuidedDemoAssistant)                |
+-------------------------------------------------------------------------------+
|  Tier 1: Atomic UI Primitives & Design System Controls                        |
|  (Button, Field, Input, ConfirmDialog, Tabs, StatList, InlineAlert, Skeleton) |
+-------------------------------------------------------------------------------+
```

---

## 2. Key Component Specifications

### 2.1 `DonationCard` (`src/components/DonationCard.tsx`)
- **Responsibility:** Self-contained representation of a food donation listing.
- **Visual Design:** Mimics a physical transport dispatch slip:
  - Upper sector: Title, category, quantity, address.
  - Dashed separator line: 2px dashed border separating static info from dynamic deadlines.
  - Lower sector: Time-critical collection deadline, safe consumption limit, and action buttons.
- **Props:**
  - `donation`: Core donation object fields.
  - `showStatus`: Boolean flag to display `StatusBadge`.
  - `showDeadlines`: Enables time-sensitive urgency countdown chips.
  - `children`: Role-specific action triggers (e.g. "Claim this pickup", "View progress").

### 2.2 `Journey` (`src/components/ui/journey.tsx`)
- **Responsibility:** Visual representation of the 5-stage donation lifecycle.
- **Visual Design:** Responsive horizontal (desktop) and vertical (mobile) progress stepper.
- **Data Integrity:** Takes real timestamps from database transitions (`AVAILABLE`, `ASSIGNED`, `PICKED_UP`, `DELIVERED`, `COMPLETED`). Missing timestamps are never faked.

### 2.3 `ConfirmDialog` (`src/components/ui/confirm-dialog.tsx`)
- **Responsibility:** Accessible confirmation boundary for state-changing operational handovers.
- **Visual Design:** Centered dialog with backdrop scrim, trapped focus, and prominent action buttons.
- **Accessibility:** Uses native HTML5 `<dialog role="dialog">` with `aria-labelledby` and automatic focus return.

### 2.4 `Chatbot` (`src/components/Chatbot.tsx`)
- **Responsibility:** AI conversational assistant connected to Python/Flask RAG backend on port 5002.
- **Visual Design:** Fixed floating drawer with role-aware welcome message, suggested prompt chips, calm dot pulse indicator, and markdown formatting.

