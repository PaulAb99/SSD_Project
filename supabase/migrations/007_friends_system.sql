-- Friends System and Activity Feed Migration

-- Create friendships table (bidirectional friendship)
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Create activities table for activity feed
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('discovery', 'achievement', 'review', 'friend_added', 'custom')),
  node_id UUID REFERENCES cultural_nodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for activities
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);

-- Create friend requests view for easier querying
CREATE OR REPLACE VIEW friend_requests AS
SELECT 
  f.id,
  f.user_id as requester_id,
  f.friend_id as recipient_id,
  p1.username as requester_username,
  p1.avatar_url as requester_avatar,
  p2.username as recipient_username,
  p2.avatar_url as recipient_avatar,
  f.status,
  f.created_at
FROM friendships f
LEFT JOIN profiles p1 ON f.user_id = p1.id
LEFT JOIN profiles p2 ON f.friend_id = p2.id;

-- Create friends list view (only accepted friendships)
CREATE OR REPLACE VIEW friends_list AS
SELECT 
  f.user_id,
  f.friend_id,
  p.username as friend_username,
  p.avatar_url as friend_avatar,
  p.total_discoveries,
  p.points,
  f.created_at as friends_since
FROM friendships f
JOIN profiles p ON f.friend_id = p.id
WHERE f.status = 'accepted';

-- RLS Policies for friendships table
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Users can view their own friendships and incoming friend requests
CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update friendships (accept/reject)
CREATE POLICY "Users can update their friendship status"
  ON friendships FOR UPDATE
  USING (auth.uid() = friend_id)
  WITH CHECK (auth.uid() = friend_id);

-- Users can delete their own friendships
CREATE POLICY "Users can delete friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS Policies for activities table
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Users can view public activities and their own activities
CREATE POLICY "Users can view public activities"
  ON activities FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Users can create their own activities
CREATE POLICY "Users can create their own activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own activities
CREATE POLICY "Users can update their own activities"
  ON activities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own activities
CREATE POLICY "Users can delete their own activities"
  ON activities FOR DELETE
  USING (auth.uid() = user_id);

-- Function to get activity feed (user's activities + friends' activities)
CREATE OR REPLACE FUNCTION get_activity_feed(p_user_id UUID, p_limit INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  activity_type TEXT,
  node_id UUID,
  title TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    p.username,
    p.avatar_url,
    a.activity_type,
    a.node_id,
    a.title,
    a.description,
    a.metadata,
    a.created_at
  FROM activities a
  JOIN profiles p ON a.user_id = p.id
  WHERE a.is_public = true
    AND (
      a.user_id = p_user_id OR
      a.user_id IN (
        SELECT friend_id FROM friendships 
        WHERE user_id = p_user_id AND status = 'accepted'
        UNION
        SELECT user_id FROM friendships 
        WHERE friend_id = p_user_id AND status = 'accepted'
      )
    )
  ORDER BY a.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically create friendship from both directions when accepted
CREATE OR REPLACE FUNCTION create_bidirectional_friendship()
RETURNS TRIGGER AS $$
BEGIN
  -- When a friendship is accepted, create reverse relationship if it doesn't exist
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO friendships (user_id, friend_id, status)
    VALUES (NEW.friend_id, NEW.user_id, 'accepted')
    ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bidirectional friendship
DROP TRIGGER IF EXISTS trigger_bidirectional_friendship ON friendships;
CREATE TRIGGER trigger_bidirectional_friendship
  AFTER UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION create_bidirectional_friendship();

-- Function to create activity when user discovers a node
CREATE OR REPLACE FUNCTION create_discovery_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activities (user_id, activity_type, node_id, title, description, metadata)
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

-- Create trigger for discovery activities
DROP TRIGGER IF EXISTS trigger_discovery_activity ON user_nodes;
CREATE TRIGGER trigger_discovery_activity
  AFTER INSERT ON user_nodes
  FOR EACH ROW
  EXECUTE FUNCTION create_discovery_activity();

-- Grant necessary permissions
GRANT SELECT ON friend_requests TO authenticated;
GRANT SELECT ON friends_list TO authenticated;
GRANT EXECUTE ON FUNCTION get_activity_feed TO authenticated;