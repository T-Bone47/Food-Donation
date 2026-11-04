# FoodShare Screen-to-Route Mapping & Functional Binding

**Purpose:** Connect every Stitch redesign screen directly to real Next.js App Router paths and API endpoints.

---

## 1. Complete Screen Mapping Matrix

| Stitch Screen Export | Existing App Route | Role | Real Backend Endpoints Connected | Key UI Enhancements |
|:---|:---:|:---:|:---|:---|
| `foodshare_public_landing_page/` | `/` | Public | None (Static/Public), Auth APIs (`/api/v1/auth/signup`, `/api/v1/demo/session`) | Network telemetry ticker, 5-stage custody pipeline, role access cards |
| `admin_operations_command_center/` | `/adminpage` (Tab: Overview, Donations, Verifications) | Admin | `GET /admin/donations`, `GET /admin/verifications`, `GET /admin/impact`, `POST /admin/process-expired` | Immediate attention alert banner, 4 administrative KPIs, live dispatch feed |
| `user_organization_administration/` | `/adminpage` (Tab: Users) | Admin | `GET /admin/users`, `PATCH /admin/users/:id`, `GET /admin/audit-logs` | Filter toolbar (role, status, search), user details drawer, account toggle confirmation |
| `donor_operational_dashboard/` | `/donordash` | Donor | `GET /donations/mine`, `GET /impact/me`, `GET /impact/donor` | Staged active batches, pickup windows, recurring surplus schedules, connected NGOs |
| `donor_donation_creation_wizard_schema_aligned/` | `/donate` | Donor | `POST /donations` | 4-step wizard: Item Details, Quantity & Storage, Pickup Window & Location, Good Samaritan review |
| `volunteer_fleet_discovery_dashboard/` | `/volunteerdash` & `/volunteer/tasks` | Volunteer | `GET /donations/available`, `POST /donations/:id/claim`, `POST /donations/:id/pickup`, `POST /donations/:id/deliver` | High-priority active mission card, step-by-step handover actions, nearby discovery feed |
| `ngo_operations_receipt_inspection_dashboard/` | `/ngodash` | NGO | `GET /ngos/incoming`, `POST /donations/:id/confirm-receipt`, `GET /ngos/history`, `GET /impact/me` | Inbound dock inspection drawer, condition checks (temp, weight, seals), dual confirmation |
| N/A (Integrated Auth) | `/login` | Public | `POST /auth/login`, `POST /demo/session` | Clean split auth form, instant demo role picker, password recovery |

---

## 2. Wizard Comparison & Decision

We evaluated both Stitch donor creation exports:
1. `donor_surplus_creation_wizard/` — Relied on generic and unsupported properties.
2. `donor_donation_creation_wizard_schema_aligned/` — Explicitly maps to the real Supabase schema:
   - `food_name` / `title`
   - `food_category` (Produce, Prepared Food, Dairy, Bakery, Meat/Poultry, Ambient/Pantry, Frozen)
   - `quantity` and `unit` (kg, lbs, servings, crates, boxes, pallets)
   - `expiry_time` / `best_by_datetime`
   - `pickup_location` / `pickup_address` / `pincode`
   - `pickup_deadline`
   - `notes` (Staging bay notes, refrigeration instructions)

**Decision:** We select `donor_donation_creation_wizard_schema_aligned` as the functional and visual baseline for `/donate`.

