-- PATCH: Fix Missing RLS Policies for Organizations Table
-- Date: 2026-01-26
-- Description: Enables users to see their own organization details (specifically the Org Code).

-- 1. Ensure RLS is enabled on the organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users to view the organization they belong to
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;

CREATE POLICY "Users can view their own organization" 
ON public.organizations FOR SELECT 
USING (
  id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Note: No INSERT policy is needed for Organizations because creation happens 
-- via the 'handle_new_user' Trigger which runs as SECURITY DEFINER (System Level).
