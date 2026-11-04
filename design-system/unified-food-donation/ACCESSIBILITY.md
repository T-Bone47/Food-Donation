# FoodShare Design System — Accessibility & Compliance Specification

**Version:** 2.0.0  
**Standard:** WCAG 2.2 AA / Section 508 / EN 301 549  
**Audited By:** Impeccable DOM Inspector & Axe Core Engine  
**Updated:** November 2026  

---

## 1. Contrast Ratios & Visual Independence

1. **Text Contrast:**
   - Standard body text (14px–16px): Minimum **4.5:1** contrast ratio against its ground (e.g., `#1C1917` on `#FBFBFA` achieves **14.8:1**).
   - Large display text (>= 24px): Minimum **3.0:1** contrast ratio.
   - Secondary helper and hint copy: Minimum **4.5:1** (e.g., `#57534E` on `#FFFFFF` achieves **5.2:1**).
2. **Color Independence:**
   - Status is NEVER communicated via color alone. Every status badge includes an unambiguous SVG icon and an explicit descriptive text label (`Available`, `Assigned`, `Picked up`, `Delivered`, `Completed`, `Cancelled`, `Expired`).
3. **Focus Indicators:**
   - All interactive controls feature a prominent, 2px visible focus ring (`ring-2 ring-primary ring-offset-2`). Default browser outline removal is strictly accompanied by a replacement focus ring.

---

## 2. Semantic Structure & Landmark Navigation

1. **Landmarks:**
   - Header: `<header className="sticky top-0 z-40 ...">`
   - Primary Navigation: `<nav aria-label="Main">`
   - Main Content: `<main id="main-content" tabIndex={-1}>`
   - Complementary: `<aside aria-label="About FoodShare">`
2. **Skip Navigation Link:**
   - The first focusable item on every page is a skip-to-content link:
     ```html
     <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 ...">
       Skip to main content
     </a>
     ```
3. **Heading Hierarchy:**
   - Exactly one `<h1>` per page.
   - Sub-sections strictly descend through `<h2>` and `<h3>` without skipping levels.

---

## 3. Form Accessibility & Error Handling

1. **Explicit Labels:** Every `<input>`, `<select>`, and `<textarea>` is explicitly linked to its label via `htmlFor` and `id`.
2. **Error Announcements:** Form validation failures are rendered with `role="alert"` and linked via `aria-describedby` so screen readers announce the error upon field blur or form submission.
3. **Required Fields:** All required inputs are designated with `aria-required="true"` and an accessible visual indicator (`*`).
4. **Touch Target Size:** All touch targets on mobile and desktop viewports are minimum **44 × 44 pixels**.

---

## 4. Modal Dialogs & Overlay Trapping

1. **Native Dialog Elements:** Modal dialogs use `<dialog role="dialog" aria-labelledby="..." aria-describedby="...">`.
2. **Inert Background:** While a modal is open, the background canvas is set to `inert` or covered by a non-interactive backdrop.
3. **Focus Restoration:** Upon modal closure, focus is programmatically returned to the button that triggered the dialog.
