-- ==============================================================================
-- SETUP: Links de Activación de Un Solo Uso
-- Descripción: Añade soporte para generar links de activación que el usuario
-- puede visitar para activar su cuenta automáticamente.
-- ==============================================================================

-- 1. Añadir columnas para el token de activación en license_keys
alter table public.license_keys add column if not exists activation_token text unique;
alter table public.license_keys add column if not exists activation_token_expires_at timestamp with time zone;
alter table public.license_keys add column if not exists activated_at timestamp with time zone;
alter table public.license_keys add column if not exists activated_by_email text;

-- 2. Crear índice para búsquedas rápidas por token
create index if not exists idx_license_keys_activation_token on public.license_keys(activation_token);

-- 3. Confirmación
select 'Link de activación configurado. Los campos activation_token, activation_token_expires_at, activated_at, y activated_by_email fueron añadidos a license_keys.' as status;
