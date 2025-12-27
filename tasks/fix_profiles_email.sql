-- ==============================================================================
-- FIX: ADD EMAIL TO PROFILES
-- Description: Adds the email column to the profiles table to allow 
--              verification of user existence during password recovery.
-- ==============================================================================

-- 1. Add the email column if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='email') then
        alter table public.profiles add column email text;
    end if;
end $$;

-- 2. Populate existing emails from auth.users
update public.profiles
set email = auth.users.email
from auth.users
where public.profiles.id = auth.users.id
and public.profiles.email is null;

-- 3. (Optional) Create a trigger to keep it updated automatically for new users
-- This ensures that every time a user is created in Auth, the email is copied to profiles.

create or replace function public.handle_new_user_email() 
returns trigger as $$
begin
  update public.profiles 
  set email = new.email 
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users update/insert
drop trigger if exists on_auth_user_created_update_email on auth.users;
create trigger on_auth_user_created_update_email
  after insert or update of email on auth.users
  for each row execute procedure public.handle_new_user_email();

select 'Column email added to profiles and sync trigger created.' as status;
