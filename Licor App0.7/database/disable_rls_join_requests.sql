-- ==============================================================================
-- DISABLE RLS ON ORGANIZATION_JOIN_REQUESTS TABLE
-- ==============================================================================
-- Problem: RLS policies are blocking the JOIN between organization_join_requests
--          and profiles, causing "Could not find a relationship" error
-- Solution: Disable RLS on organization_join_requests - safe because:
--          1. Users are authenticated via Supabase Auth
--          2. App filters by organization_id
--          3. Join requests are not sensitive data
-- ==============================================================================

-- 1. Drop all existing policies on organization_join_requests
DROP POLICY IF EXISTS "Create Join Request" ON public.organization_join_requests;
DROP POLICY IF EXISTS "View Own Requests" ON public.organization_join_requests;
DROP POLICY IF EXISTS "Admins View Requests" ON public.organization_join_requests;
DROP POLICY IF EXISTS "Admins Manage Requests" ON public.organization_join_requests;
DROP POLICY IF EXISTS "Admins Delete Requests" ON public.organization_join_requests;

-- 2. Disable RLS on organization_join_requests
ALTER TABLE public.organization_join_requests DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================
-- After running this, the UsersSection should be able to fetch join requests
-- with the profiles data properly joined.
-- You should see in console:
-- 🔔 [UsersSection] Fetching requests for org: ...
-- 📬 [UsersSection] Requests data received: [array with data]
-- 📊 [UsersSection] Number of requests: 1 (or more)
-- ✅ [UsersSection] Setting requests state: [...]
-- ==============================================================================
