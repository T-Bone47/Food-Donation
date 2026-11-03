# FoodShare Design System — Reusable Component Library

**Version:** 2.0.0  
**Framework:** React 19 / Next.js 15 App Router / Tailwind CSS v4  
**Updated:** November 2026  

---

## 1. Action Components

### Button (`src/components/ui/button.tsx`)
- **Variants:**
  - `default`: Solid primary green (`bg-primary text-primary-foreground hover:bg-primary-hover`).
  - `outline`: 1px bordered button (`border border-border bg-card text-foreground hover:bg-muted`).
  - `ghost`: Transparent button (`hover:bg-muted text-foreground`).
  - `destructive`: Red chili action (`bg-destructive text-destructive-foreground hover:bg-destructive/90`).
- **Sizes:**
  - `sm`: 32px height, 12px text, 12px padding.
  - `default`: 40px height, 14px text, 16px padding.
  - `lg`: 48px height, 16px text, 24px padding.
  - `icon`: 40x40px square.
- **States:** `loading` (spinner with accessible text), `disabled` (`opacity-50 pointer-events-none`), focus ring (`ring-2 ring-primary ring-offset-2`).

---

## 2. Form & Input Components

### Field & Input (`src/components/ui/field.tsx`, `src/components/ui/input.tsx`)
- Standard control height: 44px on mobile, 40px on desktop.
- 1px border (`border-input` / `#e2e2dc`), focus state `ring-1 ring-primary border-primary`.
- Error state: `border-destructive ring-destructive`, inline validation error announcement (`aria-invalid="true"`).

### Password Input (`src/components/ui/password-input.tsx`)
- Secure password field with toggleable show/hide visibility eye icon.

---

## 3. Feedback & Status Components

### StatusBadge (`src/components/ui/status-badge.tsx`)
- Encapsulates the 7-state donation lifecycle with dual visual indicators (SVG Lucide icon + text label):
  - `AVAILABLE`: `CircleDashed` + Green Leaf soft tone.
  - `ASSIGNED`: `UserCheck` + Sky Blue soft tone.
  - `PICKED_UP`: `PackageCheck` + Harvest Amber tone.
  - `DELIVERED`: `PackageOpen` + Civic Teal tone.
  - `COMPLETED`: `CircleCheck` + Emerald Green tone.
  - `CANCELLED`: `Ban` + Muted Stone tone.
  - `EXPIRED`: `TimerOff` + Chili Red soft tone.

### InlineAlert (`src/components/ui/states.tsx`)
- Tones: `error`, `warning`, `info`, `success`.
- Accessibility: `role="alert"` for errors with optional `focusOnMount` for form submission error summaries.

---

## 4. Operational Domain Components

### DonationCard (`src/components/DonationCard.tsx`)
- Structured like a transport dispatch slip:
  - Header: Donation title, status badge, food category tag.
  - Body: Formatted quantity (`50 portions`), pickup address with pin icon, donor description.
  - Dashed separator (`border-t-2 border-dashed border-border`).
  - Footer: Urgency deadline countdown (`deadlineInfo` with `urgent`, `soon`, or `ok` chip) and primary action button (`Claim this pickup`, `View Progress`).

### Journey (`src/components/ui/journey.tsx`)
- Linear milestone stepper for active donations:
  - Step 1: `Listed` (`AVAILABLE`)
  - Step 2: `Volunteer assigned` (`ASSIGNED`)
  - Step 3: `Picked up` (`PICKED_UP`)
  - Step 4: `Delivered` (`DELIVERED`)
  - Step 5: `Completed` (`COMPLETED`)
- Displays real timestamps recorded by the database. Never invents missing timestamps.
- Terminal branches for `CANCELLED` and `EXPIRED` states.

### ConfirmDialog (`src/components/ui/confirm-dialog.tsx`)
- Built on native HTML5 `<dialog role="dialog">`.
- Traps keyboard focus, listens for Escape key, and restores focus to triggering button.
- Asynchronous confirmation action with built-in loading spinner and error boundary.

