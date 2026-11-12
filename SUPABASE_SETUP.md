# E-Lab - Integrasi Supabase (Panduan Singkat)

## 1) Buat project Supabase
1. Buka Supabase Dashboard -> **New project**.
2. Pilih organisasi, beri nama project, set password database, pilih region.
3. Setelah project siap, buka **Project Settings -> API** dan salin:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (Jangan gunakan service_role key di aplikasi/browser.)

## 2) Jalankan SQL di SQL Editor
Buka **SQL Editor** di dashboard, lalu jalankan berurutan:
1. Isi file `supabase/schema.sql` -> jalankan (ekstensi, enum, tabel `profiles`, `inventory_items`, `borrow_requests`, constraint/index, trigger, fungsi/RPC atomik penyerahan/pengembalian/persetujuan/penolakan, dan kebijakan RLS).
2. Isi file `supabase/seed.sql` -> jalankan (15 barang awal dari `BASE_ITEMS`, `damaged=0`, `borrowed=0`, `is_active=true`; tanpa akun/pengajuan contoh).
3. Untuk project dengan schema lama, jalankan `supabase/repair_staff_registration.sql` setelah membuat akun petugas di Authentication -> Users.

> Riwayat transaksi di aplikasi berasal dari pengajuan yang memiliki `handed_over_at` (perilaku dipertahankan; tidak dibuat tabel transaksi terpisah).

## 3) Isi variabel environment
Salin `.env.example` menjadi `.env.local` (atau `.env`) dan isi placeholder:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
```
- `.env`/`.env.local` diabaikan git. Jangan commit secret/service_role key.
- Service role key (jika diperlukan untuk tugas admin server-side) hanya disimpan di environment server yang aman, **bukan** `NEXT_PUBLIC_*`.

## 4) Autentikasi & akun petugas (penting)
- **Mahasiswa**: daftar lewat aplikasi (NIM + kata sandi). Profil dibuat `role=mahasiswa` (default). Pengguna tidak bisa mengubah role sendiri (RLS/trigger/constraint).
- **Login mahasiswa (NIM + kata sandi)**: Supabase Auth memakai email internal sintetis yang dibuat dari hash SHA-256 NIM. NIM tetap menjadi identitas yang dimasukkan pengguna; kata sandi tidak disimpan di profil atau localStorage. Akun lama masih bisa masuk memakai alias lama.
- **Petugas tunggal**: hanya `hherawatii083@gmail.com` yang dapat memiliki role petugas. Buat akun di **Authentication -> Users**, atur kata sandinya di Supabase, lalu jalankan `supabase/repair_staff_registration.sql` melalui SQL Editor untuk menautkan profilnya. Database menolak profil petugas kedua.
- **Pendaftaran mahasiswa**: nama dan NIM wajib diisi tanpa batas karakter buatan pada form atau kolom profil. NIM tetap unik supaya login dan identitas mahasiswa tidak tertukar. Supabase Auth masih memberlakukan batas frekuensi permintaan sesuai pengaturan project.
- **Konfirmasi email**: jika opsi konfirmasi email Auth aktif, sesuaikan untuk alur ini agar login setelah daftar berjalan sesuai kebutuhan project.

## 5) Jalankan aplikasi
```bash
npm install
npm run dev
```

## 6) Keputusan desain & catatan
- **Sumber data tunggal**: `src/lib/store.tsx` membaca/menulis inventaris & pengajuan ke Supabase (bukan localStorage). localStorage tidak lagi menyimpan data/sesi/akun/password/hash/salt.
- **Aturan bisnis**: validasi tetap memakai `src/lib/inventory.ts` (tanggal, jumlah, batas 30 hari, dll). Penyerahan & pengembalian (dan transisi setujui/tolak) dijalankan **atomik** via RPC (`handover_request`, `return_request`, `approve_request`, `reject_request`) untuk mencegah stok berubah parsial/negatif/melebihi stok.
- **Status/stok**: Menunggu/Disetujui tidak mengurangi stok; penyerahan memindahkan tersedia -> borrowed; pengembalian baik mengurangi borrowed, unit rusak mengurangi borrowed dan menambah damaged.
- **RLS**: aktif di semua tabel. Anon hanya baca `inventory_items` aktif. Mahasiswa hanya baca/buat (Menunggu, milik sendiri)/batalkan (Menunggu milik sendiri) pengajuannya. Petugas kelola inventaris & proses pengajuan (mutasi terkontrol via RPC). Helper role `SECURITY DEFINER` non-rekursif (tanpa rekursi). Mahasiswa tidak dapat mengubah role/menyetujui/menolak/menyerahkan/mengembalikan.
- **Pengarsipan**: barang bereferensi riwayat tidak dihapus permanen, melainkan `is_active=false` (arsip) agar riwayat terjaga; pengajuan Menunggu/Disetujui terkait ditolak saat arsip/hapus.
- **Drizzle**: tidak lagi menjadi jalur data aplikasi (diganti Supabase client + RPC agar tidak tumpang tindih). `src/db/*` & `drizzle.config.json` dibiarkan legacy/non-aktif (client dibuat lazy agar tidak crash tanpa `DATABASE_URL`); `api/health` memakai Supabase. Gunakan Supabase secara konsisten.
- **Keamanan**: tidak ada service_role key di browser/repo. `.env.example` hanya placeholder.
