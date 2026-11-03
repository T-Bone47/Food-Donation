# FoodShare Design System — Semantic Design Tokens

**Version:** 2.0.0  
**Stack Alignment:** Tailwind CSS v4 (@theme inline) & CSS Custom Properties  
**Updated:** November 2026  

---

## 1. Palette Architecture (60-30-10 Rule)

```css
:root {
  /* ==========================================================================
     CORE BASE PALETTE (ORGANIC HARVEST + CIVIC PRECISION)
     ========================================================================== */
  --leaf-50:  #f0f7f2;
  --leaf-100: #dceee1;
  --leaf-200: #b9dec4;
  --leaf-500: #2d9455;
  --leaf-600: #1b683a;
  --leaf-700: #165330;
  --leaf-800: #134227;
  --leaf-900: #0f3520;

  --harvest-50:  #fdfbf7;
  --harvest-100: #fbf5eb;
  --harvest-200: #f6ebd5;
  --harvest-500: #d89e3a;
  --harvest-600: #b87c24;
  --harvest-700: #935e1c;
  --harvest-800: #764b1b;

  --chili-50:  #fef2f2;
  --chili-100: #fee2e2;
  --chili-600: #dc2626;
  --chili-700: #b91c1c;
  --chili-800: #991b1b;

  --civic-50:  #f0fdfa;
  --civic-100: #ccfbf1;
  --civic-600: #0d9488;
  --civic-700: #0f766e;
  --civic-800: #115e59;

  --stone-50:  #fafaf9;
  --stone-100: #f5f5f4;
  --stone-200: #e7e5e4;
  --stone-600: #57534e;
  --stone-700: #44403c;
  --stone-800: #292524;
  --stone-900: #1c1917;

  /* ==========================================================================
     SEMANTIC APPLICATION TOKENS
     ========================================================================== */
  --color-primary: var(--leaf-600);
  --color-primary-hover: var(--leaf-700);
  --color-primary-active: var(--leaf-800);
  --color-primary-foreground: #ffffff;
  --color-primary-soft: var(--leaf-50);
  --color-primary-soft-foreground: var(--leaf-700);

  --color-background: #fbfbfa;
  --color-card: #ffffff;
  --color-card-foreground: var(--stone-900);
  --color-foreground: #1c1917;
  --color-muted: #f4f4f2;
  --color-muted-foreground: #57534e;
  --color-border: #e2e2dc;
  --color-ring: var(--leaf-600);

  --color-destructive: var(--chili-700);
  --color-destructive-soft: var(--chili-50);
  --color-destructive-foreground: #ffffff;

  --color-accent: var(--harvest-100);
  --color-accent-foreground: var(--harvest-800);

  /* Role-Specific Accent Tokens */
  --role-donor: var(--leaf-600);
  --role-donor-soft: var(--leaf-50);
  --role-volunteer: #0284c7;
  --role-volunteer-soft: #f0f9ff;
  --role-ngo: var(--civic-600);
  --role-ngo-soft: var(--civic-50);
  --role-admin: #d97706;
  --role-admin-soft: #fffbeb;

  /* Donation Lifecycle Status Badges */
  --color-status-available-bg: var(--leaf-50);
  --color-status-available-fg: var(--leaf-700);
  --color-status-available-border: var(--leaf-200);

  --color-status-assigned-bg: #f0f9ff;
  --color-status-assigned-fg: #0369a1;
  --color-status-assigned-border: #bae6fd;

  --color-status-picked-up-bg: var(--harvest-100);
  --color-status-picked-up-fg: var(--harvest-800);
  --color-status-picked-up-border: var(--harvest-200);

  --color-status-delivered-bg: var(--civic-50);
  --color-status-delivered-fg: var(--civic-700);
  --color-status-delivered-border: var(--civic-100);

  --color-status-completed-bg: #ecfdf5;
  --color-status-completed-fg: #047857;
  --color-status-completed-border: #a7f3d0;

  --color-status-cancelled-bg: var(--stone-100);
  --color-status-cancelled-fg: var(--stone-700);
  --color-status-cancelled-border: var(--stone-200);

  --color-status-expired-bg: var(--chili-50);
  --color-status-expired-fg: var(--chili-800);
  --color-status-expired-border: var(--chili-100);
}
```

---

## 2. Elevation & Depth Tokens

| Token | CSS Value | Usage Rules |
|:---|:---|:---|
| `shadow-none` | `none` | Standard resting state for all dashboard cards, form fieldsets, and tables. |
| `shadow-card` | `0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)` | Subtle lift for active interactive cards (hover state only). |
| `shadow-overlay` | `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)` | Native `<dialog>` modals and confirm dialogs. |
| `shadow-raised` | `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)` | Floating drawers (Chatbot, Guided Presentation Assistant). |

---

## 3. Border Radii Scale

- `rounded-sm`: 4px — Status tags, monospace code pills, compact buttons.
- `rounded-md`: 6px — Form inputs, select dropdowns, textareas.
- `rounded-lg`: 8px — Sub-panels, list items, alert banners.
- `rounded-xl`: 12px — Primary cards, modal dialogs, drawer panels.
- `rounded-full`: 9999px — User avatar chips, role pills, circular icon triggers.
*(Constraint: `rounded-3xl` and oversized pill containers are strictly prohibited on operational screens).*

