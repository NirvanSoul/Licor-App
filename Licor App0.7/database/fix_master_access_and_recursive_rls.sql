-- MASTER FIX: Restore Access & Fix Recursive RLS
-- ==========================================================

-- 1. CONSOLIDATE TRIGGER: handle_new_user
-- Ensure only ONE version of this function exists and it handles codes correctly.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  store_name TEXT;
  input_org_code TEXT;
  generated_code TEXT;
BEGIN
  -- A. Create Profile (Basic)
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email; -- Sync email if already exists

  -- B. Logic for Organization Linking
  store_name := NEW.raw_user_meta_data->>'liquor_store_name';
  input_org_code := NEW.raw_user_meta_data->>'org_code';
  
  IF store_name IS NOT NULL THEN
    -- OWNER FLOW: Create Org with Unique Code
    generated_code := public.generate_unique_org_code();

    INSERT INTO public.organizations (name, plan_type, is_active, code)
    VALUES (store_name, 'free', TRUE, generated_code) 
    RETURNING id INTO new_org_id;

    -- Update Profile as OWNER
    UPDATE public.profiles
    SET organization_id = new_org_id, role = 'OWNER'
    WHERE id = NEW.id;
    
    PERFORM public.seed_organization_defaults(new_org_id);

  ELSIF input_org_code IS NOT NULL THEN
    -- EMPLOYEE FLOW: Validate Code and Create Request
    SELECT id INTO new_org_id FROM public.organizations WHERE code = input_org_code;

    IF new_org_id IS NOT NULL THEN
        INSERT INTO public.organization_join_requests (user_id, organization_id, org_code, status)
        VALUES (NEW.id, new_org_id, input_org_code, 'pending')
        ON CONFLICT DO NOTHING;

        UPDATE public.profiles SET role = 'EMPLOYEE' WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ENSURE ALL ORGS HAVE CODES (Fix for previous missing-code bugs)
UPDATE public.organizations 
SET code = public.generate_unique_org_code() 
WHERE code IS NULL;


-- 3. FIX RECURSIVE RLS (CRITICAL)
-- We must avoid JOINing profiles within a policy for profiles.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
DROP POLICY IF EXISTS "View Own Profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins view all profiles in organization" ON public.profiles;
DROP POLICY IF EXISTS "Admins view applicants profiles" ON public.profiles;

-- Basic: See yourself
CREATE POLICY "Profiles_Self_Select" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- Admin: See profiles in your organization
-- We use a simpler check: look up the user's role from their jwt metadata if possible, 
-- or a subquery that Supabase can optimize better.
CREATE POLICY "Profiles_Admin_Select" ON public.profiles
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles p_admin
        WHERE p_admin.id = auth.uid()
        AND p_admin.organization_id = public.profiles.organization_id
        AND upper(p_admin.role) IN ('OWNER', 'MANAGER', 'MASTER', 'DEVELOPER')
    )
);

-- Applicants: Admins see people who requested to join their org
CREATE POLICY "Profiles_Applicant_Select" ON public.profiles
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.organization_join_requests r
        WHERE r.user_id = public.profiles.id
        AND EXISTS (
             SELECT 1 FROM public.profiles p_admin 
             WHERE p_admin.id = auth.uid() 
             AND p_admin.organization_id = r.organization_id
             AND upper(p_admin.role) IN ('OWNER', 'MANAGER', 'MASTER', 'DEVELOPER')
        )
    )
);
