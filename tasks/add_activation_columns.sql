-- Add license columns to organizations table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'license_key') THEN
        ALTER TABLE public.organizations ADD COLUMN license_key TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'is_active') THEN
        ALTER TABLE public.organizations ADD COLUMN is_active BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'plan_type') THEN
        ALTER TABLE public.organizations ADD COLUMN plan_type TEXT DEFAULT 'free';
    END IF;
END $$;
