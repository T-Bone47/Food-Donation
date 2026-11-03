---
name: food-donation-design
description: Design principles, viewport priorities, architectural rules, and prohibited UI anti-patterns for the Unified Food Donation Platform.
trigger: always_on
---

# Unified Food Donation Platform — Design Intelligence & System Rules

## 1. Product & Vision
- **Product:** Unified Food Donation Platform (FoodShare)
- **Domain:** Food rescue, volunteer logistics, NGO community distribution, platform governance
- **Target Audience:** Donors (restaurants, caterers, grocery stores, citizens), Field Volunteers, Verified NGOs, Platform Administrators, Faculty evaluators, and academic stakeholders
- **Design Priority:** Desktop-first, presentation-quality, premium visual experience. Every screen must look intentionally engineered by a principal designer, with zero generic AI-generated aesthetics.

---

## 2. Target Viewports & Responsive Matrix

### Primary Viewport
- **Desktop High-Definition:** `1920 × 1080` (16:9 widescreen standard for evaluation presentations, slide capture, and wide monitor workflows)

### Secondary Viewports
- **Standard Laptop:** `1440 × 900`
- **Compact Desktop / Classroom Display:** `1366 × 768`
- **Tablet Landscape / Small Monitor:** `1024 × 768`
- **Modern Mobile Standard:** `390 × 844` (iPhone / high-density modern mobile)
- **Compact Mobile:** `375 × 812`

All layout grids, typography scales, touch targets, and action bars must remain fully functional and visually balanced across this complete matrix.

---

## 3. Design Expectations & Quality Standards

1. **Distinctive Visual Identity:**
   - Establish an unmistakable identity rooted in food rescue, human dignity, and logistical precision.
   - Avoid generic software cliches; draw visual inspiration from editorial publications, transport manifests, and modern civic utilities.
2. **Excellent Visual Hierarchy:**
   - Immediately visible primary actions; secondary controls visually subordinated.
   - Strict adherence to font sizes, weights, and optical contrasts to guide the evaluator's eye naturally.
3. **Strong Information Architecture:**
   - Uncluttered page layouts where content density matches user intent (high density for admin logs, focused clarity for volunteer tasks).
4. **Professional Typography:**
   - Intentional pairing of high-character display faces with ultra-legible geometric/neo-grotesque workhorse body type.
   - Text measure strictly managed (45–75 characters per line for long text).
   - `text-wrap: pretty` or balanced heading wraps to prevent straggler orphan words.
5. **Consistent Spacing & Layout Rhythm:**
   - Strict 4px/8px modular spacing system (`p-2`, `p-4`, `p-6`, `gap-4`, `gap-6`).
   - Symmetrical container padding and harmonious horizontal gutters.
6. **Clear, Role-Aware Navigation:**
   - Persistent role indication; active route indicators; accessible breadcrumbs or back links.
7. **High-Quality Operational Dashboards:**
   - Purposeful metric tiles with comparative context and clear units.
   - Unique, differentiated layouts tailored specifically to each role (Donor ≠ Volunteer ≠ NGO ≠ Admin).
8. **Refined Data Tables & Complex Forms:**
   - Clean tabular layouts with right-aligned numeric data, monospace timestamps/IDs, and distinct status badges.
   - Forms grouped logically with clear labels, helpful hints, and inline validation states.
9. **Purposeful Color Application:**
   - 60-30-10 distribution: quiet neutral backgrounds (60%), structural card surfaces (30%), intentional accent triggers (10%).
   - Minimum 4.5:1 contrast ratio for all standard body copy; 3:1 for large display elements.
10. **High-Quality Vector Iconography:**
    - Unified Lucide icon family with consistent stroke weight (1.5px or 2px).
    - Every functional icon button must include descriptive accessible labels (`aria-label` or `sr-only`).
11. **Meaningful Visual Feedback:**
    - Tactile hover, active, and focus states (smooth 150–250ms ease transitions).
    - Explicit loading skeletons that match layout geometry without jarring shifts.
12. **Subtle, Intentional Animation:**
    - Micro-interactions that reinforce physical causation (drawer slide-overs, subtle checkmark reveals).
    - Complete support for `prefers-reduced-motion: reduce`.
13. **Comprehensive Accessibility (WCAG 2.1 AA):**
    - High visible focus indicators (`ring-2 ring-primary ring-offset-2`).
    - Full keyboard navigability across tabs, dialogs, drawers, and form controls.
14. **Real Functionality Only:**
    - Every button, tab, link, and input must be connected to real application state or backend endpoints.

---

## 4. Strictly Prohibited UI Patterns ("Anti-Slop" Constraints)

- ❌ **Generic AI Dashboard Clichés:** Centered 3-card generic layouts, identical templates reused across different roles.
- ❌ **Gratuitous Gradients:** Purple-to-blue / violet-to-cyan gradient blobs or glowing backgrounds without a functional product justification.
- ❌ **Excessive Card Nesting:** Cards inside cards inside cards that waste vertical and horizontal screen real estate.
- ❌ **Over-Rounded Corners:** Pill-shaped cards, huge blob borders (`rounded-3xl` on operational dashboards) that soften precision.
- ❌ **Homogeneous Dashboards:** Making the Donor dashboard, Volunteer tasks, NGO deliveries, and Admin console look interchangeable.
- ❌ **Dead Space / Decorative Voids:** Large empty containers or arbitrary spacer blocks left without data.
- ❌ **Oversized Operational Heroes:** Massive banner headings pushing actionable tables below the fold on operational screens.
- ❌ **Random Emoji Icons:** Using emojis (🍔, 🚚, 📦) in place of professional SVG vector iconography.
- ❌ **Inconsistent Vertical Spacing:** Random combinations of `mt-3`, `pt-7`, `mb-11` without mathematical scale.
- ❌ **Weak Typography Contrast:** Grey-on-grey text (`#94A3B8` on `#F1F5F9`) failing WCAG contrast requirements.
- ❌ **Gratuitous Glassmorphism:** Blurry translucent backgrounds with poor readability under dynamic content.
- ❌ **Fabricated / Static Numbers:** Hardcoded fake graphs or non-updating metric mockups.
- ❌ **Non-Functional Controls:** Buttons that trigger no action, decorative pills that look clickable but do nothing.
- ❌ **Arbitrary, Distracting Animations:** Constant pulsing, bouncing badges, or endless loops that distract from tasks.

---

## 5. Design Skill Coordination Workflow

When executing redesigns and UI improvements, adhere to the following sequence:
1. **Intelligence & Specs:** Run `ui-ux-pro-max` (`python scripts/search.py --design-system ...` or `--stack nextjs`) to generate color tokens, typography scales, and component guidelines.
2. **Art Direction & Differentiation:** Run `taste-skill` (`node scripts/draw.mjs --sector nonprofit`) to select a distinctive visual concept, authentic compositional habits, and anti-slop rules.
3. **Consolidation:** Unify the tokens into Tailwind CSS and design-system variables.
4. **Execution & Assembly:** Build the desktop-first Next.js/React component hierarchy.
5. **Critique & Audit:** Run `impeccable` (`impeccable detect http://localhost:3000` or `/critique`, `/audit`, `/polish`) to verify contrast, typography, spacing, and accessibility before sign-off.

