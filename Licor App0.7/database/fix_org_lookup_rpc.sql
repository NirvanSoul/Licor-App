-- FIX: Organization Lookup via RPC (Bypassing RLS safely)
-- ==========================================================

-- Description: Creates a secure function to look up an organization by code.
-- This is necessary because new users (not yet in the org) cannot SELECT from the 
-- organizations table directly due to strict RLS policies.

CREATE OR REPLACE FUNCTION public.get_org_by_code(code_input TEXT)
RETURNS TABLE (id UUID, name TEXT)
SECURITY DEFINER -- Runs with admin privileges to bypass RLS
AS $$
BEGIN
  RETURN QUERY 
  SELECT o.id, o.name 
  FROM public.organizations o 
  WHERE o.code = code_input
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_org_by_code(TEXT) TO authenticated;
