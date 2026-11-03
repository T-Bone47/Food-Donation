# FoodShare Design System — Interaction Design & Micro-animations

**Version:** 2.0.0  
**Compliance:** WCAG 2.2 AA / `prefers-reduced-motion`  
**Updated:** November 2026  

---

## 1. Interaction Principles

1. **Physical Causation:** Every movement has a clear visual origin. Drawers slide in from the screen edge where the launcher is anchored; modals scale gently from 0.98 to 1.0; dropdowns emerge immediately below their trigger.
2. **Predictable Timing:**
   - Quick feedback (hover, focus, active press): `150ms–200ms ease-out`.
   - Structural transitions (drawer slide, modal dialog): `200ms–250ms ease-out`.
   - Page-level loading transitions: Skeleton shimmer at `1.5s` linear loop without jarring content jumps.
3. **Resting Restraint:** Zero animations at rest. Elements on screen do not bounce, pulse, or wiggle unless the user actively interacts with them.
4. **Reduced Motion Law:** Under `@media (prefers-reduced-motion: reduce)`, all transitions drop to `duration: 0.01ms` or immediate opacity fade.

---

## 2. Interactive Component States

### Primary Buttons
- **Rest:** Solid fill, sharp 1px border tone.
- **Hover:** Darkened background shade (`hover:bg-primary-hover`) with 150ms transition.
- **Active / Pressed:** Subtle 1px downward translation or darkened tone (`bg-primary-active`).
- **Focus-Visible:** `ring-2 ring-primary ring-offset-2 outline-none`.

### Card Hover Feedback
- Active cards (such as available pickup listings) transition their border tone from subtle gray to role accent on hover (`hover:border-primary/50`).
- Resting drop-shadows are omitted; elevation increases only on interactive focus.

### Tab Triggers (`Tabs.tsx`)
- Active tab is communicated via high-contrast foreground color, background fill (`bg-background font-semibold`), and a subtle borderless active indicator.
- Horizontal scroll container keeps the active tab in view on small viewports without obscuring other tabs.

### Chatbot Drawer (`Chatbot.tsx`)
- Floating launcher button fixed at bottom-right (`bottom-6 right-6`).
- Typing indicator uses calm sequential opacity pulse (`animate-pulse motion-reduce:animate-none`) with 200ms delay between dots, strictly avoiding bouncy distraction loops.
- Instant copy button provides tactile visual confirmation (`Check` icon + "Copied" tag for 2 seconds).

---

## 3. Keyboard Navigation Sequences

| Key | Context | Action |
|:---|:---|:---|
| `Tab` / `Shift+Tab` | Universal | Sequential navigation through all interactive controls in visual reading order. |
| `Escape` | Modals / Drawers / Menus | Immediately closes open dialog, drawer, or dropdown and restores focus to triggering control. |
| `Enter` / `Space` | Buttons / Accordions / Tabs | Activates trigger or toggles selection. |
| `Arrow Keys` | Tab Strips / Menus | Moves focus between adjacent tabs or menu items. |

