# Unified Food Donation Platform — Design Intelligence Coordination & Redesign Workflow

**Document Version:** 1.0.0  
**Phase:** Phase 1 Preparation for Complete UI/UX Redesign  
**Project:** Unified Food Donation Platform (FoodShare)  
**Methodology:** 5-Stage Disciplined Design Pipeline  

---

## 1. The Multi-Skill Coordination Principle

A common failure in multi-agent design systems is allowing different tooling packages to generate competing, clashing implementations simultaneously. 

To prevent friction, the three specialist skills are assigned strict, non-overlapping sequential responsibilities:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        STAGE 1: RESEARCH & SPECS                       │
│                        UI UX PRO MAX (Intelligence)                    │
│   • Domain-specific palette derivation                                 │
│   • Semantic typography pairings & scale                               │
│   • Next.js 15 & Tailwind architectural constraints                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        STAGE 2: ART DIRECTION                          │
│                        TASTE SKILL (Direction)                         │
│   • Anti-slop visual concept selection                                 │
│   • 247-site gallery reference benchmarking                            │
│   • Elimination of AI cliches (no purple gradients, no fake shadows)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        STAGE 3: CONSOLIDATION                          │
│                        MASTER DESIGN SYSTEM                            │
│   • Unification of tokens into Tailwind CSS                            │
│   • Definition of 1920×1080 desktop-first layouts                      │
│   • Role-specific differentiated layout models                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        STAGE 4: IMPLEMENTATION                         │
│                        Next.js 15 / React 19 Frontend                  │
│   • Clean, accessible component construction                           │
│   • Preserving 100% of existing backend & demo API contracts          │
│   • Real-time responsive verification (390×844 to 1920×1080)           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        STAGE 5: AUDIT & CRITIQUE                       │
│                        IMPECCABLE (Refinement & Polish)                │
│   • Automated live browser DOM anti-pattern audit                      │
│   • Accessibility compliance check (WCAG 2.1 AA)                       │
│   • Typography orphan prevention (`text-wrap: pretty`)                 │
│   • Micro-interaction and hover state polish                           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Step-by-Step Execution Sequence for Phase 2

### Step 1: Research & Token Derivation (UI UX Pro Max)
1. Run `python .agents/skills/ui-ux-pro-max/scripts/search.py --design-system "food donation platform"`.
2. Extract the primary palette (warm appetizing orange + civic trust blue + rich charcoal text + warm cream card surfaces).
3. Review Next.js 15 rules via `python .agents/skills/ui-ux-pro-max/scripts/search.py "server components" --stack nextjs` to ensure Server Component boundaries remain clean.

### Step 2: Visual Concept & Art Direction (Taste Skill)
1. Run `node .agents/skills/design-taste-frontend/scripts/draw.mjs --sector nonprofit`.
2. Select the core conceptual anchor: **"The Manifest & Community Table"** — treating food donations not as generic ecommerce items, but as urgent community food rescue manifests.
3. Review AST anti-pattern rules (`anti-patterns.md`) to purge generic AI cliches:
   - No centered 3-card generic layouts.
   - No purple/violet glowing gradients.
   - No empty decorative cards.
   - Real SVG iconography (Lucide) exclusively; zero emojis in UI buttons.

### Step 3: Consolidation into Master Tokens
1. Update `frontend/tailwind.config.js` and `frontend/src/app/globals.css`.
2. Establish the high-contrast color variables:
   - `--background`: Warm organic cream (`#FFF7ED` / `#FAF8F5`)
   - `--foreground`: Deep charcoal (`#0F172A`)
   - `--primary`: Saturated harvest orange (`#EA580C`)
   - `--accent`: Deep civic blue (`#1D4ED8`)
   - `--card`: Crisp white (`#FFFFFF`) with crisp 1px subtle borders (`#E2E8F0`)
3. Set typography scale with clamp rules to guarantee presentation sharpness at 1920×1080 while remaining legible on mobile.

### Step 4: Role-by-Role Differentiated Redesign
Each platform user role receives a unique, tailored layout model suited to its workflow:

- **Donor Experience (`/donordash`, `/donate`, `/mydonations`):**
  - High-clarity surplus listing creation.
  - Large, readable visual journey step progress tracker.
  - Actionable alerts for volunteer claims.
- **Volunteer Logistics (`/volunteerdash`, `/volunteer/tasks`):**
  - Urgent countdown timers for food rescue deadlines.
  - Map-centric geographic dispatch cards with distance indicators.
  - Two-stage physical collection verification ("Picked up" -> "Delivered to NGO").
- **NGO Community Intake (`/ngodash`):**
  - Manifest intake inspection view.
  - Prominent verification badges.
  - One-click receipt confirmation dialog.
  - Community impact tallies (meals distributed, kilograms rescued).
- **Admin Governance (`/adminpage`):**
  - Data-dense operational console with side-by-side metric tables.
  - Quick-action verification review drawers.
  - Comprehensive immutable audit event stream.

### Step 5: Critique, Polish & Quality Gate (Impeccable)
1. Launch the local dev servers.
2. Run `& ".agents/skills/impeccable/scripts/bin/windows-x64/impeccable.exe" detect http://localhost:3000`.
3. Fix all flagged warnings:
   - Verify zero contrast violations (<4.5:1 text).
   - Ensure every paragraph has `text-wrap: pretty`.
   - Verify keyboard focus states (`ring-2 ring-primary`).
4. Execute `/polish` and `/harden` checks across edge cases (long titles, zero donations state, network error banners).

---

## 3. Strict Quality Checklist Before Sign-Off

- [ ] **Desktop-First Integrity:** Looks breathtaking at 1920×1080 on presentation screens.
- [ ] **Zero AI Cliches:** Taste Skill linter (`lint.mjs`) reports 0 FAILs.
- [ ] **Zero Typography Stragglers:** Impeccable detect reports 0 anti-patterns.
- [ ] **Accessibility:** All clickable elements have minimum 44×44px touch targets and visible focus indicators.
- [ ] **Contract Preservation:** All existing API response envelopes, authentication endpoints, and demo tenant flows continue functioning with zero regressions.
