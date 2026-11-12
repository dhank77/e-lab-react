-- E-Lab repair for existing Supabase projects.
-- Run after creating the designated staff user in Authentication -> Users.
begin;

alter table public.profiles drop constraint if exists profiles_nim_format_chk;
alter table public.profiles drop constraint if exists profiles_role_nim_chk;
alter table public.profiles add constraint profiles_role_nim_chk check (
  (role = 'mahasiswa' and nim is not null and char_length(btrim(nim)) > 0) or
  (role = 'petugas' and nim is null)
);

drop index if exists public.profiles_nim_unique_idx;
create unique index profiles_nim_unique_idx
  on public.profiles (upper(btrim(nim))) where nim is not null;
create unique index if not exists profiles_single_petugas_idx
  on public.profiles (role) where role = 'petugas';

create or replace function public.guard_petugas_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_email text;
begin
  if new.role = 'petugas' then
    select lower(u.email) into v_email from auth.users u where u.id = new.id;
    if v_email is distinct from 'hherawatii083@gmail.com' then
      raise exception 'Hanya akun petugas yang ditetapkan admin yang boleh memiliki role petugas.';
    end if;
    new.nim := null;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_profiles_guard_petugas on public.profiles;
create trigger trg_profiles_guard_petugas
before insert or update on public.profiles
for each row execute function public.guard_petugas_profile();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_nim text;
begin
  v_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'name', '')), '');
  v_nim := nullif(upper(btrim(coalesce(new.raw_user_meta_data ->> 'nim', ''))), '');
  if lower(coalesce(new.email, '')) = 'hherawatii083@gmail.com' then
    return new;
  end if;
  if v_name is null or v_nim is null then
    raise exception 'Nama dan NIM wajib diisi saat pendaftaran mahasiswa.';
  end if;
  insert into public.profiles (id, name, nim, role)
  values (new.id, v_name, v_nim, 'mahasiswa')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_petugas()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = auth.uid() and p.role = 'petugas'
      and lower(u.email) = 'hherawatii083@gmail.com'
  );
$$;

-- Create/repair the one staff profile if the Auth user already exists.
insert into public.profiles (id, name, nim, role)
select u.id,
       coalesce(nullif(btrim(u.raw_user_meta_data ->> 'name'), ''), split_part(u.email, '@', 1)),
       null,
       'petugas'::public.user_role
from auth.users u
where lower(u.email) = 'hherawatii083@gmail.com'
on conflict (id) do update
set name = excluded.name, nim = null, role = 'petugas';

commit;