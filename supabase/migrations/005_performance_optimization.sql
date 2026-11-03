-- ============================================================================
-- 005_performance_optimization.sql
-- High-throughput composite and partial indexes for production query patterns
-- ============================================================================

-- 1. Accelerates notification badge and unread lookup for all users
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON notifications (recipient_id, created_at DESC)
  WHERE read = FALSE;

-- 2. Partial index for background and on-demand expiry audit sweeper
CREATE INDEX IF NOT EXISTS idx_donations_expiring_sweeper
  ON donations (pickup_deadline)
  WHERE status IN ('AVAILABLE', 'ASSIGNED');

-- 3. Composite partial index for volunteer fleet discovery by geographic zone
CREATE INDEX IF NOT EXISTS idx_donations_discovery_composite
  ON donations (status, donor_pincode, pickup_deadline)
  WHERE status = 'AVAILABLE';

-- 4. Accelerates volunteer task history queries and impact calculations
CREATE INDEX IF NOT EXISTS idx_assignments_volunteer_history
  ON assignments (volunteer_id, created_at DESC);

-- 5. Partial index for active donor dispatch pipeline queries
CREATE INDEX IF NOT EXISTS idx_donations_donor_active
  ON donations (donor_id, updated_at DESC)
  WHERE status IN ('AVAILABLE', 'ASSIGNED', 'PICKED_UP', 'DELIVERED');

