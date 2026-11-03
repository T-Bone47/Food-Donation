# FoodShare Design System — Desktop-First Layouts & Grid Architecture

**Version:** 2.0.0  
**Primary Viewport:** 1920 × 1080 (16:9 Widescreen Desktop Standard)  
**Supported Grid Matrix:** 1920×1080 · 1440×900 · 1024×768 · 390×844  
**Updated:** November 2026  

---

## 1. Responsive Viewport Matrix

| Breakpoint Tier | Pixel Viewport | Device Benchmark | Layout Mode | Container Max Width | Horizontal Gutters |
|:---|:---|:---|:---|:---|:---|
| **Ultra Widescreen** | `1920 × 1080` | High-Definition Desktop Presentation | Multi-column Manifest Grid | `max-w-7xl` (1280px–1400px) | `px-10` (40px) |
| **Standard Laptop** | `1440 × 900` | MacBook Pro / Standard Laptop | 3-Column Responsive Grid | `max-w-7xl` | `px-8` (32px) |
| **Classroom / Display** | `1366 × 768` | Classroom Projector / PC Monitor | 2–3 Column Adaptive Grid | `max-w-6xl` | `px-6` (24px) |
| **Tablet Landscape** | `1024 × 768` | iPad / Tablet in Field | 2-Column Stacked Grid | `max-w-full` | `px-6` (24px) |
| **Modern Smartphone** | `390 × 844` | iPhone 14/15/16 / Modern Mobile | Single Column Stack + Bottom Nav | `max-w-full` | `px-4` (16px) |

---

## 2. Desktop Shell Architecture (`AppShell.tsx`, `AppNav.tsx`)

```
+---------------------------------------------------------------------------------------+
| STICKY HEADER (h = 64px)                                                             |
| [Soup Icon] FoodShare | [DEMO MODE: DONOR] [Guided Demo] | Overview My Donations | (U)|
+---------------------------------------------------------------------------------------+
| MAIN CONTENT CANVAS (max-w-7xl, px-4 sm:px-6 lg:px-10, py-8)                         |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   | PAGE HEADER: Title (Outfit 30px) + Description (Work Sans 14px) + Actions      |   |
|   +-------------------------------------------------------------------------------+   |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   | OPERATIONAL GRID                                                              |   |
|   | [ Card 1: 4 columns ]    [ Card 2: 4 columns ]    [ Card 3: 4 columns ]       |   |
|   +-------------------------------------------------------------------------------+   |
|                                                                                       |
+---------------------------------------------------------------------------------------+
| MOBILE ONLY: Bottom Fixed Tab Bar (h = 56px + safe-area)                             |
+---------------------------------------------------------------------------------------+
```

### Layout Rules:
1. **No Artificial Centering on Wide Screens:** Operational dashboards must not sit in a 600px narrow column. Tables, pickup lists, and manifests scale gracefully up to 1400px.
2. **Fixed Header with Skip Link:** The top bar is sticky with `z-40`, featuring a zero-tab-index skip-to-content anchor for keyboard users.
3. **Bottom Tab Bar on Mobile Only:** On viewports `< 768px`, the desktop navigation items transition into a thumb-accessible fixed bottom bar (`fixed inset-x-0 bottom-0 z-40`).

---

## 3. Role-Differentiated Grid Blueprints

### 1. Donor Hub Grid (`/donordash`, `/mydonations`)
- Top: 4-column metric strip (`StatList` auto-fit min 11rem).
- Middle: 3-column responsive card feed (`sm:grid-cols-2 lg:grid-cols-3 gap-6`).
- Bottom: Pager controls aligned to right margin.

### 2. Volunteer Dispatch Grid (`/volunteerdash`, `/volunteer/tasks`)
- Top: High-priority active task banner (full width, highlighted border).
- Middle: Available pickups 3-column feed with urgency countdown chips.
- Bottom: Historical completed task log.

### 3. NGO Intake Manifest Grid (`/ngodash`)
- Top: Incoming deliveries awaiting volunteer arrival (high visual priority).
- Middle: Delivery details card with digital receipt confirmation action.
- Bottom: Verified historical distribution log + collapsible organisation credentials.

### 4. Admin High-Density Grid (`/adminpage`)
- Top: Platform overview tiles + Needs Attention alert card.
- Middle: Tabbed navigation strip (Overview, Donations, Verifications, Users, Activity).
- Tables: Full-width responsive tabular view with sticky headers, right-aligned metrics, and inline action menus.

