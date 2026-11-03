# FoodShare Design System — Typography Specification

**Version:** 2.0.0  
**Pairing:** `Outfit` (Display) + `Work Sans` (Body & Data) + `ui-monospace` (Code/IDs)  
**Updated:** November 2026  

---

## 1. Typeface Pairing Philosophy

1. **Display Headings (`font-display`):** `Outfit`
   - Geometric sans-serif with subtle organic softening.
   - Weights: 500 (Medium), 600 (Semi-bold), 700 (Bold), 800 (Extra-bold).
   - Character: Contemporary, civic, authoritative, high-density.
   - Wrap Rule: `text-wrap: balance` to prevent trailing orphan words.
   - Letter Spacing: Tight negative tracking (`-0.02em` to `-0.03em`) on sizes above 24px.

2. **Body & Operational Copy (`font-sans`):** `Work Sans`
   - Neo-grotesque workhorse engineered for screen reading.
   - Weights: 400 (Regular), 500 (Medium), 600 (Semi-bold).
   - Character: Open apertures, high x-height, clear numeric distinctions.
   - Wrap Rule: `text-wrap: pretty` for long descriptions (45–75 characters per line).

3. **Monospace & Identifiers (`font-mono`):** `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
   - Used inside semantic `<code>` tags for transaction IDs, coordinates, and system error reference codes.

---

## 2. Type Scale & Optical Hierarchy

| Semantic Token | Tailwind Class | Font Family | Size (Desktop / Mobile) | Line Height | Weight | Tracking | Primary Usage |
|:---|:---|:---|:---|:---|:---|:---|:---|
| `display` | `text-display` | `font-display` | 40px (2.5rem) / 30px | 1.15 | 700 | -0.03em | Presentation heroes, public landing banner |
| `title` | `text-title` | `font-display` | 30px (1.875rem) / 24px | 1.25 | 600 | -0.025em | Page headers (`/donordash`, `/adminpage`) |
| `heading` | `text-heading` | `font-display` | 20px (1.25rem) / 18px | 1.35 | 600 | -0.02em | Section titles, card titles, modal titles |
| `subheading` | `text-base` | `font-sans` | 16px (1.0rem) / 15px | 1.50 | 600 | normal | Fieldset legends, table column headers |
| `body` | `text-sm` | `font-sans` | 14px (0.875rem) / 14px | 1.50 | 400 | normal | Standard body text, form field labels |
| `meta` | `text-meta` | `font-sans` | 13px (0.8125rem) / 12px | 1.40 | 500 | normal | Timestamps, relative time tags, hints |
| `code` | `text-xs font-mono` | `font-mono` | 12px (0.75rem) / 11px | 1.40 | 400 | normal | IDs, coordinates, request IDs |

---

## 3. Numeric & Tabular Formatting Rules

1. **Right-Alignment in Tables:** All numeric quantities (servings, kg, litres, user counts) must be right-aligned in tabular layouts for instant column scanning.
2. **Tabular Numerals (`font-variant-numeric: tabular-nums`):** Applied to counters, countdown timers, and financial/meal sums to eliminate horizontal jitter when numbers update.
3. **Per-Unit Precision:** Quantities must always include explicit units (`50 portions`, `25.5 kg`, `10 L`). Never sum values across different measurement units.

