-- FIX: Profiles Visibility RLS (Urgent)
-- ==========================================================

-- 1. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Allow Admins/Masters/Developers to VIEW all profiles in their organization
-- This is needed for the 'join' query in UsersSection.jsx to return full_name/email.
DROP POLICY IF EXISTS "Admins view all profiles in organization" ON public.profiles;
CREATE POLICY "Admins view all profiles in organization" 
ON public.profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles p2
        WHERE p2.id = auth.uid()
        AND p2.organization_id = public.profiles.organization_id
        AND upper(p2.role) IN ('OWNER', 'MANAGER', 'MASTER', 'DEVELOPER')
    )
);

-- 3. Allow anyone to see their OWN profile (Basic rule)
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
CREATE POLICY "Users can see own profile" ON public.profiles FOR SELECT USING (id = auth.uid());

-- 4. Allow new users (no org yet) to be seen by the Admin if they made a request?
-- Actually, the policy #2 covers users already in the org.
-- For new users in organization_join_requests, we need another rule:
DROP POLICY IF EXISTS "Admins view applicants profiles" ON public.profiles;
CREATE POLICY "Admins view applicants profiles"
ON public.profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.organization_join_requests r
        JOIN public.profiles admin ON admin.organization_id = r.organization_id
        WHERE admin.id = auth.uid()
        AND r.user_id = public.profiles.id
        AND upper(admin.role) IN ('OWNER', 'MANAGER', 'MASTER', 'DEVELOPER')
    )
);
