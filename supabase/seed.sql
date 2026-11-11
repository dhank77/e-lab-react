-- Data contoh lab & barang. Jalankan setelah schema.sql (opsional).

insert into public.labs (id, name, location, description) values
  ('11111111-1111-1111-1111-111111111111', 'Lab Rekayasa Perangkat Lunak', 'Gedung A Lt. 2', 'Lab untuk praktikum pemrograman dan rekayasa web.'),
  ('22222222-2222-2222-2222-222222222222', 'Lab Jaringan Komputer', 'Gedung A Lt. 3', 'Lab untuk praktikum jaringan dan keamanan.'),
  ('33333333-3333-3333-3333-333333333333', 'Lab Elektronika & IoT', 'Gedung B Lt. 1', 'Lab mikrokontroler, sensor, dan Internet of Things.')
on conflict (id) do nothing;

insert into public.items (lab_id, name, code, description, quantity_total, quantity_available, condition) values
  ('11111111-1111-1111-1111-111111111111', 'Laptop Lenovo ThinkPad', 'RPL-LPT-01', 'Core i5, RAM 16GB', 10, 10, 'baik'),
  ('11111111-1111-1111-1111-111111111111', 'Proyektor Epson', 'RPL-PRJ-01', 'Proyektor ruang kelas', 2, 2, 'baik'),
  ('11111111-1111-1111-1111-111111111111', 'Kabel HDMI 3m', 'RPL-HDM-01', null, 8, 8, 'baik'),
  ('22222222-2222-2222-2222-222222222222', 'Router Mikrotik hAP', 'JAR-RTR-01', 'Untuk praktikum routing', 6, 6, 'baik'),
  ('22222222-2222-2222-2222-222222222222', 'Switch Cisco 24 Port', 'JAR-SWT-01', null, 3, 3, 'rusak_ringan'),
  ('22222222-2222-2222-2222-222222222222', 'Crimping Tool RJ45', 'JAR-CRM-01', null, 12, 12, 'baik'),
  ('33333333-3333-3333-3333-333333333333', 'Arduino Uno R3', 'IOT-ARD-01', null, 20, 20, 'baik'),
  ('33333333-3333-3333-3333-333333333333', 'Raspberry Pi 4 (4GB)', 'IOT-RPI-01', null, 5, 5, 'baik'),
  ('33333333-3333-3333-3333-333333333333', 'Multimeter Digital', 'IOT-MLT-01', null, 7, 7, 'baik')
on conflict (code) do nothing;

-- Jadikan akun Anda admin (ganti email):
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'email-anda@example.com');
