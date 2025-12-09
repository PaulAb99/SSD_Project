-- Enable RLS on cultural_nodes if not already enabled
ALTER TABLE cultural_nodes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to cultural nodes" ON cultural_nodes;
DROP POLICY IF EXISTS "Allow admins to insert cultural nodes" ON cultural_nodes;
DROP POLICY IF EXISTS "Allow admins to update cultural nodes" ON cultural_nodes;
DROP POLICY IF EXISTS "Allow admins to delete cultural nodes" ON cultural_nodes;

-- Policy: Everyone can read cultural nodes
CREATE POLICY "Allow public read access to cultural nodes"
ON cultural_nodes
FOR SELECT
TO public
USING (true);

-- Policy: Only admins can insert cultural nodes
CREATE POLICY "Allow admins to insert cultural nodes"
ON cultural_nodes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy: Only admins can update cultural nodes
CREATE POLICY "Allow admins to update cultural nodes"
ON cultural_nodes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy: Only admins can delete cultural nodes
CREATE POLICY "Allow admins to delete cultural nodes"
ON cultural_nodes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);