-- ==============================================================================
-- SETUP: EMISIONES Y CONVERSIONES (TERCIO Y ESTÁNDAR)
-- Descripción: Asegura que la tabla de tipos de emisión tenga los valores 
-- correctos para Tercio (24/12) y Botella Estándar (36/18).
-- ==============================================================================

-- 1. Asegurar que la tabla existe
create table if not exists public.emission_types (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.profiles(organization_id),
    name text not null,
    units integer not null default 1,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1.1 Asegurar que existe la columna 'subtype' y el constraint único actualizado
do $$ 
begin
    -- Agregar columna subtype si no existe
    if not exists (select 1 from information_schema.columns where table_name='emission_types' and column_name='subtype') then
        alter table public.emission_types add column subtype text;
    end if;

    -- Actualizar constraint único (eliminar viejo si existe, crear nuevo)
    -- Asumimos que el constraint viejo se llamaba algo genérico o basado en los campos
    alter table public.emission_types drop constraint if exists emission_types_organization_id_name_key;
    
    -- Intentar crear el nuevo constraint único que incluye subtype
    begin
        alter table public.emission_types add constraint emission_types_org_name_subtype_key unique(organization_id, name, subtype);
    exception when others then
        raise notice 'El constraint único ya existe o no se pudo crear';
    end;
end $$;

-- 2. Habilitar RLS (Row Level Security)
alter table public.emission_types enable row level security;

-- 3. Políticas de Seguridad (Si no existen)
do $$ 
begin
    if not exists (select 1 from pg_policies where policyname = 'Ver Emisiones') then
        create policy "Ver Emisiones" on public.emission_types for select using (
            organization_id in (select organization_id from public.profiles where id = auth.uid())
        );
    end if;

    if not exists (select 1 from pg_policies where policyname = 'Gestionar Emisiones') then
        create policy "Gestionar Emisiones" on public.emission_types for all using (
            organization_id in (select organization_id from public.profiles where id = auth.uid())
        );
    end if;
end $$;

-- 4. INSERTAR VALORES POR DEFECTO PARA CADA ORGANIZACIÓN EXISTENTE
-- Nota: Esto aplica los valores de Tercio (24/12) y Botella (36/18) 
-- a todas las organizaciones registradas.

insert into public.emission_types (organization_id, name, units, subtype)
select 
    distinct organization_id, 
    vals.name, 
    vals.units, 
    vals.subtype
from 
    public.profiles,
    (values 
        ('Caja', 36, 'Botella'),
        ('Media Caja', 18, 'Botella'),
        ('Caja', 24, 'Botella Tercio'),
        ('Media Caja', 12, 'Botella Tercio'),
        ('Caja', 24, 'Lata'),
        ('Media Caja', 12, 'Lata'),
        ('Six Pack', 6, 'Lata')
    ) as vals(name, units, subtype)
where 
    organization_id is not null
on conflict (organization_id, name, subtype) 
do update set units = excluded.units;

-- Confirmación
select 'Emisiones de Tercio (24/12) configuradas correctamente' as status;
