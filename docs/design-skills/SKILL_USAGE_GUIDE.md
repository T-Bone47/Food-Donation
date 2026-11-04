# Unified Food Donation Platform — Specialist Design Skill Usage Guide

**Document Version:** 1.0.0  
**Target Roles:** Principal Design Engineer, Frontend Architect, Full-Stack Engineer  
**Skills Covered:** UI UX Pro Max (`ui-ux-pro-max`), Taste Skill (`design-taste-frontend`), Impeccable (`impeccable`)  

---

## 1. Skill Capabilities & Trigger Reference

| Skill | Primary Focus | Best Used For | Invocation Modes |
|---|---|---|---|
| **UI UX Pro Max** | Design Intelligence & Standards | Choosing palettes, typography pairings, layout patterns, Next.js/Tailwind rules, and accessibility checklists | Python CLI (`scripts/search.py`) or natural language prompt |
| **Taste Skill** | Art Direction & Visual Identity | Developing distinct visual concepts, gallery reference benchmarking, anti-slop rules, and AST anti-pattern linting | Node.js CLI (`scripts/draw.mjs`, `scripts/lint.mjs`) |
| **Impeccable** | UX Critique, Polish & Audit | Real-time DOM inspection, contrast checks, typography hierarchy audits, micro-interaction polish, and slash commands | Executable binary (`impeccable.exe detect`) or slash commands (`/critique`, `/audit`, `/polish`) |

---

## 2. Skill A: UI UX Pro Max Usage Runbook

UI UX Pro Max provides searchable intelligence across 79 styles, 192 product palettes, 74 font pairings, 119 UX guidelines, and 22 framework stacks.

### 2.1 Generating a Complete Design System
```bash
python .agents/skills/ui-ux-pro-max/scripts/search.py --design-system "food donation platform"
```
*When to use:* At the beginning of a redesign phase to obtain a cohesive palette, primary/secondary colors, semantic background tokens, font pairing, and accessibility parameters.

### 2.2 Searching by Style / Visual Identity
```bash
python .agents/skills/ui-ux-pro-max/scripts/search.py "bento grid clean dashboard" --domain style
```
*When to use:* When selecting a layout paradigm for a specific role console (e.g. data-dense layout for Admin, card-based tasks for Volunteer).

### 2.3 Querying Stack-Specific Implementation Rules
```bash
# Next.js 15+ App Router & Server/Client Components
python .agents/skills/ui-ux-pro-max/scripts/search.py "server components" --stack nextjs

# Tailwind CSS layout, flex, and grid best practices
python .agents/skills/ui-ux-pro-max/scripts/search.py "responsive container" --stack html-tailwind
```
*When to use:* Before writing component code to ensure strict adherence to Next.js 15 App Router conventions and zero unnecessary `'use client'` directives.

---

## 3. Skill B: Taste Skill (`design-taste-frontend`) Usage Runbook

Taste Skill enforces an "anti-slop" design philosophy distilled from 247 award-winning websites. It eliminates generic AI software cliches (monotone purple gradients, identical cards, dead white space).

### 3.1 Dealing a New Art Direction
```bash
node .agents/skills/design-taste-frontend/scripts/draw.mjs --sector nonprofit
```
*When to use:* When establishing a distinctive art direction for the public landing page or role consoles. The script outputs:
- Visual concept (e.g., "Colour chapters", "Editorial manifest")
- High-contrast color palette
- Curated display & body typography
- Exact hero and section compositions
- Real website reference studies

### 3.2 Running the Anti-Pattern Codebase Linter
```bash
node .agents/skills/design-taste-frontend/scripts/lint.mjs
```
*When to use:* Before committing or finalizing any redesigned screen. The linter scans `.tsx` and `.css` files for:
- `[emoji]` — Emojis used as interface icons
- `[hairline]` — Redundant divider rules (`divide-y`) that waste space
- `[purple]` — Violet/indigo AI-generated gradient accents
- `[bounce]` — Looping distracting attention animations
- `[default-font]` — Overused generic typefaces (`Inter`)

### 3.3 Real-Browser DOM Inspection
```bash
node .agents/skills/design-taste-frontend/scripts/inspect.mjs --url http://localhost:3000
```
*When to use:* To measure real-world contrast, text sizing (ensuring body >= 16px, small >= 13px), and symmetrical margins in the actual Chrome browser.

---

## 4. Skill C: Impeccable Usage Runbook

Impeccable provides design vocabulary, UX critique, and technical polish across 25 dedicated commands.

### 4.1 Live Anti-Pattern Scanning
```bash
# Scan running development server
& ".agents/skills/impeccable/scripts/bin/windows-x64/impeccable.exe" detect http://localhost:3000

# Scan specific component files
& ".agents/skills/impeccable/scripts/bin/windows-x64/impeccable.exe" detect frontend/src/app/donordash/page.tsx
```

### 4.2 Essential Slash Commands
When interacting with the AI agent in AntiGravity, prefix prompts with these slash commands:
- **/critique:** Evaluates UX hierarchy, cognitive load, and visual flow of a component.
- **/audit:** Runs technical checks across accessibility (WCAG AA), responsiveness, and touch targets.
- **/polish:** Final pass adjusting alignment, spacing, padding consistency, and hover states.
- **/typeset:** Refines font choices, weights, leading, and prevents line-wrap orphans (`text-wrap: pretty`).
- **/bolder:** Amplifies safe or sterile designs with stronger contrast and confident visual gestures.
- **/quieter:** Reduces visual noise, softens overly intense borders, and brings calmness to crowded screens.
- **/clarify:** Rewrites confusing microcopy, empty states, and validation alerts for humane clarity.
- **/harden:** Ensures error states, keyboard focus, long text truncation, and missing data fallbacks are robust.
- **/document:** Consolidates the design system into a permanent `DESIGN.md` specification.

---

## 5. Quick Command Cheat Sheet

```bash
# --- UI UX PRO MAX ---
python .agents/skills/ui-ux-pro-max/scripts/search.py --design-system "food donation platform"
python .agents/skills/ui-ux-pro-max/scripts/search.py "dashboard" --domain style
python .agents/skills/ui-ux-pro-max/scripts/search.py "streaming" --stack nextjs

# --- TASTE SKILL ---
node .agents/skills/design-taste-frontend/scripts/draw.mjs --sector nonprofit
node .agents/skills/design-taste-frontend/scripts/lint.mjs
node .agents/skills/design-taste-frontend/scripts/inspect.mjs --url http://localhost:3000

# --- IMPECCABLE ---
& ".agents/skills/impeccable/scripts/bin/windows-x64/impeccable.exe" detect http://localhost:3000
& ".agents/skills/impeccable/scripts/bin/windows-x64/impeccable.exe" help
```
