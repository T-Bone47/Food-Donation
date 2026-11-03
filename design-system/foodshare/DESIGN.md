# FoodShare Design System & Architectural Principles
**System:** FoodShare Sustainable Logistics Design System  
**Version:** 2.0.0  
**Design Authority:** Google Stitch References + Taste Skill Anti-Slop Principles  

---

## 1. Brand Essence: Sustainable Technology with Human Dignity

FoodShare operates at the intersection of logistical rigor and compassionate humanitarian relief. The visual system is rooted in:
1. **Calm, High-Contrast Surfaces:** 60% quiet neutral backgrounds (`#F8F9FF`), 30% structural white card surfaces (`#FFFFFF`), and 10% intentional action accents (`#0F5132`).
2. **Restrained Precision:** No gratuitous neon gradients, no glowing blobs, no floating cards inside cards, and zero decorative emojis.
3. **Typographic Integrity:** Standardized on **Geist Sans** for supreme readability across high-density data tables and mobile forms. Monospace (**Geist Mono**) is strictly contained to technical IDs and numeric audit values.

---

## 2. Color Palette & Functional Contrast

- **Deep Forest Emerald (`#0F5132`):** Primary brand trigger, active navigation, submit buttons. Minimum contrast ratio against white is 7.4:1 (exceeds WCAG AAA).
- **Ink Primary (`#0B1C30`):** Ultra-dark slate for all primary headings and numbers.
- **Ink Soft (`#404942`) & Muted (`#707971`):** Helper text, secondary descriptions, table headers. (All $\ge 4.5:1$ against surface).
- **Lifecycle Semantic Tokens:**
  - `AVAILABLE`: Soft Mint (`#ECFDF5`, text `#065F46`)
  - `ASSIGNED`: Civic Indigo (`#EEF2FF`, text `#3730A3`)
  - `PICKED_UP`: Harvest Amber (`#FEF3C7`, text `#92400E`)
  - `DELIVERED`: Cyan Staging (`#E0F2FE`, text `#0369A1`)
  - `COMPLETED`: Teal Ledger (`#CCFBF1`, text `#115E59`)
  - `CANCELLED`: Chili Red (`#FFE4E6`, text `#9F1239`)
  - `EXPIRED`: Slate Neutral (`#F1F5F9`, text `#334155`)

---

## 3. Typography Scale & Hierarchy

| Role | Font Family | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | Geist Sans | `2.5rem` (`40px`) | Bold (700) | 1.15 | Public landing page hero title |
| **H1** | Geist Sans | `2.0rem` (`32px`) | Bold (700) | 1.20 | Main page operational headings |
| **H2** | Geist Sans | `1.5rem` (`24px`) | Semibold (600) | 1.25 | Section headers, modal titles |
| **H3** | Geist Sans | `1.125rem` (`18px`)| Semibold (600) | 1.35 | Card titles, subsections |
| **Body** | Geist Sans | `1.0rem` (`16px`) | Regular (400) | 1.50 | Default paragraphs, instructions |
| **Body Small**| Geist Sans | `0.875rem` (`14px`)| Regular (400) | 1.40 | Form labels, helper hints |
| **Caption** | Geist Sans | `0.75rem` (`12px`) | Medium (500) | 1.40 | Timestamps, status badges |
| **Code / ID**| Geist Mono | `0.8125rem` (`13px`)| Medium (500) | 1.40 | Batch IDs (`#d1111111`), codes |

---

## 4. Anti-Slop Quality Floor

1. **No Eyebrow Kickers:** Headlines stand on their own without tiny uppercase labels floating above them.
2. **Elevation Once:** Cards declare either a clean 1px border (`border-line`) or a soft shadow, never thick borders over dark offset halos.
3. **Legitimate Data Only:** Zero invented carbon calculators, fake tax valuations, or mock system uptimes. All metrics compute from real state.
4. **Natural Human Language:** Technical jargon ("Stage Surplus Consignment", "Deterministic Rescue Infrastructure", "Unit #FLT-V92") is strictly replaced with dignified, clear food rescue language.
