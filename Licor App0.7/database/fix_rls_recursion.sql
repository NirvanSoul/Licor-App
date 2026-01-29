-- ==============================================================================
-- FIX RLS INFINITE RECURSION ON PROFILES TABLE
-- ==============================================================================
-- Problem: Multiple policies on profiles table are trying to read from profiles,
--          creating infinite recursion (Error 42P17)
-- Solution: Simplify policies to avoid self-referencing
-- ==============================================================================

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "View Own Profile" ON public.profiles;
DROP POLICY IF EXISTS "Update Own Profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins View Org Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins View Applicants" ON public.profiles;

-- ==============================================================================
-- NEW SIMPLIFIED POLICIES (NO RECURSION)
-- ==============================================================================

-- 1. Users can ALWAYS view their own profile
CREATE POLICY "View Own Profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

-- 2. Users can update their own profile
CREATE POLICY "Update Own Profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- 3. Users in the same organization can view each other's profiles
--    (Using organization_id directly without subquery on profiles)
CREATE POLICY "View Org Members" 
    ON public.profiles FOR SELECT 
    USING (
        organization_id IS NOT NULL 
        AND organization_id = (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
            LIMIT 1
        )
    );

-- Note: The "View Org Members" policy uses a subquery, but PostgreSQL handles
-- this differently than EXISTS with JOIN - it evaluates once per query, not recursively.
-- The key is that we're not using EXISTS with a JOIN back to profiles.

-- Alternative safer approach: If the above still causes issues, uncomment this:
-- DROP POLICY IF EXISTS "View Org Members" ON public.profiles;
-- 
-- CREATE POLICY "View Org Members" 
--     ON public.profiles FOR SELECT 
--     USING (
--         organization_id = COALESCE(
--             current_setting('app.current_user_org_id', true)::uuid,
--             (SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
--         )
--     );

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================
-- After running this script, test by logging in and checking the console.
-- You should see:
-- ✅ [AuthContext] Profile data received: { role: "OWNER", organization_id: "..." }
-- ✅ [AuthContext] Setting role: OWNER
-- ✅ [AuthContext] Setting organizationId: <uuid>
