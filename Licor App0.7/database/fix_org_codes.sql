-- DIAGNOSTIC & FIX: Organization Codes
-- ==========================================================

-- 1. VIEW CURRENT DATA (Run this part first to see if codes are NULL)
SELECT id, name, code, created_at FROM public.organizations;

-- 2. FIX MISSING CODES
-- If you see empty/null codes above, this command will generate them.
UPDATE public.organizations 
SET code = upper(substring(md5(random()::text) from 1 for 6)) 
WHERE code IS NULL OR code = '';

-- 3. VERIFY FIX
SELECT id, name, code FROM public.organizations;
