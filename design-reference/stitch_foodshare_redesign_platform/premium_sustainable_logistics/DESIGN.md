---
name: Premium Sustainable Logistics
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#404942'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#707971'
  outline-variant: '#c0c9c0'
  surface-tint: '#2d6a48'
  primary: '#003820'
  on-primary: '#ffffff'
  primary-container: '#0f5132'
  on-primary-container: '#84c39b'
  inverse-primary: '#95d4ac'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#003825'
  on-tertiary: '#ffffff'
  tertiary-container: '#005137'
  on-tertiary-container: '#28cc93'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f1c7'
  primary-fixed-dim: '#95d4ac'
  on-primary-fixed: '#002111'
  on-primary-fixed-variant: '#0f5132'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#68fcbf'
  tertiary-fixed-dim: '#45dfa4'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.03em
  headline-xl:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-lg:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.005em
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
  data-mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.02em
  data-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
  data-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies the operational precision of an enterprise logistics orchestration platform fused with the grounded ethos of systemic environmental stewardship. It moves intentionally away from naive pastoral charity aesthetics, projecting instead an institutional-grade, highly dependable technological foundation. The interface prioritizes mission-critical situational awareness, real-time custody routing, and humanitarian trust.

The aesthetic fuses **Modern Technical Corporate** with precision **Data-Dense Utilitarianism**. Surfaces are structured, hyper-legible, and disciplined. Spatial efficiency is balanced by generous contrast ratios, architectural framing, and subtle translucent materials that convey modern computational velocity without sacrificing operational weight.

## Colors

The palette balances clinical precision against organic depth, dividing functional surfaces from real-time lifecycle tracking.

### Brand Palette
- **Primary (Forest Emerald):** Base `#0F5132` drives primary actions, authoritative metrics, and brand grounding. Supported by deep `#0A3D2A` for elevated contrast/dark surfaces and vivid `#10B981` for active interactive highlights.
- **Secondary (Slate & Zinc):** `#0F172A` delivers structural ink contrast, supported by `#1E293B` and `#334155` for high-hierarchy copy, `#64748B` for meta captions and borders, and `#F1F5F9`/`#F8FAFC` for zoned backgrounds.
- **Accent (Bioluminescent Mint):** `#34D399` and `#059669` serve as micro-accents, live ping indicators, active routes, and energy conservation signals.

### Lifecycle Semantics
Lifecycle states demand non-colliding distinct color codings paired with dedicated background tints (10-15% alpha) and dark legible text tokens:
- **AVAILABLE:** `#10B981` (Vibrant Emerald)
- **ASSIGNED:** `#6366F1` (Cobalt Indigo)
- **PICKED_UP:** `#F59E0B` (Amber Marigold)
- **DELIVERED:** `#0EA5E9` (Cyan Sky)
- **COMPLETED:** `#0D9488` (Teal Green)
- **CANCELLED / EXPIRED:** `#F43F5E` (Rose Crimson) with `#94A3B8` (Muted Slate) fallback.

## Typography

The type system prioritizes instantaneous cognitive parsing under time-sensitive dispatch conditions.

- **Primary UI & Headings (Geist):** Clean, neo-grotesque structural rhythm with precise geometric joints and neutral terminals. Tightly tracked across display tiers to reinforce solid enterprise hierarchy.
- **Logistics, Data & Timestamps (JetBrains Mono):** Used rigorously for cargo weights, temperatures, dispatch IDs, GPS coordinates, arrival ETAs, and real-time ledger metrics. Its fixed pitch guarantees strict vertical alignment across dense multi-column tabular grids without visual drift.
- All numbers within standard interface text must enforce OpenType tabular figures (`font-variant-numeric: tabular-nums`).

## Layout & Spacing

The architecture operates on an 8-point spatial model tuned for data density and operational clarity.

### Grid Infrastructure
- **Desktop (≥ 1280px):** 12-column layout with a fixed 280px left command sidebar, fluid dispatch stage, dynamic 360px collapsible context rail, `1.5rem` (`24px`) gutters, and `2rem` outer container padding.
- **Tablet (768px – 1279px):** 8-column layout with a compressed 64px icon dock, modalized context rail, `1rem` gutters, and `1.5rem` outer margins.
- **Mobile (< 768px):** 4-column layout, bottom persistent navigation, stacked contextual cards, full-width data lists, and `1rem` outer canvas padding.

Information density is tuned to minimize unnecessary scroll travel while maintaining clear vertical separation between critical operational modules.

## Elevation & Depth

Visual hierarchy relies on structural planes and subtle tonal boundaries rather than deep dropped shadows.

- **Layer 0 (Canvas Base):** Flat `#F8FAFC`, non-elevated.
- **Layer 1 (Card / Module Surface):** Solid `#FFFFFF`, bordered by 1px solid `#E2E8F0`. Depth is conveyed through hairline containment, not shadow spread.
- **Layer 2 (Floating Popovers, Dropdowns & Menus):** Pure white background with an ultra-diffused atmospheric shadow: `0 4px 20px -2px rgba(15, 23, 42, 0.08)`, bounded by a 1px `#CBD5E1` border.
- **Layer 3 (Modals & Urgent Dispatch Overlays):** Multi-layered boundary: `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`, anchored over a `#0F172A` backdrop scrim with 40% opacity and 4px blur.
- **HUD & Status Indicators (Translucent Elements):** Background `#FFFFFF` with 85% alpha and `backdrop-filter: blur(8px)`, framed with `#E2E8F0` at 60% opacity for tactical overlay surfaces.

## Shapes

The design system enforces a calibrated, industrial corner curvature (`roundedness: 1`). 

- Default elements (buttons, inputs, status tags, list cells) feature a `4px` (`0.25rem`) border radius, communicating mechanical precision and structural integrity.
- Major containers, data tables, and logistics cards utilize `8px` (`0.5rem`, `rounded-lg`).
- Modals, large slide-overs, and master dashboard panels step up to `12px` (`0.75rem`, `rounded-xl`).
- Circular geometry (`rounded-full`) is strictly reserved for live pulse dots, vehicle positioning map pins, user avatars, and status badges.

## Components

### Buttons
- **Primary:** Filled `#0F5132` with `#FFFFFF` text. Hover transitions to `#0A3D2A`. Focus-visible produces a crisp 2px offset ring in `#10B981`.
- **Secondary:** Surface `#FFFFFF` with 1px border in `#CBD5E1` and text in `#0F172A`. Hover transitions to `#F8FAFC` background with `#94A3B8` border.
- **Destructive:** Background `#FFF1F2`, text `#BE123C`, border 1px solid `#FECDD3`. Hover transitions to solid `#F43F5E` with white text.
- **Compact Variants:** Heights restricted to `32px` for table row actions, using `0.25rem` radius and `12px` Geist Medium.

### Lifecycle Status Chips
- Composed with an outer pill or compact rounded tag (`4px` radius), padding `2px 8px`, accompanied by a 6px status dot.
- Example: **AVAILABLE** uses `#ECFDF5` background, `#065F46` label, and `#10B981` dot. **ASSIGNED** uses `#EEF2FF` background, `#3730A3` label, and `#6366F1` dot.
- Text must render in `JetBrains Mono` at `11px` uppercase with `letterSpacing: 0.05em`.

### Data Tables & Logistics Feeds
- Header rows utilize `#F8FAFC` with uppercase `JetBrains Mono` at `11px` in `#64748B`, framed by a bottom 1px border `#E2E8F0`.
- Row height is strictly `40px` (dense) or `48px` (default). Hover state applies `#F1F5F9` at 50% opacity.
- Tabular numeric alignment: Right-align weights, quantities, durations, and timestamps; left-align rescue IDs, route origins, and destination handles.

### Input Fields & Controls
- Base input height is `36px`, utilizing `#FFFFFF` background, `#0F172A` text, and 1px border `#CBD5E1`.
- Focus ring: 1px border `#0F5132` paired with `0 0 0 2px rgba(16, 185, 129, 0.2)`.
- Checkboxes and radios use a 16px footprint with `#0F5132` active fill and sharp check indicators.

### Cards & Module Panes
- Flat white containers bounded by `#E2E8F0` borders with 8px radius.
- Card headers feature clear separation using a 1px border divider, containing a monospace metadata tag counter (e.g., `TOTAL CARGO: 420 KG`).

### Specialized Domain Components
- **Telemetry HUD:** Monospace split-pill displaying ambient sensor feeds (temperature, refrigeration integrity, route ETA) set against `#0F172A` with `#34D399` text.
- **Chain of Custody Stepper:** Compact horizontal pipeline showing node transfers between donor, dispatch driver, and recipient food bank, using semantic color progressions.