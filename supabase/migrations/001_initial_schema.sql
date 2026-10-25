-- 001_initial_schema.sql
-- Initial database schema for Food Donation Platform
-- Run this in your Supabase SQL editor or via supabase db push

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types
CREATE TYPE user_role AS ENUM ('Donor', 'Volunteer', 'NGO', 'Admin');
CREATE TYPE account_status AS ENUM ('pending', 'active', 'suspended', 'rejected');
CREATE TYPE donation_status AS ENUM ('AVAILABLE', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'EXPIRED');
CREATE TYPE assignment_status AS ENUM ('active', 'completed', 'cancelled', 'released');
CREATE TYPE ngo_verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE notification_channel AS ENUM ('in_app', 'push', 'email', 'sms', 'whatsapp');
CREATE TYPE notification_delivery_status AS ENUM ('pending', 'sent', 'failed', 'read');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    organization TEXT,
    phonenumber TEXT,
    role user_role NOT NULL,
    area TEXT,
    pincode TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    account_status account_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NGO profiles table
CREATE TABLE ngo_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    organization_name TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    address TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    description TEXT,
    documents JSONB,
    verification_status ngo_verification_status NOT NULL DEFAULT 'pending',
    verification_notes TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Donations table
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    food_category TEXT NOT NULL,
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL,
    prepared_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    pickup_deadline TIMESTAMPTZ NOT NULL,
    pickup_address TEXT NOT NULL,
    area TEXT,
    pincode TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    latitude NUMERIC,
    longitude NUMERIC,
    photo_path TEXT,
    status donation_status NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assignments table (volunteer-donation linking)
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    assignment_status assignment_status NOT NULL DEFAULT 'active'
);

-- At most one active assignment per donation and per volunteer.
-- PostgreSQL does not support partial UNIQUE table constraints; use partial
-- unique indexes instead.
CREATE UNIQUE INDEX idx_assignments_one_active_per_donation
    ON assignments (donation_id) WHERE assignment_status = 'active';
CREATE UNIQUE INDEX idx_assignments_one_active_per_volunteer
    ON assignments (volunteer_id) WHERE assignment_status = 'active';

-- Delivery confirmations table
CREATE TABLE delivery_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    confirmed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    evidence_url TEXT,
    discrepancy_notes TEXT,
    UNIQUE (donation_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    channels notification_channel[] NOT NULL DEFAULT ARRAY['in_app']::notification_channel[],
    delivery_status notification_delivery_status NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    sent_at TIMESTAMPTZ,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    request_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_account_status ON users(account_status);

CREATE INDEX idx_ngo_profiles_user_id ON ngo_profiles(user_id);
CREATE INDEX idx_ngo_profiles_verification_status ON ngo_profiles(verification_status);

CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_expires_at ON donations(expires_at);
CREATE INDEX idx_donations_pickup_deadline ON donations(pickup_deadline);
CREATE INDEX idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX idx_donations_location ON donations (pincode, area, state);
CREATE INDEX idx_donations_donor_status ON donations(donor_id, status);

CREATE INDEX idx_assignments_donation_id ON assignments(donation_id);
CREATE INDEX idx_assignments_volunteer_id ON assignments(volunteer_id);
CREATE INDEX idx_assignments_status ON assignments(assignment_status);
CREATE INDEX idx_assignments_donation_status ON assignments(donation_id, assignment_status);

CREATE INDEX idx_delivery_confirmations_donation_id ON delivery_confirmations(donation_id);
CREATE INDEX idx_delivery_confirmations_confirmed_by ON delivery_confirmations(confirmed_by);

CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_recipient_read ON notifications(recipient_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ngo_profiles_updated_at BEFORE UPDATE ON ngo_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- NGO profiles policies
CREATE POLICY "NGO can view own profile" ON ngo_profiles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "NGO can insert own profile" ON ngo_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "NGO can update own profile" ON ngo_profiles
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all NGO profiles" ON ngo_profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
    );
CREATE POLICY "Admins can update NGO profiles" ON ngo_profiles
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
    );

-- Donations policies
CREATE POLICY "Donors can view own donations" ON donations
    FOR SELECT USING (auth.uid() = donor_id);
CREATE POLICY "Donors can insert own donations" ON donations
    FOR INSERT WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "Donors can update own AVAILABLE donations" ON donations
    FOR UPDATE USING (auth.uid() = donor_id AND status = 'AVAILABLE');
CREATE POLICY "Volunteers can view available donations" ON donations
    FOR SELECT USING (status = 'AVAILABLE' AND expires_at > NOW());
CREATE POLICY "Assigned volunteers can view assigned donations" ON donations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignments
            WHERE assignments.donation_id = donations.id
            AND assignments.volunteer_id = auth.uid()
            AND assignments.assignment_status = 'active'
        )
    );
CREATE POLICY "Admins can view all donations" ON donations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
    );
CREATE POLICY "Admins can update all donations" ON donations
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
    );

-- Assignments policies
CREATE POLICY "Volunteers can view own assignments" ON assignments
    FOR SELECT USING (auth.uid() = volunteer_id);
CREATE POLICY "Volunteers can insert own assignments" ON assignments
    FOR INSERT WITH CHECK (auth.uid() = volunteer_id);
CREATE POLICY "Volunteers can update own assignments" ON assignments
    FOR UPDATE USING (auth.uid() = volunteer_id);
CREATE POLICY "Donors can view assignments for their donations" ON assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM donations
            WHERE donations.id = assignments.donation_id
            AND donations.donor_id = auth.uid()
        )
    );
CREATE POLICY "Admins can view all assignments" ON assignments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
    );

-- Delivery confirmations policies
CREATE POLICY "NGOs can insert confirmations for delivered donations" ON delivery_confirmations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            JOIN ngo_profiles np ON np.user_id = u.id
            WHERE u.id = auth.uid()
            AND u.role = 'NGO'
            AND np.verification_status = 'approved'
        )
        AND EXISTS (
            SELECT 1 FROM donations d
            JOIN assignments a ON a.donation_id = d.id
            WHERE d.id = delivery_confirmations.donation_id
            AND d.status = 'DELIVERED'
        )
    );
CREATE POLICY "Admins can view all confirmations" ON delivery_confirmations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Users can update own notifications (mark read)" ON notifications
    FOR UPDATE USING (auth.uid() = recipient_id);

-- Audit logs policies (admin only)
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
    );