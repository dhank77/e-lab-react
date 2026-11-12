-- Seed data: 15 barang dari src/lib/seed.ts
-- Jalankan di Supabase SQL Editor setelah schema.sql.
-- Untuk data awal: damaged = 0, borrowed = 0, is_active = true.
-- Tidak memasukkan akun atau pengajuan contoh.

insert into public.inventory_items (name, category, description, total, damaged, borrowed, is_active)
values
  ('Sensor DHT22', 'Sensor', 'Sensor suhu dan kelembapan digital untuk praktikum IoT dan monitoring lingkungan.', 8, 0, 0, true),
  ('Sensor Ultrasonik HC-SR04', 'Sensor', 'Sensor pengukur jarak berbasis gelombang ultrasonik, jangkauan 2–400 cm.', 10, 0, 0, true),
  ('Sensor Gas MQ-2', 'Sensor', 'Sensor deteksi gas mudah terbakar dan asap.', 6, 0, 0, true),
  ('ESP32 DevKit V1', 'Mikrokontroler', 'Papan pengembangan ESP32 dengan Wi-Fi dan Bluetooth.', 12, 0, 0, true),
  ('Headset VR Meta Quest 2', 'Perangkat VR', 'Headset realitas virtual untuk praktikum multimedia dan simulasi.', 2, 0, 0, true),
  ('Spidol papan tulis', 'Alat Tulis', 'Spidol papan tulis berbagai warna untuk kegiatan kelas.', 15, 0, 0, true),
  ('Baterai AA', 'Catu Daya', 'Baterai AA untuk perangkat praktikum portabel.', 24, 0, 0, true),
  ('Multimeter digital DT830B', 'Alat Ukur', 'Multimeter digital untuk mengukur tegangan, arus, dan hambatan.', 6, 0, 0, true),
  ('Breadboard 830 titik', 'Prototyping', 'Papan rangkaian tanpa solder dengan 830 titik koneksi.', 10, 0, 0, true),
  ('Kabel jumper set', 'Kabel & Aksesori', 'Satu set kabel jumper male-male, male-female, dan female-female.', 15, 0, 0, true),
  ('LED 5 mm', 'Komponen Elektronik', 'LED 5 mm berbagai warna.', 50, 0, 0, true),
  ('Resistor kit', 'Komponen Elektronik', 'Kit resistor berbagai nilai hambatan.', 10, 0, 0, true),
  ('Solder listrik', 'Perkakas', 'Solder listrik untuk penyambungan komponen elektronik.', 4, 0, 0, true),
  ('Kabel USB Type-C', 'Kabel & Aksesori', 'Kabel data dan pengisi daya USB Type-C.', 12, 0, 0, true),
  ('Tang potong elektronik', 'Perkakas', 'Tang potong presisi untuk kaki komponen dan kabel kecil.', 5, 0, 0, true)
on conflict do nothing;
