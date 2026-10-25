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

| Token | Description | Usage |
|-------|-------------|-------|
| `color-brand-primary` | Primary brand color | Primary buttons, links, interactive elements |
| `color-brand-primary-hover` | Hover state | Hover states on interactive elements |
| `color-brand-foreground` | Text on primary | White text on primary buttons |
| `color-brand-subtle` | Subtle primary accent | Disabled states, inactive elements |
| `color-surface` | Page background | Body background |
| `color-card` | Card backgrounds | Donation cards, modals, panels |
| `color-card-foreground` | Text on cards | Primary text within cards |
| `color-muted` | Muted elements | Placeholder text, secondary labels |
| `color-muted-foreground` | Muted text foreground | Secondary text, helper text |
| `color-border` | Border elements | Input borders, table separators, dividers |
| `color-border-focus` | Focus ring border | Focus states on interactive elements |
| `color-success` | Success state | Completed donations, positive confirmation |
| `color-warning` | Warning state | Expiry warnings, overdue actions |
| `color-error` | Error state | Form validation errors, critical alerts |
| `color-info` | Informational state | Status labels, informative text |
| `color-action-primary` | Primary action buttons | Donate, Claim, Submit buttons |
| `color-action-secondary` | Secondary actions | Outline buttons, less prominent actions |
| `color-status-available` | AVAILABLE status | Donation cards, lists |
| `color-status-assigned` | ASSIGNED status | Assigned donations, volunteer tasks |
| `color-status-picked-up` | PICKED_UP status | Pickup confirmed |
| `color-status-delivered` | DELIVERED status | Delivery confirmation |
| `color-status-completed` | COMPLETED status | Finalized donations |
| `color-status-cancelled` | CANCELLED status | Cancelled donations |
| `color-status-expired` | EXPIRED status | Expired donations |

### Typography System

| Token | Font | Size | Line Height | Weight | Usage |
|-------|------|------|-------------|--------|-------|
| `font-display` | Inter | 36-48px | 1.1 | 700 | Page headings, major section titles |
| `font-heading` | Inter | 20-28px | 1.3 | 600 | Section headings, card titles |
| `font-body` | Inter | 14-16px | 1.5 | 400/500 | Body text, paragraph text |
| `font-sm` | Inter | 12-13px | 1.4 | 500 | Helper text, captions, small labels |
| `font-xs` | Inter | 11-12px | 1.4 | 500 | Muted text, inline indicators |
| `font-mono` | JetBrains Mono | 12-14px | 1.4 | 400 | Numeric data, timestamps, IDs |
| `font-weight-light` | Inter | — | — | 300 | Secondary text, subtle labels |
| `font-weight-medium` | Inter | — | — | 500 | Form labels, interactive text |
| `font-weight-semibold` | Inter | — | — | 600 | Headings, emphasized text |
| `font-weight-bold` | Inter | — | — | 700 | Page headings, critical labels |

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

## Quick Reference: Design Token Mapping (Tailwind)

```css
/* Colors */
--color-brand-primary: #4F46E5; /* Purple adjusted for food context */
--color-brand-primary-hover: #4F46E5;
--color-brand-foreground: #FFFFFF;
--color-brand-subtle: #E4E6F1;
--color-surface: #F8FAFC;
--color-card: #FFFFFF;
--color-card-foreground: #1E293B;
--color-muted: #94A3B8;
--color-muted-foreground: #64748B;
--color-border: #E2E8F0;
--color-border-focus: #4F46E5;
--color-success: #10B981;
--color-warning: #F59E0B;
--color-error: #EF4444;
--color-info: #6366F1;
--color-action-primary: #4F46E5;
--color-action-secondary: #6B7280;

/* Typography */
--font-display: 'Inter', sans-serif;
--font-heading: 'Inter', sans-serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Spacing */
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */

/* Breakpoints */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```