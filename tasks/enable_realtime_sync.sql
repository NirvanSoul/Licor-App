-- ==============================================================================
-- SETUP: ACTIVACIÓN DE REALTIME Y SINCRONIZACIÓN TOTAL (CORREGIDO)
-- Descripción: Activa la escucha en tiempo real de Supabase de forma segura.
-- ==============================================================================

-- 1. ACTIVAR PUBLICACIÓN REALTIME DE FORMA SEGURA
-- Usamos un bloque DO para verificar si la tabla ya está en la publicación antes de añadirla.

do $$ 
begin
    -- 1.1 Asegurar que la publicación existe (Supabase la crea por defecto, pero por si acaso)
    if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
        create publication supabase_realtime;
    end if;

    -- 1.2 Añadir tablas una por una si no están presentes
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products') then
        alter publication supabase_realtime add table public.products;
    end if;

    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'inventory') then
        alter publication supabase_realtime add table public.inventory;
    end if;

    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'prices') then
        alter publication supabase_realtime add table public.prices;
    end if;

    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'emission_types') then
        alter publication supabase_realtime add table public.emission_types;
    end if;
end $$;

-- 2. ASEGURAR RESTRICCIONES ÚNICAS (Para que el guardado/upsert no falle)

-- Para PRECIOS:
do $$ 
begin
    if not exists (select 1 from pg_constraint where conname = 'prices_unique_idx') then
        alter table public.prices add constraint prices_unique_idx unique (product_id, emission, subtype, is_local);
    end if;
exception when others then
    raise notice 'La restricción de precios ya existe.';
end $$;

-- Para INVENTARIO:
do $$ 
begin
    if not exists (select 1 from pg_constraint where conname = 'inventory_unique_idx') then
        alter table public.inventory add constraint inventory_unique_idx unique (product_id, subtype);
    end if;
exception when others then
    raise notice 'La restricción de inventario ya existe.';
end $$;

-- 3. HABILITAR REPLICACIÓN DE RÉPLICAS COMPLETAS
-- Esto asegura que el mensaje de Realtime contenga todos los datos.
alter table public.products replica identity full;
alter table public.inventory replica identity full;
alter table public.prices replica identity full;
alter table public.emission_types replica identity full;

-- Confirmación visual
select 'Sincronización Realtime configurada correctamente' as status;
