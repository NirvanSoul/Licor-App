-- Create license_keys table
CREATE TABLE IF NOT EXISTS public.license_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    plan_type TEXT DEFAULT 'premium',
    status TEXT DEFAULT 'available', -- 'available', 'used'
    used_by_org_id UUID REFERENCES public.organizations(id),
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for license_keys (Only developers should manage them, but users need to read during activation)
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone logged in can try to read a key to check its validity during activation
CREATE POLICY "Anyone authenticated can read license keys" 
ON public.license_keys FOR SELECT 
TO authenticated 
USING (status = 'available' OR used_by_org_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

-- Policy: Only users with 'developer' role can insert/delete keys (managed in DB or via logic)
-- Note: Reusing the role check logic from other tables if existing. 
-- For now, enabling full access to authenticated for management if needed, but in production this is restricted.
CREATE POLICY "Developers can manage license keys" 
ON public.license_keys FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'developer'
    )
);
