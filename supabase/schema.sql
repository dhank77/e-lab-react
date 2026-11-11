-- =====================================================================
-- E-Lab: skema database Supabase
-- Jalankan seluruh file ini di Supabase Dashboard > SQL Editor > New query
-- =====================================================================

-- ---------- Tabel ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  nim text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.labs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs (id) on delete cascade,
  name text not null,
  code text unique,
  description text,
  quantity_total int not null default 1 check (quantity_total >= 0),
  quantity_available int not null default 1 check (quantity_available >= 0),
  condition text not null default 'baik'
    check (condition in ('baik', 'rusak_ringan', 'rusak_berat')),
  created_at timestamptz not null default now(),
  constraint available_lte_total check (quantity_available <= quantity_total)
);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  purpose text,
  borrow_date date not null default current_date,
  due_date date not null,
  returned_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'returned')),
  admin_note text,
  created_at timestamptz not null default now(),
  constraint due_after_borrow check (due_date >= borrow_date)
);

create index if not exists items_lab_id_idx on public.items (lab_id);
create index if not exists loans_user_id_idx on public.loans (user_id);
create index if not exists loans_item_id_idx on public.loans (item_id);
create index if not exists loans_status_idx on public.loans (status);

-- ---------- Helper: cek admin ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- Trigger: buat profil saat user register ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, nim)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'nim'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.labs     enable row level security;
alter table public.items    enable row level security;
alter table public.loans    enable row level security;

-- profiles
drop policy if exists "profiles: baca diri sendiri atau admin" on public.profiles;
create policy "profiles: baca diri sendiri atau admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

-- Kolom role tidak boleh diubah user sendiri (lihat trigger di bawah)
drop policy if exists "profiles: update diri sendiri" on public.profiles;
create policy "profiles: update diri sendiri" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Tidak boleh mengubah role';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- labs: semua user login bisa lihat, hanya admin yang kelola
drop policy if exists "labs: baca" on public.labs;
create policy "labs: baca" on public.labs
  for select to authenticated using (true);
drop policy if exists "labs: admin kelola" on public.labs;
create policy "labs: admin kelola" on public.labs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- items
drop policy if exists "items: baca" on public.items;
create policy "items: baca" on public.items
  for select to authenticated using (true);
drop policy if exists "items: admin kelola" on public.items;
create policy "items: admin kelola" on public.items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- loans: user lihat miliknya, admin lihat semua.
-- Insert/update dilakukan lewat fungsi RPC di bawah agar stok konsisten.
drop policy if exists "loans: baca" on public.loans;
create policy "loans: baca" on public.loans
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- ---------- RPC: alur peminjaman ----------

-- User mengajukan peminjaman (status pending)
create or replace function public.request_loan(
  p_item_id uuid,
  p_quantity int,
  p_due_date date,
  p_purpose text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available int;
  v_loan_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Harus login';
  end if;
  if p_quantity is null or p_quantity < 1 then
    raise exception 'Jumlah minimal 1';
  end if;
  if p_due_date < current_date then
    raise exception 'Tanggal kembali tidak boleh di masa lalu';
  end if;

  select quantity_available into v_available from items where id = p_item_id;
  if v_available is null then
    raise exception 'Barang tidak ditemukan';
  end if;
  if p_quantity > v_available then
    raise exception 'Stok tidak cukup (tersedia %)', v_available;
  end if;

  insert into loans (user_id, item_id, quantity, due_date, purpose)
  values (auth.uid(), p_item_id, p_quantity, p_due_date, p_purpose)
  returning id into v_loan_id;

  return v_loan_id;
end;
$$;

-- User membatalkan pengajuan yang masih pending
create or replace function public.cancel_loan(p_loan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from loans
  where id = p_loan_id and user_id = auth.uid() and status = 'pending';
  if not found then
    raise exception 'Pengajuan tidak dapat dibatalkan';
  end if;
end;
$$;

-- Admin menyetujui: stok berkurang
create or replace function public.approve_loan(p_loan_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_loan loans%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin';
  end if;

  select * into v_loan from loans where id = p_loan_id for update;
  if v_loan.id is null or v_loan.status <> 'pending' then
    raise exception 'Peminjaman tidak dalam status pending';
  end if;

  update items
     set quantity_available = quantity_available - v_loan.quantity
   where id = v_loan.item_id and quantity_available >= v_loan.quantity;
  if not found then
    raise exception 'Stok tidak cukup untuk menyetujui';
  end if;

  update loans set status = 'approved', admin_note = p_note where id = p_loan_id;
end;
$$;

-- Admin menolak
create or replace function public.reject_loan(p_loan_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya admin';
  end if;
  update loans set status = 'rejected', admin_note = p_note
   where id = p_loan_id and status = 'pending';
  if not found then
    raise exception 'Peminjaman tidak dalam status pending';
  end if;
end;
$$;

-- Admin menandai barang sudah dikembalikan: stok bertambah
create or replace function public.return_loan(p_loan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_loan loans%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin';
  end if;

  select * into v_loan from loans where id = p_loan_id for update;
  if v_loan.id is null or v_loan.status <> 'approved' then
    raise exception 'Peminjaman belum disetujui / sudah dikembalikan';
  end if;

  update items
     set quantity_available = least(quantity_total, quantity_available + v_loan.quantity)
   where id = v_loan.item_id;

  update loans set status = 'returned', returned_at = now() where id = p_loan_id;
end;
$$;

revoke execute on function public.request_loan(uuid, int, date, text) from anon;
revoke execute on function public.cancel_loan(uuid)                   from anon;
revoke execute on function public.approve_loan(uuid, text)            from anon;
revoke execute on function public.reject_loan(uuid, text)             from anon;
revoke execute on function public.return_loan(uuid)                   from anon;
