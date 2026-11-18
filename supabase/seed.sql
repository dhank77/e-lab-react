-- Seed data: inventory items dengan lab dan komponen Lab Internet dan Jaringan Komputer.
-- Jalankan di Supabase SQL Editor setelah schema.sql.
-- Untuk data awal: damaged = 0, borrowed = 0, is_active = true.
-- Tidak memasukkan akun atau pengajuan contoh.

insert into public.inventory_items (name, category, lab, description, total, damaged, borrowed, is_active)
values
  -- Lab Parallel Computing and IoT
  ('Sensor DHT22', 'Sensor', 'Lab Parallel Computing and IoT', 'Sensor suhu dan kelembapan digital untuk praktikum IoT dan monitoring lingkungan.', 8, 0, 0, true),
  ('Sensor Ultrasonik HC-SR04', 'Sensor', 'Lab Parallel Computing and IoT', 'Sensor pengukur jarak berbasis gelombang ultrasonik, jangkauan 2–400 cm.', 10, 0, 0, true),
  ('Sensor Gas MQ-2', 'Sensor', 'Lab Parallel Computing and IoT', 'Sensor deteksi gas mudah terbakar dan asap.', 6, 0, 0, true),
  ('ESP32 DevKit V1', 'Mikrokontroler', 'Lab Parallel Computing and IoT', 'Papan pengembangan ESP32 dengan Wi-Fi dan Bluetooth.', 12, 0, 0, true),

  -- Lab Internet dan Jaringan Komputer
  ('CPU Armaggeddon Nimitz TR M1930 8000 ATX', 'CPU', 'Lab Internet dan Jaringan Komputer', 'CPU desktop untuk praktikum jaringan komputer.', 2, 0, 0, true),
  ('CPU Samsung', 'CPU', 'Lab Internet dan Jaringan Komputer', 'CPU Samsung untuk praktikum jaringan komputer.', 2, 0, 0, true),
  ('Server Lenovo System X 3520', 'Server', 'Lab Internet dan Jaringan Komputer', 'Server Lenovo System X 3520 untuk praktikum server.', 1, 0, 0, true),
  ('Router Wi-Fi Aruba', 'Router', 'Lab Internet dan Jaringan Komputer', 'Router Wi-Fi Aruba untuk praktikum jaringan nirkabel.', 1, 0, 0, true),
  ('Router Cisco', 'Router', 'Lab Internet dan Jaringan Komputer', 'Router Cisco untuk praktikum routing.', 1, 0, 0, true),
  ('Router Cisco Linksys E1000', 'Router', 'Lab Internet dan Jaringan Komputer', 'Router Cisco Linksys E1000 untuk praktikum jaringan.', 1, 0, 0, true),
  ('Switch Cisco L2 DES-1008A', 'Switch', 'Lab Internet dan Jaringan Komputer', 'Switch Cisco L2 DES-1008A untuk praktikum switching.', 1, 0, 0, true),
  ('Switch Cisco L2 MD3820I Catalyst 2950', 'Switch', 'Lab Internet dan Jaringan Komputer', 'Switch Cisco L2 Catalyst 2950 untuk praktikum switching.', 1, 0, 0, true),
  ('Maxhub Camera', 'Kamera', 'Lab Internet dan Jaringan Komputer', 'Kamera Maxhub untuk konferensi dan monitoring.', 1, 0, 0, true),
  ('Kabel LAN Prolink CAT6E UTP', 'Kabel & Aksesori', 'Lab Internet dan Jaringan Komputer', 'Kabel LAN Prolink CAT6E UTP untuk pemasangan jaringan.', 20, 0, 0, true),
  ('Monitor Dell UltraSharp 1702FP', 'Monitor', 'Lab Internet dan Jaringan Komputer', 'Monitor Dell UltraSharp 1702FP untuk workstation.', 2, 0, 0, true),
  ('Monitor LG Plasma 42PA4500', 'Monitor', 'Lab Internet dan Jaringan Komputer', 'Monitor LG Plasma 42 inch untuk tampilan besar.', 1, 0, 0, true),
  ('Keyboard dan Mouse Logitech MK545', 'Periferal', 'Lab Internet dan Jaringan Komputer', 'Keyboard dan Mouse Logitech MK545 untuk workstation.', 2, 0, 0, true),
  ('Mikrotik Routerboard RB4011iGS + RM', 'Router', 'Lab Internet dan Jaringan Komputer', 'Mikrotik Routerboard RB4011iGS dengan manajemen rack.', 1, 0, 0, true),
  ('Nvidia Jetson Mini PC AGX Orin 32GB H01', 'Mini PC', 'Lab Internet dan Jaringan Komputer', 'Nvidia Jetson AGX Orin 32GB untuk AI dan edge computing.', 1, 0, 0, true),
  ('Kabel Serial RS232 to LAN RJ45', 'Kabel & Aksesori', 'Lab Internet dan Jaringan Komputer', 'Kabel serial RS232 ke LAN RJ45 untuk konversi antarmuka.', 5, 0, 0, true),
  ('Commscope Connector RJ45 CAT6', 'Kabel & Aksesori', 'Lab Internet dan Jaringan Komputer', 'Connector RJ45 CAT6 Commscope untuk terminasi kabel jaringan.', 50, 0, 0, true),
  ('Webcam Logitech C270', 'Kamera', 'Lab Internet dan Jaringan Komputer', 'Webcam Logitech C270 untuk video konferensi.', 1, 0, 0, true),
  ('Video Conferencing System Sharp Polycom VSX 7000', 'Sistem Konferensi', 'Lab Internet dan Jaringan Komputer', 'Sistem video conferencing Sharp Polycom VSX 7000.', 1, 0, 0, true),
  ('Smartboard Maxhub IFPD Education U Series 86 inci', 'Smartboard', 'Lab Internet dan Jaringan Komputer', 'Smartboard Maxhub 86 inci untuk pembelajaran interaktif.', 1, 0, 0, true),
  ('Power Supply APC', 'Catu Daya', 'Lab Internet dan Jaringan Komputer', 'Power Supply APC untuk perlengkapan daya.', 2, 0, 0, true),
  ('Virtual Reality Meta Quest 3 512GB', 'Perangkat VR', 'Lab Internet dan Jaringan Komputer', 'VR Meta Quest 3 512GB untuk simulasi dan immersive.', 1, 0, 0, true),
  ('CPU Acer', 'CPU', 'Lab Internet dan Jaringan Komputer', 'CPU Acer untuk workstation.', 2, 0, 0, true),
  ('Server E740', 'Server', 'Lab Internet dan Jaringan Komputer', 'Server E740 untuk praktikum server.', 1, 0, 0, true),
  ('UPS Prolink', 'UPS', 'Lab Internet dan Jaringan Komputer', 'UPS Prolink untuk cadangan daya.', 2, 0, 0, true),
  ('Router Wi-Fi Cisco', 'Router', 'Lab Internet dan Jaringan Komputer', 'Router Wi-Fi Cisco untuk jaringan nirkabel.', 1, 0, 0, true),
  ('Router 1841', 'Router', 'Lab Internet dan Jaringan Komputer', 'Router Cisco 1841 untuk praktikum routing.', 1, 0, 0, true),
  ('Router TP-Link TL-WR1043N', 'Router', 'Lab Internet dan Jaringan Komputer', 'Router TP-Link TL-WR1043N untuk praktikum jaringan.', 1, 0, 0, true),
  ('Switch', 'Switch', 'Lab Internet dan Jaringan Komputer', 'Switch untuk praktikum switching.', 1, 0, 0, true),
  ('Switch Dell Server', 'Switch', 'Lab Internet dan Jaringan Komputer', 'Switch Dell Server untuk infrastruktur.', 1, 0, 0, true),
  ('Maxhub Stand', 'Aksesori', 'Lab Internet dan Jaringan Komputer', 'Stand Maxhub untuk smartboard.', 1, 0, 0, true),
  ('Monitor ThinkVision S24E 23,8 inci', 'Monitor', 'Lab Internet dan Jaringan Komputer', 'Monitor ThinkVision 23,8 inci untuk workstation.', 2, 0, 0, true),
  ('Monitor Sharp', 'Monitor', 'Lab Internet dan Jaringan Komputer', 'Monitor Sharp untuk workstation.', 1, 0, 0, true),
  ('Desktop PC i9 13900K / RTX A2000 / 32GB / 2 × 1TB SSD', 'Desktop PC', 'Lab Internet dan Jaringan Komputer', 'Desktop PC spesifikasi tinggi untuk praktikum komputasi.', 1, 0, 0, true),
  ('Raspberry Pi 5 Model B + 32GB', 'Mini PC', 'Lab Internet dan Jaringan Komputer', 'Raspberry Pi 5 Model B dengan 32GB untuk proyek embedded.', 2, 0, 0, true),
  ('Aten USB to RS-232 Converter UC232A', 'Converter', 'Lab Internet dan Jaringan Komputer', 'Converter USB ke RS-232 Aten UC232A.', 2, 0, 0, true),
  ('ThinkSystem SR650V2 CAT 6', 'Server', 'Lab Internet dan Jaringan Komputer', 'Server ThinkSystem SR650V2 untuk infrastruktur.', 1, 0, 0, true),
  ('Ndorack + Logo OR32 Open Rack 32U', 'Rack', 'Lab Internet dan Jaringan Komputer', 'Rack terbuka 32U untuk penyimpanan perangkat jaringan.', 1, 0, 0, true),
  ('Power Supply SMART', 'Catu Daya', 'Lab Internet dan Jaringan Komputer', 'Power Supply SMART untuk perlengkapan daya.', 2, 0, 0, true),
  ('Power Over Microsemi', 'Catu Daya', 'Lab Internet dan Jaringan Komputer', 'Power Over Microsemi untuk PoE.', 2, 0, 0, true),
  ('Mikrotik Cloud Switch CRS326-24GB-2S+RM', 'Switch', 'Lab Internet dan Jaringan Komputer', 'Mikrotik Cloud Switch CRS326-24GB-2S+RM untuk switching manajemen.', 1, 0, 0, true),

  -- Lab Cloud Computing and Information System
  ('Headset VR Meta Quest 2', 'Perangkat VR', 'Lab Cloud Computing and Information System', 'Headset realitas virtual untuk praktikum multimedia dan simulasi.', 2, 0, 0, true),

  -- Lab Animasi dan Multimedia
  ('Spidol papan tulis', 'Alat Tulis', 'Lab Animasi dan Multimedia', 'Spidol papan tulis berbagai warna untuk kegiatan kelas.', 15, 0, 0, true),

  -- Lab Komputer / Computer Based System (umum)
  ('Baterai AA', 'Catu Daya', 'Lab Komputer', 'Baterai AA untuk perangkat praktikum portabel.', 24, 0, 0, true),
  ('Multimeter digital DT830B', 'Alat Ukur', 'Lab Komputer', 'Multimeter digital untuk mengukur tegangan, arus, dan hambatan.', 6, 0, 0, true),
  ('Breadboard 830 titik', 'Prototyping', 'Lab Komputer', 'Papan rangkaian tanpa solder dengan 830 titik koneksi.', 10, 0, 0, true),
  ('Kabel jumper set', 'Kabel & Aksesori', 'Lab Komputer', 'Satu set kabel jumper male-male, male-female, dan female-female.', 15, 0, 0, true),
  ('LED 5 mm', 'Komponen Elektronik', 'Lab Komputer', 'LED 5 mm berbagai warna.', 50, 0, 0, true),
  ('Resistor kit', 'Komponen Elektronik', 'Lab Komputer', 'Kit resistor berbagai nilai hambatan.', 10, 0, 0, true),
  ('Solder listrik', 'Perkakas', 'Lab Komputer', 'Solder listrik untuk penyambungan komponen elektronik.', 4, 0, 0, true),
  ('Kabel USB Type-C', 'Kabel & Aksesori', 'Lab Komputer', 'Kabel data dan pengisi daya USB Type-C.', 12, 0, 0, true),
  ('Tang potong elektronik', 'Perkakas', 'Lab Komputer', 'Tang potong presisi untuk kaki komponen dan kabel kecil.', 5, 0, 0, true)
on conflict do nothing;
