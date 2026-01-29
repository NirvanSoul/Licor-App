-- DIAGNOSTIC: Master Profile & RLS Check
-- ==========================================================

-- 1. Check your own profile (as seen by you)
-- If this returns 0 rows in the Supabase UI when logged in as yourself, 
-- Rule #3 is failing.
SELECT id, email, role, organization_id 
FROM public.profiles 
WHERE id = auth.uid();

-- 2. Check your organization (as seen by you)
SELECT id, name, code 
FROM public.organizations 
WHERE id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid());

-- 3. Check if your profile is even linked to an organization
-- If organization_id is NULL here, we found the issue.
SELECT email, role, organization_id 
FROM public.profiles 
WHERE email = 'TU_EMAIL_AQUI'; -- Reemplaza con tu correo
