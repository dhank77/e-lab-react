# E-Lab — Sistem Peminjaman Barang Laboratorium

Next.js 15 (App Router) + Supabase (Auth + Postgres) + Tailwind CSS.

## Fitur
- **Login & Register** (Supabase Auth, email + password) dengan proteksi halaman via middleware
- **Data Lab**: daftar lab, detail lab beserta barang, kondisi, dan stok
- **Peminjaman**: user mengajukan pinjam (jumlah, tanggal kembali, keperluan), bisa membatalkan selama masih *pending*
- **Admin**: setujui / tolak pengajuan (stok berkurang otomatis), tandai dikembalikan (stok bertambah), tambah/hapus lab & barang
- Keamanan data dengan **Row Level Security**; perubahan stok lewat fungsi RPC di database agar konsisten

## Setup

1. **Buat project** di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan isi `supabase/schema.sql`, lalu (opsional) `supabase/seed.sql` untuk data contoh.
3. Salin URL & anon key dari **Project Settings → API** ke `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Di **Authentication → URL Configuration**, set *Site URL* ke `http://localhost:3000` dan tambahkan `http://localhost:3000/auth/callback` ke *Redirect URLs*.
   (Untuk development lebih cepat, Anda bisa mematikan *Confirm email* di **Authentication → Providers → Email**.)
5. Jalankan:
   ```bash
   npm install
   npm run dev
   ```
6. Register akun, lalu jadikan admin lewat SQL Editor:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'email-anda@example.com');
   ```

## Struktur
```
src/
  middleware.ts                 # refresh sesi + proteksi route
  lib/supabase/{server,middleware}.ts
  lib/auth.ts                   # requireUser / requireAdmin
  app/
    page.tsx                    # landing
    login/, register/           # halaman auth
    auth/actions.ts             # server action login/register/logout
    auth/callback/route.ts      # konfirmasi email
    (app)/
      layout.tsx                # navbar (butuh login)
      actions.ts                # server action pinjam, admin, inventaris
      dashboard/  labs/  labs/[id]/  peminjaman/
      admin/  admin/inventaris/
supabase/
  schema.sql                    # tabel, RLS, trigger, fungsi RPC
  seed.sql                      # data contoh
```

## Alur status peminjaman
`pending` → (admin setujui) `approved` → (admin terima barang) `returned`
`pending` → (admin tolak) `rejected` · `pending` → (user batal) dihapus
