-- ==============================================================================
-- HELPER FUNCTION: Get Organization Members (Bypasses RLS)
-- ==============================================================================
-- This function allows fetching org members without RLS recursion issues.
-- Use this in your app instead of direct SELECT from profiles table.
-- ==============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_organization_members(uuid);

-- Create function to get all members of a specific organization
CREATE OR REPLACE FUNCTION public.get_organization_members(org_id uuid)
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    role text,
    avatar_url text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS and runs with elevated permissions
AS $$
BEGIN
    -- First, verify that the calling user belongs to the requested organization
    -- This prevents users from viewing members of other organizations
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.organization_id = org_id
    ) THEN
        RAISE EXCEPTION 'You do not have permission to view members of this organization';
    END IF;

    -- If authorized, return all members of the organization
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.role,
        p.avatar_url,
        p.created_at,
        p.updated_at
    FROM public.profiles p
    WHERE p.organization_id = org_id
    ORDER BY p.created_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_organization_members(uuid) TO authenticated;

-- ==============================================================================
-- HOW TO USE IN YOUR APP:
-- ==============================================================================
-- Instead of:
--   const { data } = await supabase.from('profiles').select('*').eq('organization_id', orgId)
--
-- Use:
--   const { data } = await supabase.rpc('get_organization_members', { org_id: orgId })
-- ==============================================================================
