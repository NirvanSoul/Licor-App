-- 5. Tabla de Ventas Corrected
create table if not exists public.sales (
  id uuid default gen_random_uuid() primary key,
  -- Changed from uuid to bigint to match the products table definition
  product_id bigint references public.products(id) not null, 
  quantity int not null,
  total_price numeric not null,
  -- Ensure profiles exists and uses UUID. referencing auth.users is safer/direct if profiles is uncertain.
  -- But adhering to your request: references public.profiles
  -- Ensure public.profiles exists first!
  sold_by uuid references auth.users(id) not null, 
  -- Assuming organizations table uses UUID (common practice)
  organization_id uuid not null, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Activar seguridad
alter table public.sales enable row level security;

-- Política: VER ventas (mismo organization_id)
create policy "Ver ventas de la misma licorería"
  on public.sales for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization_id = sales.organization_id
    )
  );

-- Política: Insertar ventas
create policy "Registrar ventas"
  on public.sales for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization_id = sales.organization_id
    )
  );
