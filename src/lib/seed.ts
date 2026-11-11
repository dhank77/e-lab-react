import { addDays } from "./date";
import type { AppData, BorrowRequest, Item } from "./types";

/** [nama, kategori, jumlah (tersedia = total awal), keterangan] */
const BASE_ITEMS: Array<[string, string, number, string]> = [
  ["Sensor DHT22", "Sensor", 8, "Sensor suhu dan kelembapan digital untuk praktikum IoT dan monitoring lingkungan."],
  ["Sensor Ultrasonik HC-SR04", "Sensor", 10, "Sensor pengukur jarak berbasis gelombang ultrasonik, jangkauan 2–400 cm."],
  ["Sensor Gas MQ-2", "Sensor", 6, "Sensor deteksi gas mudah terbakar dan asap."],
  ["ESP32 DevKit V1", "Mikrokontroler", 12, "Papan pengembangan ESP32 dengan Wi-Fi dan Bluetooth."],
  ["Headset VR Meta Quest 2", "Perangkat VR", 2, "Headset realitas virtual untuk praktikum multimedia dan simulasi."],
  ["Spidol papan tulis", "Alat Tulis", 15, "Spidol papan tulis berbagai warna untuk kegiatan kelas."],
  ["Baterai AA", "Catu Daya", 24, "Baterai AA untuk perangkat praktikum portabel."],
  ["Multimeter digital DT830B", "Alat Ukur", 6, "Multimeter digital untuk mengukur tegangan, arus, dan hambatan."],
  ["Breadboard 830 titik", "Prototyping", 10, "Papan rangkaian tanpa solder dengan 830 titik koneksi."],
  ["Kabel jumper set", "Kabel & Aksesori", 15, "Satu set kabel jumper male-male, male-female, dan female-female."],
  ["LED 5 mm", "Komponen Elektronik", 50, "LED 5 mm berbagai warna."],
  ["Resistor kit", "Komponen Elektronik", 10, "Kit resistor berbagai nilai hambatan."],
  ["Solder listrik", "Perkakas", 4, "Solder listrik untuk penyambungan komponen elektronik."],
  ["Kabel USB Type-C", "Kabel & Aksesori", 12, "Kabel data dan pengisi daya USB Type-C."],
  ["Tang potong elektronik", "Perkakas", 5, "Tang potong presisi untuk kaki komponen dan kabel kecil."],
];

export function createSeedData(today: string): AppData {
  const items: Item[] = BASE_ITEMS.map(([name, category, qty, description], i) => ({
    id: `brg-${String(i + 1).padStart(2, "0")}`,
    name,
    category,
    description,
    total: qty,
    damaged: 0,
    borrowed: 0,
  }));

  const find = (name: string) => {
    const item = items.find((i) => i.name === name);
    if (!item) throw new Error(`Data awal tidak lengkap: ${name}`);
    return item;
  };

  const mk = (
    n: number,
    studentName: string,
    itemName: string,
    quantity: number,
    rest: Partial<BorrowRequest> &
      Pick<BorrowRequest, "borrowDate" | "dueDate" | "status" | "createdAt" | "purpose">,
  ): BorrowRequest => ({
    id: `req-${String(n).padStart(3, "0")}`,
    studentId: studentName.toLowerCase().replace(/\s+/g, "-"),
    studentName,
    itemId: find(itemName).id,
    itemName,
    quantity,
    ...rest,
  });

  // Urutan: terbaru di atas.
  const requests: BorrowRequest[] = [
    mk(1, "Budi Santoso", "ESP32 DevKit V1", 2, {
      purpose: "Praktikum Internet of Things modul 3",
      borrowDate: addDays(today, 1),
      dueDate: addDays(today, 8),
      status: "Menunggu",
      createdAt: today,
    }),
    mk(2, "Dewi Lestari", "Multimeter digital DT830B", 1, {
      purpose: "Pengukuran rangkaian untuk tugas Elektronika Dasar",
      borrowDate: addDays(today, 1),
      dueDate: addDays(today, 3),
      status: "Menunggu",
      createdAt: addDays(today, -1),
    }),
    mk(3, "Andi Pratama", "Sensor DHT22", 2, {
      purpose: "Proyek monitoring suhu ruang",
      borrowDate: addDays(today, 1),
      dueDate: addDays(today, 8),
      status: "Disetujui",
      createdAt: addDays(today, -1),
      decidedAt: today,
    }),
    mk(4, "Andi Pratama", "Headset VR Meta Quest 2", 1, {
      purpose: "Uji coba aplikasi VR",
      borrowDate: addDays(today, -1),
      dueDate: addDays(today, 2),
      status: "Ditolak",
      createdAt: addDays(today, -3),
      decidedAt: addDays(today, -2),
      rejectReason: "Perangkat dijadwalkan untuk praktikum kelas lain pada tanggal tersebut.",
    }),
    mk(5, "Andi Pratama", "Breadboard 830 titik", 2, {
      purpose: "Merakit rangkaian lampu lalu lintas",
      borrowDate: addDays(today, -10),
      dueDate: addDays(today, -5),
      status: "Selesai",
      createdAt: addDays(today, -12),
      decidedAt: addDays(today, -11),
      handedOverAt: addDays(today, -10),
      returnedAt: addDays(today, -6),
      returnedGood: 2,
      returnedDamaged: 0,
    }),
    mk(6, "Rina Wulandari", "Kabel jumper set", 3, {
      purpose: "Praktikum mikrokontroler",
      borrowDate: addDays(today, -7),
      dueDate: addDays(today, -3),
      status: "Selesai",
      createdAt: addDays(today, -9),
      decidedAt: addDays(today, -8),
      handedOverAt: addDays(today, -7),
      returnedAt: addDays(today, -4),
      returnedGood: 3,
      returnedDamaged: 0,
    }),
  ];

  return { version: 1, items, requests };
}
