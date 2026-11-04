# Reference to Current Route & Integration Mapping

**Target Application:** FoodShare Platform  
**Reference Source:** `SIH-HACKATHON-lastupdate`  
**Mapping Strategy:** Faithful Visual Reconstruction + Real Backend Wiring  

---

## 1. Master Route Mapping Table

| Reference Route | Target FoodShare Route | Primary Role | Reference Visual Layout | Backend Integration Points |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `/` | Public / Guest | Split card over `signupbg.png` with role choice modal & registration form | `POST /api/v1/auth/signup`, `POST /api/v1/demo/session` |
| `/login` | `/login` | Public / Guest | Glassmorphic floating card over `signupbg.png` with Email & Password | `POST /api/v1/auth/login`, `POST /api/v1/demo/session` |
| `/donordash` | `/donordash` | Donor | Top `Navbar`, Hero banner, Location detector, Donate CTA, Impact counter tiles | `GET /api/v1/impact/summary`, `GET /api/v1/impact/donor`, `GET /api/v1/donations/mine` |
| `/donate` | `/donate` | Donor | White form card, multi-food item selector, servings, GPS button, Map preview | `POST /api/v1/donations` (creates active listing) |
| `/mydonations` | `/mydonations` | Donor | Top `Navbar`, Hero banner, Donation cards with status badges & courier info | `GET /api/v1/donations/mine`, `PATCH /api/v1/donations/:id/cancel` |
| `/volunteerdash`| `/volunteerdash`| Volunteer | Top `volunavbar`, Hero banner, 3-col Nearby Donations card grid, Impact counters, Badges | `GET /api/v1/donations/available`, `POST /api/v1/donations/:id/claim` |
| `/acceptpage` | `/acceptpage` / `/volunteer/tasks` | Volunteer | Top `volunavbar`, Order status stepper (`Accepted` $\rightarrow$ `Picked` $\rightarrow$ `Delivered`), Live map, Handover buttons | `GET /api/v1/donations/:id`, `PATCH /api/v1/donations/:id/pickup`, `PATCH /api/v1/donations/:id/deliver` |
| `/adminpage` | `/adminpage` | Admin | Top `adminnavbar`, Search & status filter, Stats counters, 2-col master-detail donation inspector | `GET /api/v1/admin/overview`, `GET /api/v1/admin/donations`, `GET /api/v1/admin/users`, `GET /api/v1/admin/activity` |
| `/notification`| `/notification` | All Roles | Top `Navbar`, Centered list of notification cards with Dismiss button | `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read` |
| `/profile` | `/profile` | All Roles | Top `Navbar`, Centered profile card with inline edit and save | `GET /api/v1/auth/me`, `PATCH /api/v1/auth/me` |
| *(None in ZIP)*| `/ngodash` | NGO | **Synthesized in reference design language:** Top `ngonavbar`, Hero banner, Receiving Hub, Incoming Deliveries with inspection modal, Intake History | `GET /api/v1/ngos/incoming`, `POST /api/v1/donations/:id/confirm-receipt`, `GET /api/v1/ngos/history` |

---

## 2. Shared Navigation System Mapping

In the reference frontend, navigation is implemented via specialized top navbars:
1. **`Navbar.tsx` (Donor & General):**
   - Brand: **FeedChain** / **FoodShare** (`text-2xl font-bold text-green-700`)
   - Links: Home (`/donordash`), My Donations (`/mydonations`), Notification (`/notification`), Profile (`/profile`)
   - Account Dropdown: Displays user name, role, email, phone, and triggers logout
2. **`volunavbar.tsx` (Volunteer):**
   - Links: Home (`/volunteerdash`), My Service (`/acceptpage`), Notification (`/notification`), Profile (`/profile`)
3. **`adminnavbar.tsx` (Admin):**
   - Links: Home (`/adminpage`), Audit & Users (`/adminpage?tab=users`), Notification (`/notification`), Profile (`/profile`)
4. **`ngonavbar.tsx` (NGO - New):**
   - Built to mirror the reference navbar aesthetic with tabs:
   - Receiving Hub (`/ngodash?tab=hub`), Incoming Deliveries (`/ngodash?tab=incoming`), Received History (`/ngodash?tab=history`), Notification (`/notification`), Profile (`/profile`)

---

## 3. Data Transformation & Adapters

| Entity | Reference Field | Current FoodShare Backend Field | Transformation / Mapping Rule |
| :--- | :--- | :--- | :--- |
| **Donation** | `food_type` or `food` | `title` or `food_category` | Use `title` with fallback to `food_category` |
| | `quantity` or `servings` | `quantity` + `unit` | Format as `${quantity} ${unit || 'servings'}` |
| | `prepared_time` | `prepared_at` | Format via `new Date(prepared_at).toLocaleString()` |
| | `area`, `state`, `pincode` | `area`, `state`, `pincode`, `pickup_address` | Full address with fallbacks |
| | `status` | `status` (`AVAILABLE`, `ASSIGNED`, `PICKED_UP`, `DELIVERED`, `COMPLETED`) | Mapped to reference display values (`Need Volunteer`, `Volunteer Found`, `Picked`, `Delivered`, `Completed`) |
| **User** | `userEmail`, `userId`, `userRole` | `token`, `user` object in `localStorage` | Synchronized bi-directionally so legacy localStorage reads succeed while modern session tokens remain authoritative |

---

## 4. NGO Experience Reconstruction Strategy

To adhere to Non-Negotiable Directive 5.K:
- The NGO dashboard (`/ngodash`) will be reconstructed with the **exact emerald and sage green visual theme** (`min-h-screen bg-green-50`, top `ngonavbar`, `bg-green-100` hero banner, white elevated card grids).
- Retains all operational capabilities:
  - **Receiving Hub:** 4 impact stats cards (Incoming Cargo, Verified Intakes, Total Rescued kg, Partner Couriers).
  - **Incoming Deliveries:** Interactive queue with food safety criteria checklist and confirmation modal.
  - **Received History:** Monospace ledger with verification timestamps and tamper-evident audit records.

