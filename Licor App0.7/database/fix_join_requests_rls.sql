-- FIX: Update RLS for organization_join_requests
-- ==========================================================

-- 1. Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Admin View Requests" ON public.organization_join_requests;
DROP POLICY IF EXISTS "View Own Requests" ON public.organization_join_requests;

-- 2. Create more permissive SELECT policy for Org Owners/Managers
-- Allows owners to see ALL pending requests for their organization
CREATE POLICY "Org admins can view their requests"
ON public.organization_join_requests FOR SELECT
USING (
    -- Either the user owns the request
    auth.uid() = user_id
    OR
    -- Or the user is an admin of the target organization
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.organization_id = public.organization_join_requests.organization_id
        AND p.role IN ('OWNER', 'MANAGER', 'master', 'DEVELOPER')
    )
);

-- 3. Add a policy allowing profiles to be read for join request context
-- This allows the OWNER to see the name/email of the person requesting
DROP POLICY IF EXISTS "Read profiles for join requests" ON public.profiles;
CREATE POLICY "Read profiles for join requests"
ON public.profiles FOR SELECT
USING (
    -- Users can see themselves
    auth.uid() = id
    OR
    -- Org admins can see profiles that have pending requests for their org
    EXISTS (
        SELECT 1 FROM public.organization_join_requests r
        WHERE r.user_id = public.profiles.id
        AND r.organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
        AND r.status = 'pending'
    )
    OR
    -- Users in the same organization can see each other
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
);

-- 4. Verify by running this as your OWNER user:
-- SELECT * FROM organization_join_requests WHERE status = 'pending';
