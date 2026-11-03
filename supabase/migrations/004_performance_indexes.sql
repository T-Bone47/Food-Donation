-- ============================================================================
-- 004_performance_indexes.sql
-- High-throughput composite and partial indexes for production query patterns
-- ============================================================================

-- 1. Accelerates NGO incoming delivery queries and status filtering
CREATE INDEX IF NOT EXISTS idx_donations_recipient_ngo_status
  ON donations (recipient_ngo_id, status);

-- 2. Accelerates Donor dashboard queries ('/donations/mine') with ordering
CREATE INDEX IF NOT EXISTS idx_donations_donor_status_created
  ON donations (donor_id, status, created_at DESC);

-- 3. Partial index for active volunteer dispatch checks (prevents full scan of historic assignments)
CREATE INDEX IF NOT EXISTS idx_assignments_volunteer_active
  ON assignments (volunteer_id)
  WHERE assignment_status = 'active';

-- 4. Accelerates NGO confirmation lookup for personal impact metrics
CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_confirmed_by
  ON delivery_confirmations (confirmed_by);

-- 5. Accelerates Admin audit log paging and reverse chronological scans
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc
  ON audit_logs (created_at DESC);

-- 6. Accelerates user lookups by role and status for admin user management
CREATE INDEX IF NOT EXISTS idx_users_role_status
  ON users (role, account_status);

