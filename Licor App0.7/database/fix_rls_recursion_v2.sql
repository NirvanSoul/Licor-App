-- ==============================================================================
-- FIX RLS INFINITE RECURSION - COMPLETE SIMPLE VERSION
-- ==============================================================================
-- Problem: ANY subquery reading from profiles within a profiles policy causes
--          infinite recursion, even with LIMIT 1
-- Solution: ONLY allow users to read their own profile. No org member viewing
--           through RLS - we'll handle that in application code instead.
-- ==============================================================================

-- 1. DROP ALL EXISTING POLICIES ON PROFILES
DROP POLICY IF EXISTS "View Own Profile" ON public.profiles;
DROP POLICY IF EXISTS "Update Own Profile" ON public.profiles;
DROP POLICY IF EXISTS "View Org Members" ON public.profiles;
DROP POLICY IF EXISTS "Admins View Org Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins View Applicants" ON public.profiles;

-- 2. ENSURE RLS IS ENABLED
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. CREATE THE SIMPLEST POSSIBLE POLICIES (NO RECURSION)

-- Users can ONLY view their own profile (PERIOD - no exceptions, no subqueries)
CREATE POLICY "users_read_own_profile" 
    ON public.profiles 
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = id);

-- Users can ONLY update their own profile
CREATE POLICY "users_update_own_profile" 
    ON public.profiles 
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ==============================================================================
-- IMPORTANT: Viewing other org members
-- ==============================================================================
-- We removed the ability to view org members through RLS because ANY attempt
-- to read from profiles within a profiles policy causes infinite recursion.
--
-- Instead, the application should:
-- 1. Fetch the user's own profile (works with the policy above)
-- 2. Use a SECURITY DEFINER function to fetch org members, which bypasses RLS
--
-- Example function (already exists in your DB):
-- CREATE FUNCTION get_org_members(org_id uuid)
-- RETURNS SETOF profiles
-- SECURITY DEFINER
-- AS $$ ... $$;
-- ==============================================================================

-- Verification: After running this, test by logging in
-- You should see in console:
-- ✅ [AuthContext] Profile data received: { role: "OWNER", organization_id: "..." }
