export type Role = "mahasiswa" | "petugas";

export type Session = {
  role: Role;
  name: string;
  userId: string; // profiles/auth user id (uuid)
  /** Diisi untuk mahasiswa yang masuk dengan akun terdaftar. */
  nim?: string;
};

/** @deprecated Akun mahasiswa kini dikelola Supabase Auth; jangan simpan password/hash di profil/localStorage. */
export type StudentAccount = {
  nim: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
};

export type Condition = "Baik" | "Rusak" | "Campuran";

export const CONDITIONS: Condition[] = ["Baik", "Rusak", "Campuran"];

export type RequestStatus =
  | "Menunggu"
  | "Disetujui"
  | "Ditolak"
  | "Sedang Dipinjam"
  | "Selesai"
  | "Dibatalkan";

export const REQUEST_STATUSES: RequestStatus[] = [
  "Menunggu",
  "Disetujui",
  "Sedang Dipinjam",
  "Selesai",
  "Ditolak",
  "Dibatalkan",
];

/** Barang inventaris. Jumlah tersedia dan kondisi dihitung dari tiga angka ini. */
export type Item = {
  id: string;
  name: string;
  category: string;
  description: string;
  total: number;
  damaged: number;
  borrowed: number;
  isActive?: boolean;
};

export type BorrowRequest = {
  id: string;
  studentId: string;
  studentName: string;
  itemId: string;
  itemName: string;
  quantity: number;
  borrowDate: string;
  dueDate: string;
  purpose: string;
  status: RequestStatus;
  createdAt: string;
  decidedAt?: string;
  rejectReason?: string;
  handedOverAt?: string;
  returnedAt?: string;
  returnedGood?: number;
  returnedDamaged?: number;
  returnNote?: string;
};

export type AppData = {
  version: 1;
  items: Item[];
  requests: BorrowRequest[];
};
