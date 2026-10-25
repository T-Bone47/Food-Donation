-- 003_fix_confirm_receipt_ambiguity.sql
-- The RETURNS TABLE output column `donation_id` shadowed the assignments
-- column of the same name, so PL/pgSQL raised "column reference donation_id is
-- ambiguous" on every receipt confirmation. Qualify the table columns.

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
    WHERE donations.id = p_donation_id
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

    SELECT assignments.id INTO v_assignment_id
    FROM assignments
    WHERE assignments.donation_id = p_donation_id
      AND assignments.assignment_status = 'active'
    LIMIT 1;

    IF v_assignment_id IS NULL THEN
        RETURN QUERY SELECT 'no_active_assignment'::TEXT, p_donation_id;
        RETURN;
    END IF;

    UPDATE donations
    SET status = 'COMPLETED', updated_at = NOW()
    WHERE donations.id = p_donation_id;

    UPDATE assignments
    SET assignment_status = 'completed',
        delivered_at = COALESCE(assignments.delivered_at, NOW())
    WHERE assignments.id = v_assignment_id;

    INSERT INTO delivery_confirmations (donation_id, assignment_id, confirmed_by, confirmed_at)
    VALUES (p_donation_id, v_assignment_id, p_ngo_id, NOW());

    RETURN QUERY SELECT 'completed'::TEXT, p_donation_id;
END;
$$;

REVOKE ALL ON FUNCTION confirm_receipt(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION confirm_receipt(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION confirm_receipt(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION confirm_receipt(UUID, UUID) TO service_role;
