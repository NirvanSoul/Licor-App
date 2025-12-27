-- Drop old policy if exists
DROP POLICY IF EXISTS "Developers can manage license keys" ON public.license_keys;

-- Re-create policy with case-insensitive check and proper coverage
CREATE POLICY "Developers can manage license keys" 
ON public.license_keys FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND LOWER(role) = 'developer'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND LOWER(role) = 'developer'
    )
);

-- Ensure authenticated users can at least see keys if they are developers or if the key is available
DROP POLICY IF EXISTS "Anyone authenticated can read license keys" ON public.license_keys;
CREATE POLICY "Anyone authenticated can read license keys" 
ON public.license_keys FOR SELECT 
TO authenticated 
USING (
    status = 'available' 
    OR 
    LOWER((SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1)) = 'developer'
    OR
    used_by_org_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);
