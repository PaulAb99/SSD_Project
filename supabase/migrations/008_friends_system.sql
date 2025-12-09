-- Friends System Migration

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create friendships table (bidirectional friendship)
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Create friend requests view for easier querying
CREATE OR REPLACE VIEW friend_requests AS
SELECT 
  f.id,
  f.user_id as requester_id,
  f.friend_id as recipient_id,
  p1.username as requester_username,
  p2.username as recipient_username,
  f.status,
  f.created_at
FROM friendships f
LEFT JOIN profiles p1 ON f.user_id = p1.id
LEFT JOIN profiles p2 ON f.friend_id = p2.id;

-- Create friends list view (only accepted friendships) with discovery count from user_discoveries
CREATE OR REPLACE VIEW friends_list AS
SELECT 
  f.user_id,
  f.friend_id,
  p.username as friend_username,
  COUNT(DISTINCT ud.node_id) as total_discoveries,
  f.created_at as friends_since
FROM friendships f
JOIN profiles p ON f.friend_id = p.id
LEFT JOIN user_discoveries ud ON ud.user_id = p.id
WHERE f.status = 'accepted'
GROUP BY f.user_id, f.friend_id, p.username, f.created_at;

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

-- Grant necessary permissions
GRANT SELECT ON friend_requests TO authenticated;
GRANT SELECT ON friends_list TO authenticated;