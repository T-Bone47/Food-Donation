# Unified Food Donation Platform — Design System Master

## Visual Direction: Organic Modern + Editorial Clarity

A premium design language for a food waste reduction platform. Combines warm neutrality, a controlled food-inspired green palette, deep high-contrast typography, and restrained earthy secondary tones. The identity communicates trust, freshness, dignity, responsibility, efficiency, transparency, community impact, and operational reliability.

### Design Philosophy

- **Organic Modern**: Clean, architectural layouts with organic, softened elements. Not minimalist coldness, but warm functionality.
- **Editorial Clarity**: Typography and spacing that make operational data easy to scan. Decisions are time-sensitive; the UI must reduce cognitive load.
- **Purpose-Built**: Every visual choice serves the core workflows: donating, claiming, verifying, administering. Decorative elements are kept to purposeful accents.

### Core Directives

1. **Trust first**: Visuals must communicate reliability. The platform handles real food and real people's needs.
2. **Fresheness signals**: Color and imagery should convey food quality without resorting to generic "green everywhere" cliches.
3. **Dignity in operations**: Donors, volunteers, NGOs and administrators are all performing important work. The UI respects that.
4. **Efficiency over ornament**: Dashboards and forms must move users through tasks quickly. Information hierarchy is essential.
5. **Transparency**: Status, ownership, and lifecycle should be immediately visible. Nothing should be guessable.

### Color System (Semantic Tokens)

| Token | Description | Hex / Variable Reference | Usage |
|-------|-------------|-------------------------|-------|
| `--color-primary` | Primary brand leaf green | `#1d5c3a` (`--leaf-700`) | Primary buttons, active tabs, brand focus ring |
| `--color-primary-hover` | Hover state leaf green | `#154a2e` (`--leaf-800`) | Hover state on primary interactive elements |
| `--color-primary-active` | Active leaf green | `#0f3822` (`--leaf-900`) | Pressed/active state on primary controls |
| `--color-primary-foreground` | White text on primary | `#ffffff` (`--surface`) | Button text on primary buttons |
| `--color-primary-soft` | Subtle leaf background | `#e4f0e7` (`--leaf-50`) | Soft primary badge/panel background |
| `--color-background` | Warm paper page background | `#f3f4ee` (`--paper`) | Main canvas body background |
| `--color-card` | Pure white card surface | `#ffffff` (`--surface`) | Donation cards, modals, form panels |
| `--color-foreground` | Deep charcoal-green ink | `#1b2520` (`--ink`) | High-contrast body and title typography |
| `--color-muted-foreground` | Muted ink text | `#56625a` (`--ink-muted`) | Secondary helper labels, metadata |
| `--color-border` | Subtle line border | `#d9dbcf` (`--line`) | Input borders, separators, card outlines |
| `--color-destructive` | Chili red | `#a8321c` (`--chili-700`) | Form validation errors, destructive actions |
| `--color-accent` | Warm turmeric | `#fbefd0` (`--turmeric-100`) | Attention accents, highlight blocks |
| `--color-status-available-bg` | AVAILABLE status bg | `#e4f0e7` (`--leaf-50`) | Active donation listing chip background |
| `--color-status-assigned-bg` | ASSIGNED status bg | `#e5edf6` (`--slate-50`) | Claimed volunteer assignment chip background |
| `--color-status-picked-up-bg` | PICKED_UP status bg | `#fbefd0` (`--turmeric-100`) | Food transit chip background |
| `--color-status-delivered-bg` | DELIVERED status bg | `#ddf0ef` (`--teal-50`) | Arrived at NGO chip background |
| `--color-status-completed-bg` | COMPLETED status bg | `#1d5c3a` (`--leaf-700`) | Finalized successful delivery chip background |
| `--color-status-cancelled-bg` | CANCELLED status bg | `#ecece7` (`--stone-100`) | Cancelled donation chip background |
| `--color-status-expired-bg` | EXPIRED status bg | `#f8e3dd` (`--chili-50`) | Time-elapsed donation chip background |

### Typography System (See TYPOGRAPHY.md for Full Spec)

| Token | Font | Size | Line Height | Weight | Usage |
|-------|------|------|-------------|--------|-------|
| `font-display` | Outfit | 30-40px | 1.15 | 600-800 | Page titles, hero statements, major headers |
| `font-heading` | Outfit | 20-28px | 1.25 | 600 | Section headings, card titles, modal titles |
| `font-body` | Work Sans | 14-16px | 1.5 | 400/500 | Body text, paragraph text, form labels |
| `font-sm` | Work Sans | 13-14px | 1.4 | 500 | Helper text, captions, action labels |
| `font-meta` | Work Sans | 12-13px | 1.4 | 500 | Muted text, timestamps, inline indicators |
| `font-mono` | ui-monospace | 12-14px | 1.4 | 400 | Numeric data, timestamps, IDs in `<code>` tags |
| `font-weight-light` | Work Sans | — | — | 300 | Secondary text, subtle labels |
| `font-weight-medium` | Work Sans | — | — | 500 | Form labels, interactive text |
| `font-weight-semibold` | Outfit / Work Sans | — | — | 600 | Headings, emphasized text |
| `font-weight-bold` | Outfit | — | — | 700 | Critical labels, page headings |

### Design System Suite Structure

This Master specification is accompanied by specialized system documents:
- `TOKENS.md`: Complete CSS variables, color scale, elevation and radii tokens.
- `TYPOGRAPHY.md`: Detailed typography pairing, measure, and tabular numeral guidelines.
- `COMPONENTS.md`: Comprehensive API and state specifications for UI components.
- `LAYOUTS.md`: 1920×1080 desktop-first grid matrix and shell blueprints.
- `INTERACTIONS.md`: Micro-interactions, transitions, and reduced-motion rules.
- `ACCESSIBILITY.md`: WCAG 2.2 AA compliance standards and verification methods.
- `PAGE_PATTERNS.md`: Standard page patterns and role workflows.

### Spacing Scale

| Token | Size | Usage |
|-------|------|-------|
| `space-0` | 0px | — |
| `space-1` | 4px | Tight spacing |
| `space-2` | 8px | Default spacing between UI elements |
| `space-3` | 12px | Card padding, section inner spacing |
| `space-4` | 16px | Margin between major sections, button padding |
| `space-5` | 20px | Form field grouping, card margins |
| `space-6` | 24px | Page margins, major section spacing |
| `space-7` | 28px | — |
| `space-8` | 32px | Section dividers, wide margins |
| `space-9` | 36px | — |
| `space-10` | 40px | — |

### Grid System

- **12-column grid** for desktop layouts
- **4-column grid** for tablet layouts  
- **2-column grid** for mobile layouts
- **Max width**: `max-w-7xl` (28rem) for desktop, `max-w-full` for mobile
- **Gutters**: `gap-6` (24px) between columns, `gap-4` (16px) for tight layouts
- **Responsive breakpoints**: 
  - `sm`: 640px (mobile)
  - `md`: 768px (tablet)
  - `lg`: 1024px (laptop)
  - `xl`: 1280px (desktop)
  - `2xl`: 1536px (wide desktop)

### Surface & Border Treatment

- **Card background**: `color-card` (white with subtle shadow)
- **Elevated surfaces**: `shadow-sm` / `shadow-md` on cards and panels
- **Borders**: `color-border` (200 series gray), 1px weight
- **Focus ring**: `color-ring` with `outline-offset: 2px`
- **Dividers**: `color-border` with `border-t` or `border-b`
- **Radii**: `rounded-lg` (8px) for cards, `rounded-md` (4px) for inputs, `rounded-full` for avatars/chips

### Iconography

- **Primary icon set**: Lucide React (already installed: `lucide-react`)
- **Icon size**: 20px default, 24px for buttons, 16px for muted contexts
- **Stroke weight**: 2px for most icons
- **No emojis as icons**: Use SVG icons from Lucide for all meaningful controls
- **Accessible names**: All icon-only buttons must have accessible labels (ARIA or text)

### Motion & Interaction

- **Motion principle**: Restrained. Motion should clarify, not decorate.
- **Transition duration**: 150-300ms for most interactions
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` for most transitions
- **Reduced motion**: Respect `prefers-reduced-motion` — reduce or eliminate non-essential motion
- **Interactions**:
  - Button hover: background color shift, subtle scale (101-102%)
  - Input focus: outline with `color-ring`, shadow reduction
  - Dropdown/menu: slide-down with fade, 200ms
  - Modal/dialog: fade-in, scale-up from 95% to 100%
  - Status change: subtle color transition on status chips
  - Loading skeletons: progressive reveal

### Accessibility Requirements (WCAG 2.2 AA)

- **Text contrast**: Minimum 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold)
- **Focus visible**: Clear focus indicators on all interactive elements
- **Keyboard access**: All functionality operable via keyboard alone
- **Touch targets**: Minimum 44px × 44px for tap targets
- **Semantic HTML**: Use native elements whenever possible (`button`, `input`, `select`, `nav`, `header`, `main`, `section`, `article`)
- **ARIA**: Use sparingly — native HTML takes precedence. Only add ARIA when native semantics are insufficient.
- **Error validation**: Programmatic errors with descriptive messages; visual errors with color + text + list of issues
- **Live regions**: Use `role="status"` or `aria-live` for dynamic content updates (form validation, toast notifications)
- **Alt text**: Descriptive alt for informative images; empty `alt=""` for decorative images
- **Color independence**: Never use color alone to communicate meaning. Pair with text, icons, or patterns.

### Responsive Breakpoints & Layout

| Breakpoint | Width | Layout Behavior |
|------------|-------|-----------------|
| `3xx` | 375px | Mobile: single-column, full-width tap targets, stacked navigation |
| `390` | 390px | Mobile: alternative mobile width |
| `768` | 768px | Tablet: two-column layouts where appropriate, refined touch targets |
| `1024` | 1024px | Laptop: full grid, expanded navigation |
| `1440` | 1440px | Desktop: maximum information density, multi-column data tables |
| `Wider` | >1440px | Desktop: increased whitespace, optional side panel on wide screens |

**Never force a desktop layout into mobile**. Redesign hierarchy for small screens.

### Component State Rules

| Component | Default | Hover | Focus | Active | Disabled | Loading |
|-----------|---------|-------|-------|--------|----------|---------|
| **Button** | Background `color-action-primary`, text white | Background `color-action-primary-hover`, slight scale up | Outline `color-ring`, no background change | Slight scale down (99%), pressed state | Background `color-brand-subtle`, disabled cursor, lower opacity | Skeleton loader or spinner inside |
| **Input** | Border `color-border`, shadow `shadow-sm` | Border `color-primary`, shadow `focus` | Border `color-ring`, shadow `focus-ring` | — | Border `color-muted`, cursor not-allowed, lower opacity | — |
| **Select** | Arrow icon, bordered appearance | Expanded height, highlighted option | Focus ring on select element | — | Disabled state, grayed out | — |
| **Card** | Background `color-card`, shadow `shadow-md` | Shadow `shadow-lg`, slight lift | — | Scale down 99% on press | — | — |
| **Status Chip** | Background color from status palette, text `color-on-[status]` | Background darker shade | — | — | — | — |
| **Table Row** | Background `color-card` or alternating `color-muted` | Hover background `color-muted-foreground`/low-opacity | Row focus outline | Row active selection background | — | — |
| **Drawer/Sidebar** | Slide-in from left/right, overlay backdrop | Overlay dimmed, drawer visible | Focus returns to trigger on escape | — | — | — |
| **Dialog/Modal** | Fade-in, scale-up from 95% | — | Focus trap inside dialog | — | — | — |

### Empty States

- **Illustration**: Use purposeful illustration or icon (not generic placeholders)
- **Headline**: Clear statement of what's empty
- **Description**: What caused the empty state and what to do next
- **Action**: Primary CTA for the expected next action
- **Example**: Empty donation dashboard → "No donations yet. Create your first donation to get started."

### Error States

- **Message**: Clear, non-technical language explaining what went wrong
- **Preservation**: Retain user input when safe to do so
- **Action**: Retry button or link where appropriate
- **Recovery**: Explain how to fix or avoid the error
- **Example**: Form validation → "Please enter a valid email address" + field highlight + "Resend verification" link

### Success States

- **Confirmation**: Toast or inline message confirming the action
- **Data update**: Visible reflection of the change (new status, updated count)
- **Next step**: Logical follow-up or dismissal option
- **Example**: Donation submitted → "Donation submitted successfully!" + "View my donations" CTA + 1.5s auto-dismiss with action

---

## Page-Specific Design Specifications

### Donor Dashboard

- **Hero section**: Warm gradient or organic shape accent, not generic stock photo
- **Impact metrics**: Large typography, clear numbers, status breakdown bars
- **Donation cards**: Consistent height, status chip on upper right, "Donate Food" CTA primary action
- **Empty state**: Illustrative empty state with "Create your first donation" primary action
- **Responsive**: Cards stack on mobile, 2-column on tablet, 3-column on desktop

### Volunteer Dashboard

- **Hero section**: Action-oriented, "See nearby donations" primary CTA
- **Donation cards**: Emphasize pickup deadline, quantity, location clarity
- **Task actions**: "Claim This Donation" primary, disabled state clearly communicated
- **Active assignment**: Prominent display of current task, progress indicators
- **Responsive**: Cards adapt; map (if present) responsive; task info remains readable

### NGO Dashboard

- **Hero section**: Organization-focused, "Manage incoming donations" primary action
- **Incoming donations**: Prioritized by urgency/timing, status badges clear
- **Receipt confirmation**: Prominent but not aggressive; clear success/failure feedback
- **Organization metrics**: Impact counts with clear labeling
- **Responsive**: Tables stack; cards become full-width; navigation remains accessible

### Admin Dashboard

- **Hero section**: Platform oversight, activity summary
- **Stats section**: Large numeric metrics, status distribution charts
- **Data tables**: Dense but readable, sortable, with status-color-coded rows
- **Action buttons**: Safe confirmation for destructive operations
- **Responsive**: Tables transform on mobile (vertical scroll, essential columns visible)

---

## Implementation Checklist

### Foundation (completed first)

- [ ] Design system MASTER.md created and documented
- [ ] Tailwind CSS configuration updated with semantic tokens
- [ ] Global CSS variables established for color, typography, spacing
- [ ] Component library audit: which components already exist vs. need creation
- [ ] Accessibility baseline: audit current contrast, focus, semantic HTML

### Component Implementation

- [ ] Button component with all states (default, hover, focus, active, disabled, loading)
- [ ] Input component with label association, focus states, validation styles
- [ ] Status chip component with all status colors and accessible labels
- [ ] Card component with consistent padding, border, radius, shadow
- [ ] Navigation shell: role-aware sidebar/top nav, active state, mobile drawer
- [ ] Form primitives: donation form, edit form, search/filter forms
- [ ] Empty state components for each page type
- [ ] Loading skeletons for structured content areas
- [ ] Error boundary/UI patterns for API errors

### Page Redesign

- [ ] Donor dashboard redesign
- [ ] Donation creation/editing flow
- [ ] Volunteer dashboard redesign
- [ ] Volunteer task assignment flow
- [ ] NGO dashboard redesign
- [ ] NGO verification/completion workflow
- [ ] Admin dashboard redesign
- [ ] Platform management pages
- [ ] Login/register/profile pages (preserve existing auth)
- [ ] Public/landing pages

### Validation

- [ ] Production build passes
- [ ] TypeScript type checking passes
- [ ] ESLint passes (no new errors)
- [ ] Accessibility manual keyboard verification
- [ ] Responsive testing at 375, 768, 1024, 1440px
- [ ] Functional browser tests: donor, volunteer, NGO, admin workflows
- [ ] No regression in existing API behavior
- [ ] All interactive elements keyboard-operable
- [ ] Color contrast meets 4.5:1 minimum
- [ ] Focus indicators visible on all interactive elements

### Documentation

- [ ] `docs/UI_UX_IMPLEMENTATION_REPORT.md` created
- [ ] `docs/UI_UX_VALIDATION_REPORT.md` created
- [ ] Component usage guidelines documented
- [ ] Design token reference documented
- [ ] Accessibility remediation tracked

---

## UI UX Pro Max Resources Used

- **Design system generation**: `python3 .github/prompts/ui-ux-pro-max/scripts/search.py "<query>" --design-system -p "FoodShare"`
- **Color palette**: Extracted from `ui-ux-pro-max/data/colors.csv` and `ui-reasoning.csv`
- **Typography guidance**: From `typography.csv` and font-pairing in design-system output
- **Stack rules**: `html-tailwind.csv` for React/Tailwind-specific patterns
- **UX guidelines**: `ux-guidelines.csv` for interaction and accessibility patterns
- **Product patterns**: `landing.csv` for page structure patterns
- **Motion guidance**: `motion.csv` for appropriate micro-interactions

### Key Design System Decisions Derived

1. **Organic Modern + Editorial Clarity** direction selected over generic "Vibrant & Block-based" — better fits food redistribution trust + operational efficiency
2. **Food-inspired green palette** with warm neutrals instead of purple-themed scheme — communicates freshness without generic startup aesthetics
3. **Inter + JetBrains Mono** typography pairing instead of Playfair Display — more readable for operational data, still editorial enough
4. **Semantic token system** over hardcoded hex values — maintainable, themable, accessible
5. **12-grid with responsive transformation** rather than fixed layouts — supports all required breakpoints
6. **WCAG AA as minimum** with explicit color + text + icon status communication — operational clarity over decorative accessibility

---

## Files Changed (to be tracked)

- `design-system/unified-food-donation/MASTER.md` — New: Design system master document
- `frontend/tailwind.config.ts` — Updated: Semantic color/typography/spacing tokens
- `frontend/src/globals.css` — Updated: CSS variables for design system tokens
- `frontend/src/components/ui/*.tsx` — Updated/created: Foundation components (button, input, card, status chip, empty state, skeleton loader)
- `frontend/src/app/*.tsx` — Updated: All page components with new design system classes
- `docs/UI_UX_CURRENT_STATE_AUDIT.md` — New: Current state analysis
- `docs/UI_UX_IMPLEMENTATION_REPORT.md` — New: Implementation tracking
- `docs/UI_UX_VALIDATION_REPORT.md` — New: Validation results

---

## Quick Reference: Implemented Design Token Mapping (Tailwind CSS v4)

```css
/* Primitives (Palette: Rice paper, Leaf green, Turmeric, Chili, Slate, Teal, Stone) */
--paper: #f3f4ee;
--paper-deep: #e8eae0;
--surface: #ffffff;
--ink: #1b2520;
--ink-soft: #3f4b44;
--ink-muted: #56625a;
--line: #d9dbcf;
--line-strong: #7d8479;

--leaf-50: #e4f0e7;
--leaf-100: #cfe3d5;
--leaf-700: #1d5c3a;
--leaf-800: #154a2e;
--leaf-900: #0f3822;

--turmeric-100: #fbefd0;
--turmeric-300: #e9cf8e;
--turmeric-500: #e7a91b;
--turmeric-800: #6b4600;

--chili-50: #f8e3dd;
--chili-200: #e5b3a8;
--chili-700: #a8321c;
--chili-800: #8a2713;

--slate-50: #e5edf6;
--slate-200: #b7cadf;
--slate-700: #244b73;

--teal-50: #ddf0ef;
--teal-200: #a6d2d0;
--teal-800: #0b5555;

--stone-100: #ecece7;
--stone-200: #cfcfc8;
--stone-700: #4a4f4c;

/* Semantic Tokens */
--color-background: var(--paper);
--color-foreground: var(--ink);
--color-card: var(--surface);
--color-card-foreground: var(--ink);

--color-primary: var(--leaf-700);
--color-primary-hover: var(--leaf-800);
--color-primary-active: var(--leaf-900);
--color-primary-foreground: var(--surface);
--color-primary-soft: var(--leaf-50);
--color-primary-soft-foreground: var(--leaf-800);

--color-secondary: var(--paper-deep);
--color-secondary-foreground: var(--ink);
--color-muted: var(--paper-deep);
--color-muted-foreground: var(--ink-muted);
--color-accent: var(--turmeric-100);
--color-accent-foreground: var(--turmeric-800);

--color-destructive: var(--chili-700);
--color-destructive-hover: var(--chili-800);
--color-destructive-foreground: var(--surface);
--color-destructive-soft: var(--chili-50);

--color-border: var(--line);
--color-line-strong: var(--line-strong);
--color-input: var(--line-strong);
--color-ring: var(--leaf-700);

/* Donation Lifecycle Tokens (Icon + Text + Color - WCAG 2.2 Compliant) */
--color-status-available-bg: var(--leaf-50);
--color-status-available-fg: var(--leaf-800);
--color-status-available-border: var(--leaf-100);

--color-status-assigned-bg: var(--slate-50);
--color-status-assigned-fg: var(--slate-700);
--color-status-assigned-border: var(--slate-200);

--color-status-picked-up-bg: var(--turmeric-100);
--color-status-picked-up-fg: var(--turmeric-800);
--color-status-picked-up-border: var(--turmeric-300);

--color-status-delivered-bg: var(--teal-50);
--color-status-delivered-fg: var(--teal-800);
--color-status-delivered-border: var(--teal-200);

--color-status-completed-bg: var(--leaf-700);
--color-status-completed-fg: var(--surface);
--color-status-completed-border: var(--leaf-700);

--color-status-cancelled-bg: var(--stone-100);
--color-status-cancelled-fg: var(--stone-700);
--color-status-cancelled-border: var(--stone-200);

--color-status-expired-bg: var(--chili-50);
--color-status-expired-fg: var(--chili-800);
--color-status-expired-border: var(--chili-200);

/* Typography */
--font-sans: var(--font-inter, "Inter"), ui-sans-serif, system-ui, sans-serif;
--font-display: var(--font-display-face, var(--font-inter, "Inter")), ui-sans-serif, system-ui, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

/* Layout & Focus Dimensions */
--header-h: 3.5rem;
--bottomnav-h: 3.75rem;
--float-bottom: 1rem;
```