-- PATCH: Create Cost Prices Table
-- Description: Ensures the cost_prices table exists with correct RLS and Realtime policies.
-- Usage: Run this in Supabase SQL Editor.

-- 1. Create Data Table
CREATE TABLE IF NOT EXISTS public.cost_prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    emission TEXT NOT NULL,
    subtype TEXT NOT NULL,
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT cost_prices_unique UNIQUE(organization_id, product_id, emission, subtype)
);

-- 2. Enable RLS
ALTER TABLE public.cost_prices ENABLE ROW LEVEL SECURITY;

-- 3. Add RLS Policy
DROP POLICY IF EXISTS "Access Cost Prices" ON public.cost_prices;
CREATE POLICY "Access Cost Prices" ON public.cost_prices FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

-- 4. Create Index
CREATE INDEX IF NOT EXISTS idx_cost_prices_org_id ON public.cost_prices(organization_id);

-- 5. Add to Realtime Publication
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'cost_prices') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.cost_prices;
    END IF;
END $$;

-- 6. Set Replica Identity
ALTER TABLE public.cost_prices REPLICA IDENTITY FULL;

-- 7. Add Update Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_cost_prices_updated ON public.cost_prices;
CREATE TRIGGER on_cost_prices_updated BEFORE UPDATE ON public.cost_prices FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 8. Grant Permissions
GRANT ALL ON public.cost_prices TO postgres;
GRANT ALL ON public.cost_prices TO service_role;
GRANT ALL ON public.cost_prices TO authenticated;
GRANT ALL ON public.cost_prices TO anon;
