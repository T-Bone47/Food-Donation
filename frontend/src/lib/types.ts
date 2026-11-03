/** Shapes returned by /api/v1 (after the client unwraps `{ data, meta }`). Derived from backend/services and routes. */

export type UserRole = "Donor" | "Volunteer" | "NGO" | "Admin";

export const DONATION_STATUSES = [
  "AVAILABLE",
  "ASSIGNED",
  "PICKED_UP",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export interface Donation {
  id: string;
  donor_id: string;
  title: string;
  description: string | null;
  food_category: string;
  quantity: number;
  unit: string;
  prepared_at: string | null;
  expires_at: string;
  pickup_deadline: string;
  pickup_address: string;
  area: string | null;
  pincode: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  photo_path: string | null;
  status: DonationStatus;
  recipient_ngo_id: string | null;
  created_at: string;
  updated_at: string;
}

export type AssignmentStatus = "active" | "completed" | "cancelled" | "released";

export interface Assignment {
  id: string;
  donation_id: string;
  volunteer_id: string;
  assigned_at: string;
  picked_up_at: string | null;
  delivered_at: string | null;
  assignment_status: AssignmentStatus;
}

/** GET /volunteer/tasks: assignment rows with the donation joined in. */
export interface VolunteerTask extends Assignment {
  donations: Donation | null;
}

export interface VolunteerDashboardStats {
  totalPickups: number;
  /** Sum across mixed units: not meaningful to display. Use PersonalImpact.byUnit. */
  totalQuantity: number;
  activeAssignment: { donationId: string; pickedUp: boolean; delivered: boolean } | null;
}

export interface PersonalImpact {
  totalCompletedDonations: number;
  totalQuantity: number;
  byUnit: Record<string, number>;
  byCategory: Record<string, number>;
}

export interface AggregateImpact extends PersonalImpact {
  activeDonors: number;
  activeVolunteers: number;
  approvedNGOs: number;
  timeSeries: { period: string; count: number; quantity: number }[];
}

export type VerificationStatus = "pending" | "approved" | "rejected";

export interface NgoProfile {
  id: string;
  user_id: string;
  organization_name: string;
  registration_number: string;
  address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  description: string | null;
  verification_status: VerificationStatus;
  verification_notes: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Admin list: ngo_profiles joined with the owning user. */
export interface NgoVerificationRequest extends NgoProfile {
  users: { id: string; name: string; email: string; created_at: string } | null;
}

/** GET /ngos/approved. `user_id` (not `id`) is what POST /donations/:id/deliver expects as ngo_id. */
export interface ApprovedNgo {
  id: string;
  user_id: string;
  organization_name: string;
  address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
}

export interface DeliveryConfirmation {
  id: string;
  confirmed_at: string;
  confirmed_by?: string;
}

/** GET /ngos/incoming: only DELIVERED donations addressed to this NGO that are not yet confirmed. */
export interface IncomingDelivery extends Donation {
  assignments: { id: string; volunteer_id: string; delivered_at: string | null }[];
  delivery_confirmations: DeliveryConfirmation[];
}

/** GET /ngos/history: COMPLETED donations addressed to this NGO. */
export interface NgoHistoryItem extends Donation {
  delivery_confirmations: DeliveryConfirmation[];
}

export interface AdminDonationRow extends Donation {
  users: { id: string; name: string; email: string } | null;
}

type PersonRef = { id: string; name: string; email: string } | null;

/** GET /admin/donations/:id: the only endpoint that includes assignments and confirmations. */
export interface AdminDonationDetail extends Donation {
  users: PersonRef;
  assignments: (Assignment & { users: PersonRef })[];
  delivery_confirmations: (DeliveryConfirmation & { users: PersonRef })[];
}

/** GET /impact/donor: counts are exact; completedQuantity sums across units, so show PersonalImpact.byUnit instead. */
export interface DonorStats {
  totalDonations: number;
  byStatus: Partial<Record<DonationStatus, number>>;
  completedQuantity: number;
  /** Listings still AVAILABLE (not claimed yet). */
  activeDonations: number;
  completedDonations: number;
}

/** The user object returned by login and signup (also what the app keeps in localStorage). */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string | null;
  phonenumber?: string | null;
  isDemo?: boolean;
}

export interface DemoIdentity {
  role: "donor" | "volunteer" | "ngo" | "admin";
  title: string;
  displayName: string;
  roleEnum: UserRole;
  description: string;
  icon: string;
  organization: string;
  startUrl: string;
}

/** GET/PATCH /auth/me */
export interface ProfileUser extends AuthUser {
  area?: string | null;
  pincode?: string | null;
  state?: string | null;
  country?: string | null;
  accountStatus?: string;
  createdAt?: string;
}

export interface AppNotification {
  id: string;
  event_type: string;
  title: string;
  message: string;
  data: { donationId?: string; assignmentId?: string } | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export type AccountStatus = "active" | "suspended" | "rejected";

/** GET /admin/users. The API also returns phone and address; the UI deliberately never reads them. */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string | null;
  account_status: AccountStatus;
  created_at: string;
}

/** GET /admin/audit-logs. Only two actions are ever written: donation.expired and user.status_changed. */
export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  reason: string | null;
  created_at: string;
}

export interface RealtimeEvent<T = unknown> {
  eventId: string;
  type: string;
  timestamp: string;
  actorId?: string;
  entityId?: string;
  isDemo?: boolean;
  data: T;
}

