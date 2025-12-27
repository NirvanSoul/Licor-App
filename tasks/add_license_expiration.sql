-- Add license expiration tracking to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS license_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS license_activated_at TIMESTAMP WITH TIME ZONE;

-- Update existing active organizations to have an expiration date (e.g., 30 days from now)
UPDATE public.organizations 
SET 
    license_activated_at = NOW(),
    license_expires_at = NOW() + INTERVAL '30 days'
WHERE is_active = TRUE AND license_expires_at IS NULL;
