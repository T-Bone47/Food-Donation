# FoodShare — Interaction Design & Micro-Interactions Specification

**Document:** `docs/ui-ux/09_INTERACTION_DESIGN.md`  
**Platform:** FoodShare — The Food Rescue Operating Platform  
**Target Viewports:** 1920 × 1080 (Desktop HD), 1440 × 900 (Laptop), 1024 × 768 (Tablet), 390 × 844 (Mobile)  
**Date:** November 2, 2026  
**Interaction Lead:** Senior Interaction Designer  

---

## 1. Interaction Principles & Anti-Slop Constraints

Every interactive component on FoodShare adheres to physical causality principles:
1. **Zero Gratuitous Animations:** Endless looping pulses, bouncing icons, or arbitrary floating cards are strictly forbidden.
2. **Tactile Causality (150–200ms Easing):** Hover states, button presses, and tab switches respond smoothly within 150–200ms using CSS `ease-out`.
3. **Motion Reduction Compliance:** Full support for `prefers-reduced-motion: reduce`. All transitions and slide-overs become instantaneous for users requesting reduced motion.

---

## 2. Component Micro-Interactions

### 1. Navigation Rail & Tab Bar
- **Active State Transition:** Selected sidebar navigation links gain a high-contrast filled background (`bg-primary text-primary-foreground`) and 2px focus ring.
- **Hover Feedback:** Inactive links smoothly shift to `bg-muted text-foreground` within 150ms.

### 2. Slide-Over Drawers (Chatbot & Guided Demo)
- **Entrance Animation:** Slides smoothly from right margin (`translate-x-0` from `translate-x-full`) over 250ms cubic-bezier ease.
- **Escape Key Handling:** Pressing `Escape` or clicking the dimmed backdrop immediately returns focus to the initiating launcher button.

### 3. Native Confirmation Dialogs (`ConfirmDialog.tsx`)
- Native HTML `<dialog role="dialog">` with modal backdrop (`backdrop:bg-black/60`).
- Focus trapping: Tab navigation cycles exclusively inside dialog buttons. Destructive actions default focus to "Cancel" to prevent accidental keystroke submission.

### 4. Chatbot Assistant (`Chatbot.tsx`)
- Launcher floating action button with 150ms hover scale (`hover:scale-105`).
- Typing indicator utilizes calm sequential pulse (`animate-pulse motion-reduce:animate-none`), completely eliminating distracting bounce loops.

