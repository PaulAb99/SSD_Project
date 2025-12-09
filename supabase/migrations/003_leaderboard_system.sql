-- ========================================
-- 1. Enable extensions
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 2. Profiles Table
-- ========================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add points column if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='points') THEN
        ALTER TABLE profiles ADD COLUMN points INTEGER DEFAULT 0;
    END IF;
END;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points DESC);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Policies for profiles
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename='profiles' AND policyname='public_profiles_viewable'
    ) THEN
        CREATE POLICY public_profiles_viewable
        ON profiles FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename='profiles' AND policyname='users_insert_own_profile'
    ) THEN
        CREATE POLICY users_insert_own_profile
        ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename='profiles' AND policyname='users_update_own_profile'
    ) THEN
        CREATE POLICY users_update_own_profile
        ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END;
$$;

-- ========================================
-- Trigger: updated_at auto-update
-- ========================================
CREATE OR REPLACE FUNCTION update_profiles_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname='trigger_profiles_updated_at'
    ) THEN
        CREATE TRIGGER trigger_profiles_updated_at
        BEFORE UPDATE ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_profiles_updated_at();
    END IF;
END;
$$;

-- ========================================
-- 3. Cultural Nodes Table
-- ========================================
CREATE TABLE IF NOT EXISTS cultural_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    historical_period TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cultural_nodes_title ON cultural_nodes(title);
CREATE INDEX IF NOT EXISTS idx_cultural_nodes_category ON cultural_nodes(category);

ALTER TABLE cultural_nodes ENABLE ROW LEVEL SECURITY;

-- Policies for cultural_nodes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename='cultural_nodes' AND policyname='public_read_cultural_nodes'
    ) THEN
        CREATE POLICY public_read_cultural_nodes
        ON cultural_nodes FOR SELECT USING (true);
    END IF;
END;
$$;

-- ========================================
-- 4. User Discoveries Table
-- ========================================
CREATE TABLE IF NOT EXISTS user_discoveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    node_id UUID REFERENCES cultural_nodes(id) ON DELETE CASCADE,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, node_id)
);

CREATE INDEX IF NOT EXISTS idx_user_discoveries_user_id ON user_discoveries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_discoveries_node_id ON user_discoveries(node_id);

-- ========================================
-- 5. Leaderboard View
-- ========================================
CREATE OR REPLACE VIEW leaderboard AS
SELECT
    p.id,
    p.username,
    p.points,
    COUNT(DISTINCT ud.node_id) AS discoveries_count,
    p.created_at
FROM profiles p
LEFT JOIN user_discoveries ud ON p.id = ud.user_id
GROUP BY p.id, p.username, p.points, p.created_at
ORDER BY p.points DESC, discoveries_count DESC;

GRANT SELECT ON leaderboard TO anon, authenticated;

-- ========================================
-- 6. Increment Points Trigger
-- ========================================
CREATE OR REPLACE FUNCTION increment_user_points() RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET points = points + 10
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname='on_discovery_add_points'
    ) THEN
        CREATE TRIGGER on_discovery_add_points
        AFTER INSERT ON user_discoveries
        FOR EACH ROW
        EXECUTE FUNCTION increment_user_points();
    END IF;
END;
$$;

-- ========================================
-- 7. Discovery Activity Trigger
-- ========================================
CREATE OR REPLACE FUNCTION create_discovery_activity() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activities (
        user_id,
        activity_type,
        node_id,
        title,
        description,
        metadata
    )
    SELECT 
        NEW.user_id,
        'discovery',
        NEW.node_id,
        'Discovered ' || cn.title,
        cn.description,
        jsonb_build_object('category', cn.category, 'historical_period', cn.historical_period)
    FROM cultural_nodes cn
    WHERE cn.id = NEW.node_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname='trigger_discovery_activity'
    ) THEN
        CREATE TRIGGER trigger_discovery_activity
        AFTER INSERT ON user_discoveries
        FOR EACH ROW
        EXECUTE FUNCTION create_discovery_activity();
    END IF;
END;
$$;

-- ========================================
-- 8. Activities Table
-- ========================================
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('discovery','achievement','review','friend_added','custom')),
    node_id UUID REFERENCES cultural_nodes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename='activities' AND policyname='users_view_public_activities'
    ) THEN
        CREATE POLICY users_view_public_activities
        ON activities FOR SELECT USING (is_public = true OR auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename='activities' AND policyname='users_create_own_activities'
    ) THEN
        CREATE POLICY users_create_own_activities
        ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename='activities' AND policyname='users_update_own_activities'
    ) THEN
        CREATE POLICY users_update_own_activities
        ON activities FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename='activities' AND policyname='users_delete_own_activities'
    ) THEN
        CREATE POLICY users_delete_own_activities
        ON activities FOR DELETE USING (auth.uid() = user_id);
    END IF;
END;
$$;
