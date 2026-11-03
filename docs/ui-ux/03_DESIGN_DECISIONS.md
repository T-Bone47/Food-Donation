# FoodShare / Unified Food Donation Platform
## Phase 1: Formal Design Decisions & Architectural Rationale

**Date:** November 2, 2026  
**Status:** Approved Design Record  

---

## Decision 1: Typography Selection & Fallback Strategy

- **Context:** Previous versions relied on generic system sans-serif fonts that lacked visual character on presentation slides.
- **Decision:** Adopt an intentional pairing:
  - Display: `Outfit` (weights 500, 600, 700, 800) loaded via Google Fonts with `font-display: swap`.
  - Body & Operational Data: `Work Sans` (weights 400, 500, 600, 700) for high legibility at 14px–16px.
  - Fallbacks: System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) with matching x-height to prevent layout shift during offline evaluation.
- **Rationale:** `Outfit` provides a geometric warmth that feels modern and institutional without the coldness of generic Inter or Helvetica. `Work Sans` provides open apertures and distinct tabular numerals essential for food quantities and dates.

---

## Decision 2: Desktop Viewport Canvas Standard (`1920 × 1080`)

- **Context:** The original application used `max-w-6xl` (1152px) which left vast empty borders (~384px on each side) when viewed on high-definition 1080p monitors.
- **Decision:** Expand primary container to `max-w-7xl` (1280px–1400px) with responsive horizontal padding (`px-4 sm:px-6 lg:px-10`).
- **Rationale:** Operational dashboards (NGO intakes, Admin tables, Donor dispatch grids) require horizontal real estate to display multi-column logistical manifests, statuses, and action controls without artificial truncation.

---

## Decision 3: Role-Differentiated Palette Tokens

- **Context:** Previous dashboards shared identical primary green styling across all user roles, confusing evaluators switching between personas.
- **Decision:** Establish semantic role tokens under the 60-30-10 rule:
  - Ground: Warm paper (`#FBFBFA` light, `#121714` dark)
  - Card Structure: Crisp 1px border cards (`#FFFFFF` light, `#1C241F` dark)
  - Donor Role: Leaf green (`#166534` / `var(--leaf-600)`)
  - Volunteer Role: Logistics sky blue (`#0284C7`)
  - NGO Intake Role: Community shelter teal (`#0D9488`)
  - Platform Admin: Governance slate & amber (`#D97706`)
- **Rationale:** Role-specific accents immediately orient the user and reinforce the distinctive functional purpose of each persona.

---

## Decision 4: Elimination of Gratuitous Animation Clichés

- **Context:** The AI chatbot typing indicator previously used `animate-bounce` on dots, and demo elements featured pulsing glows.
- **Decision:** Excised all bounce loops and replaced with subtle ease pulses (`animate-pulse motion-reduce:animate-none`). Enforce complete support for `@media (prefers-reduced-motion: reduce)`.
- **Rationale:** Bouncing animations create visual fatigue during faculty evaluation presentations and fail WCAG 2.2 AA accessibility standards.

---

## Decision 5: Accessible Modal Architecture

- **Context:** Native `<dialog>` elements lacked explicit `role="dialog"` attributes, causing locator timeouts in headless browser automation.
- **Decision:** Ensure all `<dialog>` elements carry explicit `role="dialog"`, `aria-labelledby`, and `aria-describedby` attributes, with focus trapped on mount and returned to trigger on close.
- **Rationale:** Guarantees screen-reader compliance and reliable browser automation across Playwright, Cypress, and assistive technologies.

