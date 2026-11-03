"""
Curated knowledge base for FoodShare Unified Food Donation Platform.
Structured into indexed passages with source attribution, categories, and role tags.
"""

KNOWLEDGE_CHUNKS = [
    {
        "id": "kb_mission_overview",
        "title": "Platform Mission & Architecture",
        "source": "docs/SYSTEM_ARCHITECTURE.md",
        "category": "general",
        "roles": ["Donor", "Volunteer", "NGO", "Admin", "Guest"],
        "content": (
            "FoodShare (Unified Food Donation Platform) connects restaurants, caterers, "
            "grocery stores, and individuals with active volunteers and verified NGOs. "
            "The platform reduces food waste by redistributing edible surplus meals to "
            "community kitchens and shelters before expiry. All workflows are managed through "
            "a deterministic 7-state donation lifecycle."
        ),
    },
    {
        "id": "kb_lifecycle_stages",
        "title": "Donation Lifecycle Stages",
        "source": "docs/SYSTEM_ARCHITECTURE.md",
        "category": "lifecycle",
        "roles": ["Donor", "Volunteer", "NGO", "Admin", "Guest"],
        "content": (
            "The canonical donation lifecycle consists of 5 forward stages and 2 terminal states:\n"
            "1. AVAILABLE: Donor has published surplus food with a valid pickup window.\n"
            "2. ASSIGNED: A volunteer has claimed the listing for collection.\n"
            "3. PICKED_UP: The assigned volunteer has physically collected the food from the donor.\n"
            "4. DELIVERED: The volunteer has transported the food to a verified NGO.\n"
            "5. COMPLETED: The receiving NGO has inspected and confirmed receipt.\n"
            "Terminal states:\n"
            "- CANCELLED: Permitted only before physical pickup (while AVAILABLE or ASSIGNED).\n"
            "- EXPIRED: Overdue listings past expiry that were not claimed in time."
        ),
    },
    {
        "id": "kb_donor_listing_guide",
        "title": "How to Create a Food Donation",
        "source": "docs/USER_GUIDE.md",
        "category": "donor",
        "roles": ["Donor", "Admin"],
        "content": (
            "To list food as a Donor:\n"
            "1. Navigate to 'Donate Food' (/donate).\n"
            "2. Enter a descriptive title (max 200 characters) and select a category: "
            "Cooked Meal, Fresh Produce, Non-Perishable, Bakery, Dairy, Snacks, Beverages, or Other.\n"
            "3. Specify quantity and unit (servings, kg, packets, liters, or boxes).\n"
            "4. Specify Preparation Time, Expiry Timestamp, and Pickup Deadline.\n"
            "CRITICAL RULE: The pickup deadline must be in the future and cannot be later than the expiry time.\n"
            "5. Provide the pickup address and optional coordinates. Click 'Publish Donation'."
        ),
    },
    {
        "id": "kb_donor_cancel_edit",
        "title": "Updating and Cancelling Donations",
        "source": "docs/USER_GUIDE.md",
        "category": "donor",
        "roles": ["Donor", "Admin"],
        "content": (
            "Donors can manage their listings from 'My Donations' (/mydonations):\n"
            "- Editing: You can update quantity, title, or notes ONLY while the donation is in AVAILABLE status.\n"
            "- Cancellation: You can cancel a donation while it is AVAILABLE or ASSIGNED (prior to pickup). "
            "If an assigned volunteer was already on their way, they receive an automated cancellation alert.\n"
            "- Pickup Lockout: Once the volunteer confirms pickup (PICKED_UP), the food is in transit and "
            "the donor can no longer cancel."
        ),
    },
    {
        "id": "kb_volunteer_claim_process",
        "title": "Volunteer Claim & Task Management",
        "source": "docs/USER_GUIDE.md",
        "category": "volunteer",
        "roles": ["Volunteer", "Admin"],
        "content": (
            "Volunteers browse nearby listings on the Volunteer Dashboard (/volunteerdash):\n"
            "1. Review available listings: check food type, servings, donor location, and pickup deadline.\n"
            "2. Click 'Claim Pickup'. The platform executes an atomic lock to guarantee no other volunteer "
            "can take the same task.\n"
            "3. Concurrency Limit: Active volunteers are restricted to claiming one active task at a time "
            "to prevent hoarding and ensure timely food transit.\n"
            "4. View active assignments in 'My Tasks' (/volunteer/tasks)."
        ),
    },
    {
        "id": "kb_volunteer_pickup_delivery",
        "title": "Volunteer Pickup and Delivery Handover",
        "source": "docs/USER_GUIDE.md",
        "category": "volunteer",
        "roles": ["Volunteer", "Admin"],
        "content": (
            "Executing a Volunteer Delivery:\n"
            "1. Travel to the donor's address before the pickup deadline.\n"
            "2. Inspect packaging and food condition. Click 'Confirm Pickup' to update status to PICKED_UP.\n"
            "3. Select a destination verified NGO from the approved recipient dropdown.\n"
            "4. Transport food safely to the NGO distribution center.\n"
            "5. Hand over food containers to NGO staff and click 'Record Delivery' to update status to DELIVERED."
        ),
    },
    {
        "id": "kb_ngo_verification",
        "title": "NGO Registration and Verification Workflow",
        "source": "docs/USER_GUIDE.md",
        "category": "ngo",
        "roles": ["NGO", "Admin"],
        "content": (
            "NGO Partner Requirements:\n"
            "1. NGOs register with official organization name, government registration ID, pantry address, "
            "and primary contact details.\n"
            "2. Newly registered NGO accounts remain in 'Pending Review' status.\n"
            "3. A platform administrator reviews the submitted credentials and registration.\n"
            "4. Only APPROVED NGOs appear in the delivery destination dropdown for volunteers, and only "
            "approved NGOs can confirm receipts and receive community meals."
        ),
    },
    {
        "id": "kb_ngo_receipt_confirmation",
        "title": "NGO Receipt and Inspection Confirmation",
        "source": "docs/USER_GUIDE.md",
        "category": "ngo",
        "roles": ["NGO", "Admin"],
        "content": (
            "Confirming Deliveries as an NGO:\n"
            "1. Log in and open the NGO Dashboard (/ngodash).\n"
            "2. View food shipments under 'Incoming Deliveries' (status DELIVERED).\n"
            "3. Inspect arrival temperature, packaging seal, and quantity.\n"
            "4. Click 'Confirm Receipt'. The backend stored procedure confirm_receipt() atomically marks "
            "the donation COMPLETED, completes the assignment, and creates an official delivery confirmation.\n"
            "5. An NGO can ONLY confirm shipments addressed to their own organization ID."
        ),
    },
    {
        "id": "kb_admin_operations",
        "title": "Administrator Console and Monitoring",
        "source": "docs/USER_GUIDE.md",
        "category": "admin",
        "roles": ["Admin"],
        "content": (
            "Platform Administration (/adminpage):\n"
            "- Overview: High-level platform KPIs, pending verification alerts, and system health.\n"
            "- Verifications: Review pending NGO documents with Approve / Reject actions and audit feedback.\n"
            "- User Directory: Search by email/name and filter by role or status. Administrators can suspend "
            "abusive accounts with logged audit reasons.\n"
            "- Safety Guards: Administrators CANNOT suspend themselves, and CANNOT suspend or mutate other admins.\n"
            "- Manual Expiry Override: Admins can manually expire spoiled or reported listings.\n"
            "- Activity Log: Review chronological audit records across all platform events."
        ),
    },
    {
        "id": "kb_food_safety_policy",
        "title": "Food Safety, Storage & Packaging Standards",
        "source": "docs/SECURITY_AND_PRIVACY.md",
        "category": "policy",
        "roles": ["Donor", "Volunteer", "NGO", "Admin", "Guest"],
        "content": (
            "Food Safety Guidelines:\n"
            "- Donors are responsible for ensuring donated food was prepared in a hygienic environment and stored "
            "at safe temperatures (hot meals kept above 60°C, chilled items kept below 4°C).\n"
            "- All food must be packed in clean, food-grade, leak-proof containers.\n"
            "- Leftovers that show signs of spoilage, unhygienic storage, or expired shelf-life must NOT be donated.\n"
            "- Volunteers must transport food directly without unnecessary delays.\n"
            "- Receiving NGOs conduct a visual and temperature inspection on arrival prior to confirmation."
        ),
    },
    {
        "id": "kb_impact_calculation",
        "title": "Impact Metrics & Environmental Reporting",
        "source": "docs/SYSTEM_ARCHITECTURE.md",
        "category": "metrics",
        "roles": ["Donor", "Volunteer", "NGO", "Admin", "Guest"],
        "content": (
            "How Impact is Measured:\n"
            "- Platform impact metrics (meals served, kg rescued, active donors) are calculated STRICTLY from "
            "COMPLETED donations where the receiving NGO has verified receipt.\n"
            "- In-progress (AVAILABLE, ASSIGNED, PICKED_UP, DELIVERED), CANCELLED, and EXPIRED donations are "
            "NEVER credited as delivered impact.\n"
            "- Donors, volunteers, and NGOs can view their verified personal contribution from their respective dashboards."
        ),
    },
    {
        "id": "kb_account_security",
        "title": "Account Security, Passwords & Privacy",
        "source": "docs/SECURITY_AND_PRIVACY.md",
        "category": "security",
        "roles": ["Donor", "Volunteer", "NGO", "Admin", "Guest"],
        "content": (
            "Security and Data Protection:\n"
            "- Passwords are encrypted with bcrypt (12 rounds) and are never retrievable in plaintext.\n"
            "- Authentication uses stateless HMAC-SHA256 session tokens with 24-hour expiry.\n"
            "- On logout, the token is recorded on the server revocation blocklist.\n"
            "- You can update profile details (name, organization, phone, address, pincode) from /profile.\n"
            "- Email address and role cannot be changed via profile update for security and accountability.\n"
            "- Audit records track critical lifecycle transitions without storing personal passwords or tokens."
        ),
    },
    {
        "id": "kb_faq_coverage",
        "title": "Platform Coverage, GPS Tracking & Support",
        "source": "docs/USER_GUIDE.md",
        "category": "faq",
        "roles": ["Donor", "Volunteer", "NGO", "Admin", "Guest"],
        "content": (
            "Frequently Asked Questions:\n"
            "- Location Coverage: FoodShare operates anywhere donors and volunteers register. Volunteers see "
            "donations matching their configured pincode and geographical area.\n"
            "- Real-Time GPS Tracking: The platform currently provides address coordinates and map directions, "
            "but does not run live turn-by-turn vehicle GPS tracking.\n"
            "- Fees: FoodShare is a non-profit community platform; listing, collecting, and receiving food is free.\n"
            "- Support: For account reinstatement or operational emergencies, contact your platform administrator."
        ),
    },
]

