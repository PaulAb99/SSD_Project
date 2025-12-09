-- ========================================
-- 1. Add is_admin column to profiles if missing
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='profiles' AND column_name='is_admin'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END;
$$;

-- ========================================
-- 2. Create location_requests table
-- ========================================
CREATE TABLE IF NOT EXISTS location_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Location Details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    category VARCHAR(100),
    historical_period VARCHAR(100),

    -- Contact Information
    submitter_name VARCHAR(255) NOT NULL,
    submitter_email VARCHAR(255) NOT NULL,
    submitter_phone VARCHAR(50) NOT NULL,

    -- Media URLs
    photos JSONB DEFAULT '[]'::jsonb,
    audio_url TEXT,
    audio_description TEXT,

    -- Request Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. Indexes for location_requests
-- ========================================
CREATE INDEX IF NOT EXISTS idx_location_requests_user_id ON location_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_location_requests_status ON location_requests(status);
CREATE INDEX IF NOT EXISTS idx_location_requests_created_at ON location_requests(created_at DESC);

-- ========================================
-- 4. Enable Row Level Security
-- ========================================
ALTER TABLE location_requests ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. RLS Policies
-- ========================================
DO $$
BEGIN
    -- Users can view their own requests
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename='location_requests' AND policyname='users_view_own_requests'
    ) THEN
        CREATE POLICY users_view_own_requests
        ON location_requests
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    -- Authenticated users can create requests
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename='location_requests' AND policyname='authenticated_create_requests'
    ) THEN
        CREATE POLICY authenticated_create_requests
        ON location_requests
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Users can update their own pending requests
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename='location_requests' AND policyname='users_update_own_pending'
    ) THEN
        CREATE POLICY users_update_own_pending
        ON location_requests
        FOR UPDATE
        USING (auth.uid() = user_id AND status = 'pending');
    END IF;

    -- Admins can view all requests
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename='location_requests' AND policyname='admins_view_all_requests'
    ) THEN
        CREATE POLICY admins_view_all_requests
        ON location_requests
        FOR SELECT
        USING (EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        ));
    END IF;

    -- Admins can update all requests
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename='location_requests' AND policyname='admins_update_all_requests'
    ) THEN
        CREATE POLICY admins_update_all_requests
        ON location_requests
        FOR UPDATE
        USING (EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        ));
    END IF;
END;
$$;

-- ========================================
-- 6. Storage bucket for location request photos
-- ========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('location-requests', 'location-requests', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$
BEGIN
    -- Authenticated users can upload
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename='objects' AND policyname='authenticated_upload_location_requests'
    ) THEN
        CREATE POLICY authenticated_upload_location_requests
        ON storage.objects
        FOR INSERT
        WITH CHECK (
            bucket_id = 'location-requests' AND auth.role() = 'authenticated'
        );
    END IF;

    -- Anyone can view public files
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename='objects' AND policyname='public_view_location_requests'
    ) THEN
        CREATE POLICY public_view_location_requests
        ON storage.objects
        FOR SELECT
        USING (bucket_id = 'location-requests');
    END IF;

    -- Users can delete their own files
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename='objects' AND policyname='users_delete_own_location_requests'
    ) THEN
        CREATE POLICY users_delete_own_location_requests
        ON storage.objects
        FOR DELETE
        USING (
            bucket_id = 'location-requests' AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END;
$$;

-- ========================================
-- 7. Trigger: auto-update updated_at timestamp
-- ========================================
CREATE OR REPLACE FUNCTION update_location_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname='update_location_requests_updated_at'
    ) THEN
        CREATE TRIGGER update_location_requests_updated_at
        BEFORE UPDATE ON location_requests
        FOR EACH ROW
        EXECUTE FUNCTION update_location_request_timestamp();
    END IF;
END;
$$;
