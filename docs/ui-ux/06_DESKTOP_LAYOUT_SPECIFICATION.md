# FoodShare / Unified Food Donation Platform
## Phase 2: Desktop Layout Specification (1920 × 1080 Focus)

**Date:** November 2, 2026  
**Primary Target Viewport:** 1920 × 1080 (16:9 Presentation Standard)  
**Secondary Viewports:** 1440 × 900 · 1024 × 768 · 390 × 844  

---

## 1. Widescreen Desktop Grid (1920 × 1080)

To eliminate the "narrow mobile column" defect identified in Phase 0:
- **Maximum Width:** `max-w-7xl` (`1280px` to `1400px` effective boundary).
- **Horizontal Margins:** Symmetrical `px-10` (40px) gutters on `lg:` screens.
- **Vertical Spacing Rhythm:** Modular 8px spacing scale (`py-6 sm:py-8 lg:py-10`).
- **Above-the-Fold Priority:** Critical metrics and urgent tasks are positioned within the top `680px` of vertical height so evaluators immediately grasp platform status without initial scrolling.

---

## 2. Multi-Column Grid Specifications

### 2.1 3-Column Listing Grid
- Used on: `/mydonations`, `/volunteerdash`.
- Class definition: `grid gap-6 sm:grid-cols-2 lg:grid-cols-3`.
- Card width at 1920×1080: approximately `380px–420px`, allowing generous space for title, location, deadline chip, and action button without text truncation.

### 2.2 2-Column Manifest Grid
- Used on: `/donate`, `/ngodash` (Intake queue vs. Profile verification).
- Class definition: `grid gap-6 lg:grid-cols-2`.
- Pairs logically related inputs (e.g., Collection Deadline next to Expiration Deadline).

### 2.3 High-Density Tabular Grid
- Used on: `/adminpage` (Donations, Users, Verifications, Activity).
- Class definition: Full-width responsive table wrapped in `overflow-x-auto rounded-xl border bg-card`.
- Column hierarchy:
  - Left column: Primary entity name (bold) + sub-category (muted).
  - Middle columns: Associated user / NGO metadata.
  - Numeric columns: Right-aligned tabular numerals (`tabular-nums`).
  - Right column: Status badge + action button.

---

## 3. Responsive Breakpoint Mapping

```css
/* Tailwind CSS v4 Breakpoint Rules */
@media (min-width: 640px)  { /* sm: Tablet portrait / Wide mobile */ }
@media (min-width: 768px)  { /* md: Tablet landscape / Navigation shifts to top header */ }
@media (min-width: 1024px) { /* lg: Standard laptop / 3-column grids activate */ }
@media (min-width: 1280px) { /* xl: Desktop / max-w-7xl canvas activates */ }
@media (min-width: 1536px) { /* 2xl: 1920x1080 high-definition presentation mode */ }
```

