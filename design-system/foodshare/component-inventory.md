# FoodShare Component Inventory & Standards

**Catalog Version:** 2.0.0  
**Framework:** Next.js 15 / React 19 / Tailwind CSS v4 / Radix UI Primitives  

---

## 1. Core Component Directory

### Shell & Navigation
- `AppShell` (`components/shell/AppShell.tsx`): Top-level responsive wrapper enforcing role authorization, desktop/mobile drawer layout, and demo modal triggers.
- `AppSidebar` (`components/shell/AppSidebar.tsx`): Persistent desktop navigation sidebar (18rem / 288px) in Deep Forest Emerald (`#0F5132`) with active route pills, section groupings, role switcher, and user session badge.
- `AppHeader` (`components/shell/AppHeader.tsx`): Responsive top header with dynamic breadcrumbs, global search bar (`⌘K`), network liveness badge, AI Assistant drawer trigger, notification bell, and user avatar.

### Form & Input Controls
- `Input` (`components/ui/input.tsx`): Standard `h-11` text input with rounded-lg border, focus ring (`ring-leaf-700`), and accessible placeholder styling.
- `Textarea` (`components/ui/input.tsx`): Multi-line expandable text area with consistent border and padding.
- `Field` (`components/ui/field.tsx`): Integrated form label, required asterisk, inline validation error message, and helper hint container.
- `Button` (`components/ui/button.tsx`): CVA-styled button supporting `default`, `outline`, `ghost`, and `destructive` variants across `sm`, `md`, and `lg` sizes.
- `PasswordInput` (`components/ui/password-input.tsx`): Secure password field with reveal/hide toggle and keyboard accessibility.

### Feedback & Status Displays
- `StatusBadge` (`components/ui/status-badge.tsx`): Semantic lifecycle indicator mapping `AVAILABLE`, `ASSIGNED`, `PICKED_UP`, `DELIVERED`, `COMPLETED`, `CANCELLED`, and `EXPIRED` to approved color tokens with subtle status dots.
- `InlineAlert` (`components/ui/states.tsx`): Contextual message banner with `error`, `warning`, `info`, and `success` tones.
- `Skeleton` (`components/ui/states.tsx`): Layout-preserving pulsing skeleton loaders matching card and table geometries.
- `ErrorState` (`components/ui/states.tsx`): Resilient error display with retry callback and friendly user guidance.
- `Journey` (`components/ui/journey.tsx`): Horizontal stepper tracking the 5-stage donation custody timeline from creation to NGO receipt.

### Modals, Drawers & Overlays
- `DemoRoleSelectorModal` (`components/demo/DemoRoleSelectorModal.tsx`): Quick role switcher modal for live testing as Donor, Volunteer, NGO, or Admin without logging out.
- `Chatbot` (`components/Chatbot.tsx`): Slide-over drawer connecting to the Gemini 2.5 Flash chatbot microservice on port 5002.
- `Toast` (`components/ui/toast.tsx`): Non-intrusive feedback toasts for copy actions, confirmation receipts, and status changes.
