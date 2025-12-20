-- ==========================================
-- 1. LIMPIEZA TOTAL (Empezamos de cero absoluto)
-- ==========================================
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
-- Borramos en orden de dependencia para no dejar basura
drop table if exists public.sales cascade;
drop table if exists public.inventory cascade;
drop table if exists public.prices cascade;
drop table if exists public.conversions cascade;
drop table if exists public.app_settings cascade;
drop table if exists public.organization_invites cascade; -- Esta era la culpable
drop table if exists public.products cascade;
drop table if exists public.profiles cascade;
drop table if exists public.organizations cascade;

-- ==========================================
-- 2. CREACIÓN DE ESTRUCTURA (Tablas)
-- ==========================================

create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.organization_invites (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(email, organization_id)
);

create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  organization_id uuid references public.organizations(id),
  role text check (role in ('OWNER', 'EMPLOYEE')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- (Tus otras tablas de negocio)
create table public.products (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) not null,
  name text not null,
  color text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, name)
);

-- ==========================================
-- 3. PERMISOS Y SEGURIDAD (Aquí estaba el fallo antes)
-- ==========================================

-- Habilitar RLS
alter table public.organizations enable row level security;
alter table public.organization_invites enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;

-- Dar permisos EXPLÍCITOS al "robot" (postgres/service_role) para que pueda escribir
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;

-- ==========================================
-- 4. EL CEREBRO (Trigger Corregido)
-- ==========================================

create or replace function public.handle_new_user()
returns trigger 
language plpgsql 
security definer 
set search_path = public -- Fuerza a buscar en la carpeta pública
as $$
declare
  new_org_id uuid;
  invited_org_id uuid;
  meta_store_name text;
  meta_full_name text;
begin
  -- Extraer metadata con seguridad
  meta_store_name := new.raw_user_meta_data->>'liquor_store_name';
  meta_full_name := new.raw_user_meta_data->>'full_name';

  -- LOGICA: ¿Es Dueño?
  if meta_store_name is not null and length(meta_store_name) > 0 then
    
    insert into public.organizations (name)
    values (meta_store_name)
    returning id into new_org_id;

    insert into public.profiles (id, full_name, organization_id, role)
    values (new.id, meta_full_name, new_org_id, 'OWNER');

  -- LOGICA: ¿Es Empleado?
  else
    select organization_id into invited_org_id
    from public.organization_invites
    where email = new.email
    limit 1;

    if invited_org_id is not null then
      insert into public.profiles (id, full_name, organization_id, role)
      values (new.id, meta_full_name, invited_org_id, 'EMPLOYEE');
    end if;
  end if;
  
  return new;
exception when others then
  -- Si falla, registramos el error en los logs internos de Postgres pero no rompemos el Auth
  raise warning 'Error en handle_new_user: %', SQLERRM;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 5. POLÍTICAS DE ACCESO (Para que TÚ puedas ver tus datos)
-- ==========================================
-- Política simple: Si es mi organización, puedo ver/editar todo.
create policy "Dueño ve todo" on public.organizations
  for all using (id in (select organization_id from public.profiles where id = auth.uid()));

create policy "Usuario ve su perfil" on public.profiles
  for all using (id = auth.uid());

-- Políticas de Productos (Granulares para evitar problemas de inserción)
create policy "Ver Productos" on public.products for select using (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
);

create policy "Crear Productos" on public.products for insert with check (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
);

create policy "Editar Productos" on public.products for update using (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
);

create policy "Borrar Productos" on public.products for delete using (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
);