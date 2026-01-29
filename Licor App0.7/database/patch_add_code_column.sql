-- PATCH: ADD MISSING 'CODE' COLUMN
-- ==========================================================
-- Description: The 'code' column was missing from the organizations table.
-- This script adds it and populates it for existing organizations.

-- 1. Add Column (Safe if exists)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;

-- 2. Populate NULL codes
-- We use a DO block to ensure unique codes for everyone
DO $$
DECLARE 
    r RECORD;
    new_code TEXT;
    exists_code BOOLEAN;
BEGIN
    FOR r IN SELECT id FROM public.organizations WHERE code IS NULL LOOP
        LOOP
            new_code := upper(substring(md5(random()::text) from 1 for 6));
            SELECT EXISTS(SELECT 1 FROM public.organizations WHERE code = new_code) INTO exists_code;
            EXIT WHEN NOT exists_code;
        END LOOP;
        
        UPDATE public.organizations SET code = new_code WHERE id = r.id;
    END LOOP;
END $$;

-- 3. Verify
SELECT id, name, code FROM public.organizations;
