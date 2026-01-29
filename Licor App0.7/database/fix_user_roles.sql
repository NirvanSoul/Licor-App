-- =============================================
-- FIX EXISTING USER ROLES
-- =============================================
-- This script manually fixes user roles that may be set incorrectly.
-- Run this AFTER updating the app code to remove 'master' references.
-- 
-- Step 1: View current profiles and identify issues
-- =============================================

SELECT 
    id,
    email,
    role,
    organization_id
FROM public.profiles
ORDER BY created_at DESC;

-- Step 2: Fix any user with incorrect role
-- =============================================
-- IMPORTANT: Replace 'your@email.com' with your actual email

UPDATE public.profiles
SET role = 'OWNER'
WHERE email = 'your@email.com'
AND organization_id IS NOT NULL;

-- Step 3: Verify the fix
-- =============================================

SELECT 
    p.id,
    p.email,
    p.role,
    p.organization_id,
    o.name as organization_name,
    o.code as organization_code
FROM public.profiles p
LEFT JOIN public.organizations o ON p.organization_id = o.id
WHERE p.email = 'your@email.com';

-- Step 4: If organization_id is NULL, find and link to organization
-- =============================================
-- Only run this if your organization_id is NULL but you created an organization

-- First, find your organization
SELECT id, name, code FROM public.organizations ORDER BY created_at DESC LIMIT 5;

-- Then link your profile (replace the organization_id value)
UPDATE public.profiles
SET 
    role = 'OWNER',
    organization_id = 'YOUR-ORGANIZATION-UUID-HERE'
WHERE email = 'your@email.com';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check that organization has a code
SELECT id, name, code, is_active FROM public.organizations;

-- Check that your profile is correct
SELECT id, email, role, organization_id FROM public.profiles WHERE email = 'your@email.com';
