# FoodShare Screen Mapping & Responsive Matrix

**Matrix Version:** 2.0.0  
**Viewports Tested:** Desktop 1920×1080, Laptop 1440×900, Compact 1366×768, Tablet 1024×768, Mobile 390×844.

---

## 1. Role-to-Screen Mapping

| Role | Route | Screen Name | Key Features |
| :--- | :--- | :--- | :--- |
| **Public** | `/` | Public Landing Page | Hero value prop, 5-stage lifecycle visualizer, ecosystem role tabs, interactive demo trigger, registration form. |
| **Public** | `/login` | Authentication Portal | Role-scoped credentials entry, password recovery links, quick demo role selector. |
| **Donor** | `/donordash` | Donor Operations Hub | 4 operational KPI metrics (Active, Completed, Rescued Volume, Impact), active dispatch cards with countdown timers, recent rescue table, food handling checklist. |
| **Donor** | `/donate` | Surplus Creation Wizard | 4-step schema-aligned donation wizard, category visual selector, GPS geolocation lookup, real-time donation summary rail, Good Samaritan Act legal notice. |
| **Donor** | `/mydonations` | Donation Manifests Ledger | Complete historical receipts ledger, status filtering, custody progress view, digital tax receipts. |
| **Volunteer** | `/volunteerdash` | Available Deliveries Hub | Real-time map & list of available surplus donations, pickup deadline urgency badges, one-click claim action, active delivery progress card. |
| **Volunteer** | `/volunteer/tasks` | Assigned Deliveries | Active assigned tasks, turn-by-turn navigation link, pickup confirmation dialog with cargo condition notes, delivery drop-off handover action. |
| **NGO** | `/ngodash` | Community Receiving Hub | Incoming delivery manifest, dock intake confirmation dialog, historical distribution ledger, NGO verification status tracker. |
| **Admin** | `/adminpage` | Governance Center | Administrative operations tabs: Global donation management, NGO verification approvals/rejections, user directory management, system audit logs, manual expiry audit trigger. |
| **All Roles** | `/notification` | Notifications Center | Real-time status notifications, mark-as-read toggles, direct action links to affected donations. |
| **All Roles** | `/profile` | Account & Facility Profile | Contact details, organization affiliation, operating area, pincode, GPS coordinates, password security. |
