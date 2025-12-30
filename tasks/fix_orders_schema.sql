-- ==============================================================================
-- FIX: ESTRUCTURA DE TABLAS DE VENTAS (ORDERS & ORDER_ITEMS)
-- Descripción: Asegura que las tablas finales de venta tengan todas las 
-- columnas necesarias que el código de la aplicación intenta guardar.
-- ==============================================================================

-- 0. Reparación de emergencia para error de UUID (Email en campo UUID)
-- Forzamos que created_by sea texto para aceptar correos
do $$ 
begin
    if exists (select 1 from information_schema.columns where table_name='orders' and column_name='created_by') then
        alter table public.orders alter column created_by type text;
    end if;
    if exists (select 1 from information_schema.columns where table_name='pending_orders' and column_name='created_by') then
        alter table public.pending_orders alter column created_by type text;
    end if;
end $$;

-- 1. Asegurar tabla 'orders' (Ventas Finalizadas)
create table if not exists public.orders (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid not null,
    ticket_number integer not null,
    customer_name text default 'Anónimo',
    status text not null default 'PAID',
    type text default 'Llevar',
    payment_method text,
    reference text,
    total_amount_bs numeric(12, 2) not null default 0,
    total_amount_usd numeric(12, 2) not null default 0,
    payments jsonb default '[]',
    created_by text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    closed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Asegurar que la columna 'payments' existe (en caso de que la tabla ya exista)
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='payments') then
        alter table public.orders add column payments jsonb default '[]';
    end if;
end $$;

-- 3. Asegurar tabla 'order_items' (Detalle de Ventas)
create table if not exists public.order_items (
    id uuid default gen_random_uuid() primary key,
    order_id uuid not null references public.orders(id) on delete cascade,
    product_id uuid, -- Puede ser NULL para consumos genéricos
    product_name text not null,
    quantity numeric(12, 2) not null default 1,
    price numeric(12, 2) not null default 0,
    emission text,
    subtype text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Habilitar RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- 5. Políticas de Seguridad
drop policy if exists "View Own Orders" on public.orders;
create policy "View Own Orders" on public.orders for select using (
    organization_id in (select organization_id from public.profiles where id = auth.uid())
);

drop policy if exists "Manage Own Orders" on public.orders;
create policy "Manage Own Orders" on public.orders for all using (
    organization_id in (select organization_id from public.profiles where id = auth.uid())
);

drop policy if exists "View Own Order Items" on public.order_items;
create policy "View Own Order Items" on public.order_items for select using (
    order_id in (select id from public.orders where organization_id in (select organization_id from public.profiles where id = auth.uid()))
);

drop policy if exists "Manage Own Order Items" on public.order_items;
create policy "Manage Own Order Items" on public.order_items for all using (
    order_id in (select id from public.orders where organization_id in (select organization_id from public.profiles where id = auth.uid()))
);

-- 6. Habilitar Realtime
do $$ 
begin
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
        alter publication supabase_realtime add table public.orders;
    end if;
end $$;

alter table public.orders replica identity full;

-- Confirmación
select 'Estructura de tablas de venta corregida exitosamente.' as status;
