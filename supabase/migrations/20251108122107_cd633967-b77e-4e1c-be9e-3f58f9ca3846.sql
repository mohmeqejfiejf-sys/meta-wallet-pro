-- Add explicit RLS policies for wallets to prevent direct modifications
-- This provides defense-in-depth even though operations go through triggers/functions

-- Explicitly deny direct wallet inserts (must go through handle_new_user trigger)
CREATE POLICY "Prevent direct wallet inserts"
ON wallets FOR INSERT
TO authenticated
WITH CHECK (false);

-- Explicitly deny direct wallet updates (balance changes must go through functions)
CREATE POLICY "Prevent direct wallet updates"
ON wallets FOR UPDATE
TO authenticated
USING (false);

-- Explicitly deny wallet deletions
CREATE POLICY "Prevent wallet deletions"
ON wallets FOR DELETE
TO authenticated
USING (false);

-- Add explicit policy for profiles inserts (must go through trigger)
CREATE POLICY "Prevent direct profile inserts"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (false);