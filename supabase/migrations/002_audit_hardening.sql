-- 002_audit_hardening.sql
-- Hardening added during the functional/security audit.
--
-- Safe to apply to an existing database created from the corrected
-- 001_initial_schema.sql. No data is deleted.

-- ---------------------------------------------------------------------------
-- 1. Donation recipient NGO
-- ---------------------------------------------------------------------------
-- Deliveries must be addressed to one approved NGO. Without this link any
-- approved NGO could confirm any delivered donation.
ALTER TABLE donations
    ADD COLUMN recipient_ngo_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_donations_recipient_ngo_id ON donations (recipient_ngo_id);

-- ---------------------------------------------------------------------------
-- 2. Data integrity constraints
-- ---------------------------------------------------------------------------
-- Food cannot be picked up after it expires. 0001 originally allowed the
-- opposite ordering; this restores the safe domain meaning.
ALTER TABLE donations
    ADD CONSTRAINT donations_pickup_before_expiry
    CHECK (pickup_deadline <= expires_at);

ALTER TABLE donations
    ADD CONSTRAINT donations_coordinates_check
    CHECK (
        (latitude IS NULL OR (latitude >= -90 AND latitude <= 90))
        AND (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
    );

ALTER TABLE donations
    ADD CONSTRAINT donations_title_length
    CHECK (char_length(title) BETWEEN 1 AND 200);

ALTER TABLE donations
    ADD CONSTRAINT donations_description_length
    CHECK (description IS NULL OR char_length(description) <= 2000);

ALTER TABLE donations
    ADD CONSTRAINT donations_pickup_address_length
    CHECK (char_length(pickup_address) BETWEEN 1 AND 500);

ALTER TABLE donations
    ADD CONSTRAINT donations_quantity_max
    CHECK (quantity <= 1000000);

ALTER TABLE users
    ADD CONSTRAINT users_name_length
    CHECK (char_length(name) BETWEEN 1 AND 150);

ALTER TABLE users
    ADD CONSTRAINT users_phone_length
    CHECK (phonenumber IS NULL OR char_length(phonenumber) <= 30);

ALTER TABLE ngo_profiles
    ADD CONSTRAINT ngo_organization_name_length
    CHECK (char_length(organization_name) BETWEEN 1 AND 200);

-- ---------------------------------------------------------------------------
-- 3. Lifecycle enforcement at the database layer
-- ---------------------------------------------------------------------------
-- The API already validates transitions; this trigger protects the data from
-- direct writes, admin scripts and future endpoints that forget the rules.
CREATE OR REPLACE FUNCTION enforce_donation_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        IF NOT (
            (OLD.status = 'AVAILABLE' AND NEW.status IN ('ASSIGNED', 'CANCELLED', 'EXPIRED'))
            OR (OLD.status = 'ASSIGNED' AND NEW.status IN ('PICKED_UP', 'CANCELLED'))
            OR (OLD.status = 'PICKED_UP' AND NEW.status = 'DELIVERED')
            OR (OLD.status = 'DELIVERED' AND NEW.status = 'COMPLETED')
        ) THEN
            RAISE EXCEPTION 'Invalid donation status transition from % to %',
                OLD.status, NEW.status
                USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_donation_status_transition_trigger ON donations;
CREATE TRIGGER enforce_donation_status_transition_trigger
    BEFORE UPDATE OF status ON donations
    FOR EACH ROW EXECUTE FUNCTION enforce_donation_status_transition();

-- ---------------------------------------------------------------------------
-- 4. Atomic volunteer claim
-- ---------------------------------------------------------------------------
-- A claim must update the donation and create the assignment in one
-- transaction. The row lock makes concurrent claims serialize: exactly one
-- volunteer can win and the loser receives a deterministic result code.
CREATE OR REPLACE FUNCTION claim_donation(
    p_donation_id UUID,
    p_volunteer_id UUID
)
RETURNS TABLE (result_code TEXT, donation_id UUID, assignment_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_donation donations%ROWTYPE;
    v_assignment_id UUID;
BEGIN
    SELECT * INTO v_donation
    FROM donations
    WHERE id = p_donation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT 'not_found'::TEXT, p_donation_id, NULL::UUID;
        RETURN;
    END IF;

    IF v_donation.status <> 'AVAILABLE' THEN
        RETURN QUERY SELECT 'unavailable'::TEXT, p_donation_id, NULL::UUID;
        RETURN;
    END IF;

    IF v_donation.expires_at <= NOW() THEN
        UPDATE donations
        SET status = 'EXPIRED', updated_at = NOW()
        WHERE id = p_donation_id;

        RETURN QUERY SELECT 'expired'::TEXT, p_donation_id, NULL::UUID;
        RETURN;
    END IF;

    IF v_donation.pickup_deadline <= NOW() THEN
        RETURN QUERY SELECT 'pickup_deadline_passed'::TEXT, p_donation_id, NULL::UUID;
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1 FROM assignments
        WHERE volunteer_id = p_volunteer_id
          AND assignment_status = 'active'
    ) THEN
        RETURN QUERY SELECT 'volunteer_busy'::TEXT, p_donation_id, NULL::UUID;
        RETURN;
    END IF;

    UPDATE donations
    SET status = 'ASSIGNED', updated_at = NOW()
    WHERE id = p_donation_id;

    INSERT INTO assignments (donation_id, volunteer_id, assigned_at, assignment_status)
    VALUES (p_donation_id, p_volunteer_id, NOW(), 'active')
    RETURNING id INTO v_assignment_id;

    RETURN QUERY SELECT 'claimed'::TEXT, p_donation_id, v_assignment_id;
END;
$$;

-- Business functions are server-side only. The browser never receives the
-- service-role key, and anon/authenticated must not be able to claim donations
-- directly through the Data API.
REVOKE ALL ON FUNCTION claim_donation(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION claim_donation(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION claim_donation(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION claim_donation(UUID, UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Atomic NGO receipt confirmation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION confirm_receipt(
    p_donation_id UUID,
    p_ngo_id UUID
)
RETURNS TABLE (result_code TEXT, donation_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_donation donations%ROWTYPE;
    v_assignment_id UUID;
BEGIN
    SELECT * INTO v_donation
    FROM donations
    WHERE id = p_donation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT 'not_found'::TEXT, p_donation_id;
        RETURN;
    END IF;

    IF v_donation.status <> 'DELIVERED' THEN
        RETURN QUERY SELECT 'invalid_status'::TEXT, p_donation_id;
        RETURN;
    END IF;

    IF v_donation.recipient_ngo_id IS NULL
       OR v_donation.recipient_ngo_id <> p_ngo_id THEN
        RETURN QUERY SELECT 'not_recipient'::TEXT, p_donation_id;
        RETURN;
    END IF;

    SELECT id INTO v_assignment_id
    FROM assignments
    WHERE donation_id = p_donation_id
      AND assignment_status = 'active'
    LIMIT 1;

    IF v_assignment_id IS NULL THEN
        RETURN QUERY SELECT 'no_active_assignment'::TEXT, p_donation_id;
        RETURN;
    END IF;

    UPDATE donations
    SET status = 'COMPLETED', updated_at = NOW()
    WHERE id = p_donation_id;

    UPDATE assignments
    SET assignment_status = 'completed',
        delivered_at = COALESCE(delivered_at, NOW())
    WHERE id = v_assignment_id;

    INSERT INTO delivery_confirmations (donation_id, assignment_id, confirmed_by, confirmed_at)
    VALUES (p_donation_id, v_assignment_id, p_ngo_id, NOW());

    RETURN QUERY SELECT 'completed'::TEXT, p_donation_id;
END;
$$;

REVOKE ALL ON FUNCTION confirm_receipt(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION confirm_receipt(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION confirm_receipt(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION confirm_receipt(UUID, UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- 6. Corrected RLS policies (defence in depth; the API uses service_role)
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER avoids recursive RLS evaluation when a policy on `users`
-- needs to know whether the current user is an admin.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin'
    );
$$;

REVOKE ALL ON FUNCTION is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "NGOs can insert confirmations for delivered donations" ON delivery_confirmations;
CREATE POLICY "NGOs can insert confirmations for their own delivered donations" ON delivery_confirmations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            JOIN ngo_profiles np ON np.user_id = u.id
            WHERE u.id = auth.uid()
              AND u.role = 'NGO'
              AND u.account_status = 'active'
              AND np.verification_status = 'approved'
        )
        AND EXISTS (
            SELECT 1 FROM donations d
            WHERE d.id = delivery_confirmations.donation_id
              AND d.status = 'DELIVERED'
              AND d.recipient_ngo_id = auth.uid()
        )
    );

CREATE POLICY "NGOs can view their own confirmations" ON delivery_confirmations
    FOR SELECT USING (confirmed_by = auth.uid());

CREATE POLICY "Recipient NGOs can view their deliveries" ON donations
    FOR SELECT USING (recipient_ngo_id = auth.uid());

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (is_admin());
