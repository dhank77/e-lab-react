-- ============================================================
-- E-Lab (Sistem Inventaris dan Peminjaman Alat Laboratorium)
-- Supabase PostgreSQL schema, functions, RPC, and RLS policies
-- Jalankan di Supabase SQL Editor (sekali, berurutan).
-- ============================================================

-- Extensions
create extension if not exists pgcrypto;

-- ---------- ENUMS ----------
do $$ begin
  create type public.user_role as enum ('mahasiswa', 'petugas');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.borrow_status as enum (
    'Menunggu', 'Disetujui', 'Ditolak',
    'Sedang Dipinjam', 'Selesai', 'Dibatalkan'
  );
exception when duplicate_object then null; end $$;

-- ---------- updated_at helper ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  nim text,
  username text,
  role public.user_role not null default 'mahasiswa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Case-insensitive/normalized uniqueness for username
alter table public.profiles add column if not exists username text;
alter table public.profiles drop constraint if exists profiles_role_nim_chk;
alter table public.profiles drop constraint if exists profiles_role_username_chk;
alter table public.profiles add constraint profiles_role_username_chk
  check (
    (role = 'mahasiswa' and username is not null and char_length(btrim(username)) > 0) or
    (role = 'petugas' and username is null)
  );
drop index if exists public.profiles_nim_unique_idx;
drop index if exists public.profiles_username_unique_idx;
create unique index profiles_username_unique_idx
  on public.profiles (lower(btrim(username))) where username is not null;

-- Tidak lagi membatasi hanya satu petugas; beberapa akun petugas diperbolehkan.
create or replace function public.guard_petugas_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_allowed text[] := array['hherawatii083@gmail.com', 'admin123@elab.local'];
begin
  if new.role = 'petugas' then
    select lower(u.email) into v_email from auth.users u where u.id = new.id;
    if v_email is not null and not (v_email = any(v_allowed)) then
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

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Bootstrap profile on signup (default mahasiswa; never trust client for role)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_username text;
begin
  v_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'name', '')), '');
  v_username := nullif(lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', ''))), '');

  -- Petugas is created by an administrator and linked by the seed/repair script.
  if lower(coalesce(new.email, '')) = any (array['hherawatii083@gmail.com', 'admin123@elab.local']) then
    return new;
  end if;
  if v_username is null then
    raise exception 'Username wajib diisi saat pendaftaran mahasiswa.';
  end if;
  insert into public.profiles (id, name, nim, username, role)
  values (new.id, v_name, null, v_username, 'mahasiswa')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- INVENTORY ITEMS ----------
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  lab text,
  description text not null default '',
  total integer not null,
  damaged integer not null default 0,
  borrowed integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_name_len_chk check (char_length(btrim(name)) between 3 and 80),
  constraint inventory_category_len_chk check (char_length(btrim(category)) between 1 and 40),
  constraint inventory_lab_len_chk check (lab is null or char_length(btrim(lab)) between 1 and 120),
  constraint inventory_description_len_chk check (char_length(description) <= 200),
  constraint inventory_total_chk check (total >= 1 and total <= 100000),
  constraint inventory_damaged_chk check (damaged >= 0),
  constraint inventory_borrowed_chk check (borrowed >= 0),
  constraint inventory_stock_balance_chk check (damaged + borrowed <= total)
);

create unique index if not exists inventory_items_name_unique_idx
  on public.inventory_items (lower(btrim(name)));

create index if not exists inventory_items_active_idx
  on public.inventory_items (is_active) where is_active = true;

create index if not exists inventory_items_category_idx
  on public.inventory_items (category);

drop trigger if exists trg_inventory_items_updated_at on public.inventory_items;
create trigger trg_inventory_items_updated_at
before update on public.inventory_items
for each row execute function public.set_updated_at();

-- ---------- BORROW REQUESTS ----------
create table if not exists public.borrow_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete restrict,
  student_name_snapshot text not null,
  item_id uuid not null references public.inventory_items(id) on delete restrict,
  item_name_snapshot text not null,
  quantity integer not null,
  borrow_date date not null,
  due_date date not null,
  purpose text not null default '',
  status public.borrow_status not null default 'Menunggu',
  created_at timestamptz not null default now(),
  decided_at date,
  reject_reason text,
  handed_over_at date,
  returned_at date,
  returned_good integer,
  returned_damaged integer,
  return_note text,
  constraint borrow_quantity_chk check (quantity > 0),
  constraint borrow_date_order_chk check (due_date >= borrow_date),
  constraint borrow_max_days_chk check (due_date <= borrow_date + 30),
  constraint borrow_purpose_len_chk check (char_length(purpose) <= 200),
  constraint borrow_reject_reason_len_chk check (reject_reason is null or char_length(reject_reason) <= 200),
  constraint borrow_return_note_len_chk check (return_note is null or char_length(return_note) <= 200),
  constraint borrow_returned_good_chk check (returned_good is null or returned_good >= 0),
  constraint borrow_returned_damaged_chk check (returned_damaged is null or returned_damaged >= 0),
  constraint borrow_return_sum_chk check (
    (returned_good is null and returned_damaged is null) or
    (returned_good is not null and returned_damaged is not null and returned_good + returned_damaged = quantity)
  ),
  constraint borrow_status_fields_chk check (
    (status = 'Menunggu' and handed_over_at is null and returned_at is null and returned_good is null and returned_damaged is null) or
    (status = 'Disetujui' and handed_over_at is null and returned_at is null) or
    (status = 'Ditolak' and handed_over_at is null and returned_at is null) or
    (status = 'Dibatalkan' and handed_over_at is null and returned_at is null) or
    (status = 'Sedang Dipinjam' and handed_over_at is not null and returned_at is null and returned_good is null and returned_damaged is null) or
    (status = 'Selesai' and handed_over_at is not null and returned_at is not null and returned_good is not null and returned_damaged is not null)
  )
);

create index if not exists borrow_requests_student_idx on public.borrow_requests (student_id, created_at desc);
create index if not exists borrow_requests_item_idx on public.borrow_requests (item_id);
create index if not exists borrow_requests_status_idx on public.borrow_requests (status, created_at desc);
create index if not exists borrow_requests_handed_over_idx on public.borrow_requests (handed_over_at desc) where handed_over_at is not null;

-- ---------- ROLE HELPERS (non-recursive; safe for RLS) ----------
create or replace function public.is_petugas()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = auth.uid()
      and p.role = 'petugas'
      and lower(u.email) = any (array['hherawatii083@gmail.com', 'admin123@elab.local'])
  );
$$;

create or replace function public.is_mahasiswa()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'mahasiswa'
  );
$$;

revoke all on function public.is_petugas() from public;
revoke all on function public.is_mahasiswa() from public;
grant execute on function public.is_petugas() to anon, authenticated;
grant execute on function public.is_mahasiswa() to anon, authenticated;

-- ---------- ROW LEVEL SECURITY ----------
alter table public.profiles enable row level security;
alter table public.inventory_items enable row level security;
alter table public.borrow_requests enable row level security;

-- profiles
drop policy if exists "profiles_select_self_or_petugas" on public.profiles;
create policy "profiles_select_self_or_petugas"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_petugas());

drop policy if exists "profiles_insert_self_mahasiswa" on public.profiles;
create policy "profiles_insert_self_mahasiswa"
on public.profiles for insert
to authenticated
with check (
  id = auth.uid()
  and role = 'mahasiswa'
  and username is not null
);

drop policy if exists "profiles_update_self_no_role_escalation" on public.profiles;
create policy "profiles_update_self_no_role_escalation"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = (select p.role from public.profiles p where p.id = auth.uid())
);

-- inventory_items
drop policy if exists "inventory_public_read_active" on public.inventory_items;
create policy "inventory_public_read_active"
on public.inventory_items for select
to anon, authenticated
using (is_active = true);

drop policy if exists "inventory_petugas_read_all" on public.inventory_items;
create policy "inventory_petugas_read_all"
on public.inventory_items for select
to authenticated
using (public.is_petugas());

drop policy if exists "inventory_petugas_insert" on public.inventory_items;
create policy "inventory_petugas_insert"
on public.inventory_items for insert
to authenticated
with check (public.is_petugas());

drop policy if exists "inventory_petugas_update" on public.inventory_items;
create policy "inventory_petugas_update"
on public.inventory_items for update
to authenticated
using (public.is_petugas())
with check (public.is_petugas());

drop policy if exists "inventory_petugas_delete" on public.inventory_items;
create policy "inventory_petugas_delete"
on public.inventory_items for delete
to authenticated
using (public.is_petugas());

-- ---------- ACCOUNT DELETION ----------
-- Mahasiswa dapat menghapus profil sendiri. borrow_requests (on delete restrict)
-- dihapus terlebih dahulu melalui fungsi delete_student_account sebelum profil dihapus.
drop policy if exists "profiles_delete_self" on public.profiles;
create policy "profiles_delete_self"
on public.profiles for delete
to authenticated
using (id = auth.uid());

-- Fungsi untuk menghapus akun mahasiswa (security definer agar dapat
-- menghapus borrow_requests dan profil milik sendiri tanpa gangguan RLS).
-- Hapus auth.user dilakukan melalui service role di sisi server (API route).
create or replace function public.delete_student_account()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select p.role into v_role
  from public.profiles p
  where p.id = auth.uid();

  if v_role <> 'mahasiswa' then
    return jsonb_build_object('ok', false, 'error', 'Hanya mahasiswa yang dapat menghapus akun.');
  end if;

  -- Hapus semua pengajuan milik mahasiswa ini terlebih dahulu (karena FK on delete restrict).
  delete from public.borrow_requests
  where student_id = auth.uid();

  -- Hapus profil.
  delete from public.profiles
  where id = auth.uid();

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.delete_student_account() from public;
grant execute on function public.delete_student_account() to authenticated;

-- borrow_requests
drop policy if exists "borrow_student_select_own" on public.borrow_requests;
create policy "borrow_student_select_own"
on public.borrow_requests for select
to authenticated
using (student_id = auth.uid() and public.is_mahasiswa());

drop policy if exists "borrow_petugas_select_all" on public.borrow_requests;
create policy "borrow_petugas_select_all"
on public.borrow_requests for select
to authenticated
using (public.is_petugas());

drop policy if exists "borrow_student_insert_own_pending" on public.borrow_requests;
create policy "borrow_student_insert_own_pending"
on public.borrow_requests for insert
to authenticated
with check (
  public.is_mahasiswa()
  and student_id = auth.uid()
  and status = 'Menunggu'
  and handed_over_at is null
  and returned_at is null
  and decided_at is null
  and reject_reason is null
  and returned_good is null
  and returned_damaged is null
  and return_note is null
);

drop policy if exists "borrow_student_cancel_own_pending" on public.borrow_requests;
create policy "borrow_student_cancel_own_pending"
on public.borrow_requests for update
to authenticated
using (
  public.is_mahasiswa()
  and student_id = auth.uid()
  and status = 'Menunggu'
)
with check (
  public.is_mahasiswa()
  and student_id = auth.uid()
  and status = 'Dibatalkan'
);

-- No direct insert/update/delete on borrow_requests for petugas via table API;
-- petugas must use RPCs/functions for controlled, atomic transitions.

-- ---------- ATOMIC RPCs (stock + status) ----------
-- Handover: Disetujui -> Sedang Dipinjam, borrowed += quantity (atomic)
create or replace function public.handover_request(p_request_id uuid)
returns public.borrow_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.borrow_requests;
  v_item public.inventory_items;
  v_available integer;
begin
  if not public.is_petugas() then
    raise exception 'Hanya petugas yang dapat mencatat penyerahan.';
  end if;

  select * into v_req
  from public.borrow_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Pengajuan tidak ditemukan.';
  end if;
  if v_req.status <> 'Disetujui' then
    raise exception 'Hanya pengajuan yang sudah disetujui yang dapat diserahkan.';
  end if;

  select * into v_item
  from public.inventory_items
  where id = v_req.item_id
  for update;

  if not found then
    raise exception 'Barang pada pengajuan ini sudah tidak ada di inventaris.';
  end if;

  v_available := greatest(0, v_item.total - v_item.damaged - v_item.borrowed);
  if v_req.quantity > v_available then
    raise exception 'Stok tidak mencukupi: diminta % unit, tersedia % unit.', v_req.quantity, v_available;
  end if;

  update public.inventory_items
  set borrowed = borrowed + v_req.quantity
  where id = v_item.id;

  update public.borrow_requests
  set status = 'Sedang Dipinjam',
      handed_over_at = current_date
  where id = v_req.id
  returning * into v_req;

  return v_req;
end;
$$;

-- Return: Sedang Dipinjam -> Selesai, borrowed -= quantity, damaged += returned_damaged (atomic)
create or replace function public.return_request(
  p_request_id uuid,
  p_damaged_units integer,
  p_note text default null
)
returns public.borrow_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.borrow_requests;
  v_item public.inventory_items;
  v_damaged integer;
  v_good integer;
  v_note text;
begin
  if not public.is_petugas() then
    raise exception 'Hanya petugas yang dapat mencatat pengembalian.';
  end if;

  v_note := nullif(btrim(coalesce(p_note, '')), '');
  if v_note is not null and char_length(v_note) > 200 then
    raise exception 'Catatan maksimal 200 karakter.';
  end if;

  select * into v_req
  from public.borrow_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Pengajuan tidak ditemukan.';
  end if;
  if v_req.status <> 'Sedang Dipinjam' then
    raise exception 'Hanya peminjaman yang sedang berjalan yang dapat dicatat pengembaliannya.';
  end if;

  v_damaged := coalesce(p_damaged_units, 0);
  if v_damaged < 0 or v_damaged > v_req.quantity then
    raise exception 'Jumlah unit rusak harus antara 0 dan %.', v_req.quantity;
  end if;
  v_good := v_req.quantity - v_damaged;

  select * into v_item
  from public.inventory_items
  where id = v_req.item_id
  for update;

  if not found then
    raise exception 'Barang pada pengajuan ini sudah tidak ada di inventaris.';
  end if;

  if v_item.borrowed < v_req.quantity then
    raise exception 'Data stok pinjam tidak konsisten.';
  end if;
  if v_item.damaged + v_damaged > v_item.total then
    raise exception 'Perubahan stok melebihi jumlah total barang.';
  end if;

  update public.inventory_items
  set borrowed = borrowed - v_req.quantity,
      damaged = least(total, damaged + v_damaged)
  where id = v_item.id;

  update public.borrow_requests
  set status = 'Selesai',
      returned_at = current_date,
      returned_good = v_good,
      returned_damaged = v_damaged,
      return_note = v_note
  where id = v_req.id
  returning * into v_req;

  return v_req;
end;
$$;

revoke all on function public.handover_request(uuid) from public;
revoke all on function public.return_request(uuid, integer, text) from public;
grant execute on function public.handover_request(uuid) to authenticated;
grant execute on function public.return_request(uuid, integer, text) to authenticated;

-- ---------- Convenience: controlled status transitions for petugas ----------
-- Approve (Menunggu -> Disetujui). No stock change.
create or replace function public.approve_request(p_request_id uuid)
returns public.borrow_requests
language plpgsql
security definer
set search_path = public
as $$
declare v_req public.borrow_requests;
begin
  if not public.is_petugas() then raise exception 'Hanya petugas.'; end if;
  select * into v_req from public.borrow_requests where id = p_request_id for update;
  if not found then raise exception 'Pengajuan tidak ditemukan.'; end if;
  if v_req.status <> 'Menunggu' then raise exception 'Pengajuan ini sudah diproses sebelumnya.'; end if;
  if not exists (select 1 from public.inventory_items where id = v_req.item_id) then
    raise exception 'Barang pada pengajuan ini sudah tidak ada di inventaris.';
  end if;
  update public.borrow_requests
  set status = 'Disetujui', decided_at = current_date
  where id = p_request_id returning * into v_req;
  return v_req;
end;
$$;

-- Reject (Menunggu -> Ditolak). No stock change.
create or replace function public.reject_request(p_request_id uuid, p_reason text default null)
returns public.borrow_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.borrow_requests;
  v_reason text;
begin
  if not public.is_petugas() then raise exception 'Hanya petugas.'; end if;
  v_reason := nullif(btrim(coalesce(p_reason, '')), '');
  if v_reason is not null and char_length(v_reason) > 200 then
    raise exception 'Alasan penolakan maksimal 200 karakter.';
  end if;
  select * into v_req from public.borrow_requests where id = p_request_id for update;
  if not found then raise exception 'Pengajuan tidak ditemukan.'; end if;
  if v_req.status <> 'Menunggu' then raise exception 'Pengajuan ini sudah diproses sebelumnya.'; end if;
  update public.borrow_requests
  set status = 'Ditolak', decided_at = current_date, reject_reason = v_reason
  where id = p_request_id returning * into v_req;
  return v_req;
end;
$$;

revoke all on function public.approve_request(uuid) from public;
revoke all on function public.reject_request(uuid, text) from public;
grant execute on function public.approve_request(uuid) to authenticated;
grant execute on function public.reject_request(uuid, text) to authenticated;
