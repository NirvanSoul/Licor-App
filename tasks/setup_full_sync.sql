-- ==============================================================================
-- SETUP: SINCRONIZACIÓN COMPLETA DE DATOS ENTRE DISPOSITIVOS
-- Descripción: Crea tablas adicionales para que TODOS los datos se guarden
-- en Supabase y no solo en localStorage. Esto permite sincronización
-- entre computadora y teléfono.
-- NOTA: No usamos foreign keys a profiles(organization_id) porque no tiene 
-- un constraint único. En su lugar, usamos RLS para asegurar el acceso.
-- ==============================================================================

-- 1. TABLA: organization_settings
-- Guarda configuraciones de la organización como moneda, tasas de cambio, etc.
create table if not exists public.organization_settings (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid not null,
    key text not null,
    value jsonb not null default '{}',
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint organization_settings_unique unique(organization_id, key)
);

-- 2. TABLA: cost_prices
-- Guarda los precios de costo para calcular ganancias netas
create table if not exists public.cost_prices (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid not null,
    product_id uuid not null references public.products(id) on delete cascade,
    emission text not null,
    subtype text not null,
    cost numeric(12, 2) not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint cost_prices_unique unique(organization_id, product_id, emission, subtype)
);

-- 3. TABLA: inventory_history
-- Historial de movimientos de inventario (entradas)
create table if not exists public.inventory_history (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid not null,
    movements jsonb not null default '[]',
    total_units integer not null default 0,
    created_by uuid references auth.users(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TABLA: waste_reports
-- Historial de merma/pérdidas
create table if not exists public.waste_reports (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid not null,
    movements jsonb not null default '[]',
    total_units integer not null default 0,
    created_by uuid references auth.users(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. TABLA: pending_orders (Tickets Abiertos que se sincronizan)
-- Permite ver los tickets abiertos desde cualquier dispositivo
create table if not exists public.pending_orders (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid not null,
    ticket_number integer not null,
    customer_name text default 'Cliente',
    status text not null default 'OPEN',
    type text default 'Local',
    payment_method text,
    reference text,
    items jsonb not null default '[]',
    payments jsonb default '[]',
    created_by text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- HABILITAR ROW LEVEL SECURITY
-- ==============================================================================

alter table public.organization_settings enable row level security;
alter table public.cost_prices enable row level security;
alter table public.inventory_history enable row level security;
alter table public.waste_reports enable row level security;
alter table public.pending_orders enable row level security;

-- ==============================================================================
-- POLÍTICAS DE SEGURIDAD
-- Usamos subquery a profiles para verificar que el usuario pertenece a la org
-- ==============================================================================

-- organization_settings: Ver y modificar solo de la propia organización
drop policy if exists "View Own Settings" on public.organization_settings;
create policy "View Own Settings" on public.organization_settings for select using (
    organization_id in (select organization_id from public.profiles where id = auth.uid())
);

drop policy if exists "Manage Own Settings" on public.organization_settings;
create policy "Manage Own Settings" on public.organization_settings for all using (
    organization_id in (select organization_id from public.profiles where id = auth.uid())
);

-- cost_prices: Ver y modificar solo de la propia organización
drop policy if exists "View Own Costs" on public.cost_prices;
create policy "View Own Costs" on public.cost_prices for select using (
    organization_id in (select organization_id from public.profiles where id = auth.uid())
);

drop policy if exists "Manage Own Costs" on public.cost_prices;
create policy "Manage Own Costs" on public.cost_prices for all using (
    organization_id in (select organization_id from public.profiles where id = auth.uid())
);

-- inventory_history: Ver y modificar solo de la propia organización
drop policy if exists "View Own Inventory History" on public.inventory_history;
create policy "View Own Inventory History" on public.inventory_history for select using (
    organization_id in (select organization_id from public.profiles where id = auth.uid())
);

drop policy if exists "Manage Own Inventory History" on public.inventory_history;
create policy "Manage Own Inventory History" on public.inventory_history for all using (
    organization_id in (select organization_id from public.profiles where id = auth.uid())
);

-- waste_reports: Ver y modificar solo de la propia organización
drop policy if exists "View Own Waste Reports" on public.waste_reports;
create policy "View Own Waste Reports" on public.waste_reports for select using (
    organization_id in (select organization_id from public.profiles where id = auth.uid())
);

drop policy if exists "Manage Own Waste Reports" on public.waste_reports;
create policy "Manage Own Waste Reports" on public.waste_reports for all using (
    organization_id in (select organization_id from public.profiles where id = auth.uid())
);

-- pending_orders: Ver y modificar solo de la propia organización
drop policy if exists "View Own Pending Orders" on public.pending_orders;
create policy "View Own Pending Orders" on public.pending_orders for select using (
    organization_id in (select organization_id from public.profiles where id = auth.uid())
);

drop policy if exists "Manage Own Pending Orders" on public.pending_orders;
create policy "Manage Own Pending Orders" on public.pending_orders for all using (
    organization_id in (select organization_id from public.profiles where id = auth.uid())
);

-- ==============================================================================
-- HABILITAR REALTIME PARA LAS NUEVAS TABLAS
-- ==============================================================================

do $$ 
begin
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'organization_settings') then
        alter publication supabase_realtime add table public.organization_settings;
    end if;

    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cost_prices') then
        alter publication supabase_realtime add table public.cost_prices;
    end if;

    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'inventory_history') then
        alter publication supabase_realtime add table public.inventory_history;
    end if;

    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'waste_reports') then
        alter publication supabase_realtime add table public.waste_reports;
    end if;

    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pending_orders') then
        alter publication supabase_realtime add table public.pending_orders;
    end if;
end $$;

-- Habilitar réplica completa para realtime
alter table public.organization_settings replica identity full;
alter table public.cost_prices replica identity full;
alter table public.inventory_history replica identity full;
alter table public.waste_reports replica identity full;
alter table public.pending_orders replica identity full;

-- ==============================================================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- ==============================================================================

create index if not exists idx_organization_settings_org_id on public.organization_settings(organization_id);
create index if not exists idx_cost_prices_org_id on public.cost_prices(organization_id);
create index if not exists idx_inventory_history_org_id on public.inventory_history(organization_id);
create index if not exists idx_waste_reports_org_id on public.waste_reports(organization_id);
create index if not exists idx_pending_orders_org_id on public.pending_orders(organization_id);
create index if not exists idx_pending_orders_status on public.pending_orders(status);

-- ==============================================================================
-- CONFIRMACIÓN
-- ==============================================================================

select 'Sincronización completa configurada. Las siguientes tablas ahora sincronizan en tiempo real:
- organization_settings (moneda, tasas de cambio)
- cost_prices (precios de costo)
- inventory_history (historial de inventario)
- waste_reports (historial de merma)
- pending_orders (tickets abiertos)' as status;
