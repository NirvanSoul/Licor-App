-- DIAGNOSTIC: Check Join Requests Visibility
-- ==========================================================

-- 1. Check Total Requests in System (Admin View)
-- This confirms if the request was actually created by the Employee.
SELECT count(*) as total_requests_in_db FROM public.organization_join_requests;

-- 2. Check Requests specifically for your Organization
-- Replace YOUR_ORG_CODE_HERE with the code '741DBA' (or your actual code)
SELECT * FROM public.organization_join_requests 
WHERE org_code = '741DBA';

-- 3. Check Permissions (RLS)
-- If querying as 'postgres'/'admin' works, but the UI fails, 
-- it's usually because the Master User's 'role' in 'profiles' isn't exactly 'OWNER'.

SELECT id, email, role, organization_id FROM public.profiles WHERE email LIKE '%@%'; -- Lists all profiles to verify roles.
