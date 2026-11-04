# FoodShare Component Inventory & Migration Matrix

**Design System:** Premium Sustainable Logistics  
**Source:** Google Stitch Redesign Platform Exports  
**Target Architecture:** Next.js 15 / React 19 UI Library  

---

## 1. Atomic & Utility UI Components

| Component | File Path | Status | Key Features |
|:---|:---|:---:|:---|
| `StatusBadge` | `src/components/ui/status-badge.tsx` | Enhanced | Monospace uppercase tag, 6px semantic pulse dot, 7 lifecycle states |
| `Button` | `src/components/ui/button.tsx` | Reusable | Primary Forest Emerald (`#0F5132`), Secondary, Destructive, Compact 32px |
| `Card` | `src/components/ui/card.tsx` | Reusable | Layer 1 flat white, 1px `#E2E8F0` border, 8px radius |
| `MetricCard` | `src/components/ui/metric-card.tsx` | Integrated | Tabular numbers, comparative delta pills (`+18.4%`), domain vector icons |
| `ConfirmDialog` | `src/components/ui/confirm-dialog.tsx` | Reusable | Radix-based accessible modal, backdrop blur, focus trap |
| `Tabs` | `src/components/ui/tabs.tsx` | Reusable | Segmented pill container, active state indicator |
| `Input` / `Field` | `src/components/ui/field.tsx` | Reusable | 36px base height, `#0F172A` text, 2px focus ring in `#10B981` |
| `Toast` | `src/components/ui/toast.tsx` | Reusable | Non-intrusive feedback notifications |

---

## 2. Shared Application Shell Components

| Component | File Path | Role | Stitch Reference |
|:---|:---|:---:|:---|
| `AppSidebar` | `src/components/shell/AppSidebar.tsx` | Global Shell | 280px left command sidebar, role-specific nav groups, context role badge |
| `AppHeader` | `src/components/shell/AppHeader.tsx` | Global Shell | Breadcrumbs, ⌘K search bar, system uptime status, AI drawer toggle, profile |
| `AppShell` | `src/components/shell/AppShell.tsx` | Layout Engine | Decoupled grid layout `grid-cols-[280px_1fr]`, zero layout shift |
| `AppNav` | `src/components/shell/AppNav.tsx` | Mobile Navigation | Bottom navigation bar on viewports < 768px |
| `Chatbot` | `src/components/Chatbot.tsx` | Logistics AI | Slide-over assistant drawer, role-aware suggestions, grounded citations |

---

## 3. Operational Domain Modules

| Domain Module | Path | Target Roles | Integration Source |
|:---|:---|:---:|:---|
| `OverviewPanel` | `src/components/admin/OverviewPanel.tsx` | Admin | `admin_operations_command_center` |
| `UsersPanel` | `src/components/admin/UsersPanel.tsx` | Admin | `user_organization_administration` |
| `DonationsPanel` | `src/components/admin/DonationsPanel.tsx` | Admin | `admin_operations_command_center` |
| `VerificationsPanel` | `src/components/admin/VerificationsPanel.tsx` | Admin | `admin_operations_command_center` |
| `ActivityPanel` | `src/components/admin/ActivityPanel.tsx` | Admin | `admin_operations_command_center` |
| `DonorDashboard` | `src/app/donordash/page.tsx` | Donor | `donor_operational_dashboard` |
| `DonationWizard` | `src/app/donate/page.tsx` | Donor | `donor_donation_creation_wizard_schema_aligned` |
| `VolunteerDiscovery` | `src/app/volunteerdash/page.tsx` | Volunteer | `volunteer_fleet_discovery_dashboard` |
| `NgoInspection` | `src/app/ngodash/page.tsx` | NGO | `ngo_operations_receipt_inspection_dashboard` |
| `LandingPage` | `src/app/page.tsx` | Public | `foodshare_public_landing_page` |

