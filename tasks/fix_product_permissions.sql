-- ==============================================================================
-- PATCH: ARREGLO DE PERMISOS DE PRODUCTOS
-- Descripción: Borra la política antigua (que falla al insertar) y crea nuevas.
-- ==============================================================================

-- 1. Borrar la política anterior (Si existe)
drop policy if exists "Access Products" on public.products;
drop policy if exists "Ver Productos" on public.products;
drop policy if exists "Crear Productos" on public.products;
drop policy if exists "Editar Productos" on public.products;
drop policy if exists "Borrar Productos" on public.products;

-- 2. Crear Políticas Granulares y Seguras

-- Lectura (Select): Ves los productos de tu organización
create policy "Ver Productos" on public.products for select using (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
);

-- Creación (Insert): Puedes crear si es para tu organización
create policy "Crear Productos" on public.products for insert with check (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
);

-- Edición (Update): Puedes editar si es de tu organización
create policy "Editar Productos" on public.products for update using (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
);

-- Borrado (Delete): Puedes borrar si es de tu organización
create policy "Borrar Productos" on public.products for delete using (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
);

-- Confirmación visual después de correr esto en Supabase
select 'Permisos de Productos Actualizados Correctamente' as status;
