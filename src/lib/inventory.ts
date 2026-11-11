import { addDays } from "./date";
import type {
  AppData,
  BorrowRequest,
  Condition,
  Item,
  RequestStatus,
  Session,
} from "./types";

/* ------------------------------------------------------------------ */
/* Hasil operasi                                                       */
/* ------------------------------------------------------------------ */

export type Result =
  | { ok: true; data: AppData; message: string }
  | { ok: false; message: string };

const fail = (message: string): Result => ({ ok: false, message });
const done = (data: AppData, message: string): Result => ({ ok: true, data, message });

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/* ------------------------------------------------------------------ */
/* Turunan stok                                                        */
/* ------------------------------------------------------------------ */

type StockFields = Pick<Item, "total" | "damaged" | "borrowed">;

/** Tersedia = total − rusak − sedang dipinjam (tidak pernah negatif). */
export function getAvailable(item: StockFields): number {
  return Math.max(0, item.total - item.damaged - item.borrowed);
}

/** Kondisi diturunkan dari jumlah unit agar selalu konsisten dengan stok. */
export function getCondition(item: Pick<Item, "total" | "damaged">): Condition {
  if (item.damaged <= 0) return "Baik";
  if (item.damaged >= item.total) return "Rusak";
  return "Campuran";
}

export function getSummary(items: Item[], requests: BorrowRequest[]) {
  let available = 0;
  let damaged = 0;
  let borrowed = 0;
  let total = 0;
  for (const i of items) {
    available += getAvailable(i);
    damaged += i.damaged;
    borrowed += i.borrowed;
    total += i.total;
  }
  const count = (s: RequestStatus) => requests.filter((r) => r.status === s).length;
  return {
    itemTypes: items.length,
    available,
    damaged,
    borrowed,
    total,
    pending: count("Menunggu"),
    approved: count("Disetujui"),
    active: count("Sedang Dipinjam"),
  };
}

export function isOverdue(request: BorrowRequest, today: string): boolean {
  return request.status === "Sedang Dipinjam" && request.dueDate < today;
}

/* ------------------------------------------------------------------ */
/* Validasi                                                            */
/* ------------------------------------------------------------------ */

export function parseIntStrict(value: string): number | null {
  const t = value.trim();
  return /^\d+$/.test(t) ? Number(t) : null;
}

const clean = (s: string) => s.trim().replace(/\s+/g, " ");

export type ItemFormValues = {
  name: string;
  category: string;
  description: string;
  total: string;
  damaged: string;
};
export type ItemErrors = Partial<Record<keyof ItemFormValues, string>>;
type ItemParsed = {
  name: string;
  category: string;
  description: string;
  total: number;
  damaged: number;
};

export function validateItem(
  values: ItemFormValues,
  items: Item[],
  editing?: Item,
): { errors: ItemErrors; parsed: ItemParsed | null } {
  const errors: ItemErrors = {};
  const name = clean(values.name);
  const category = clean(values.category);
  const description = values.description.trim();

  if (!name) errors.name = "Nama barang wajib diisi.";
  else if (name.length < 3) errors.name = "Nama barang minimal 3 karakter.";
  else if (name.length > 80) errors.name = "Nama barang maksimal 80 karakter.";
  else if (
    items.some((i) => i.id !== editing?.id && i.name.toLowerCase() === name.toLowerCase())
  ) {
    errors.name = "Nama barang sudah ada di inventaris.";
  }

  if (!category) errors.category = "Kategori wajib diisi.";
  else if (category.length > 40) errors.category = "Kategori maksimal 40 karakter.";

  if (description.length > 200) errors.description = "Keterangan maksimal 200 karakter.";

  const borrowed = editing?.borrowed ?? 0;
  const total = parseIntStrict(values.total);
  const damaged = parseIntStrict(values.damaged);

  if (!values.total.trim()) errors.total = "Jumlah total wajib diisi.";
  else if (total === null) errors.total = "Masukkan bilangan bulat, tanpa minus atau desimal.";
  else if (total < 1) errors.total = "Jumlah total minimal 1 unit.";
  else if (total > 100000) errors.total = "Jumlah total terlalu besar (maksimal 100.000).";

  if (!values.damaged.trim()) errors.damaged = "Jumlah rusak wajib diisi (isi 0 jika tidak ada).";
  else if (damaged === null) errors.damaged = "Masukkan bilangan bulat, tanpa minus atau desimal.";

  if (
    !errors.total &&
    !errors.damaged &&
    total !== null &&
    damaged !== null &&
    damaged + borrowed > total
  ) {
    errors.damaged =
      borrowed > 0
        ? `Unit rusak ditambah unit sedang dipinjam (${borrowed}) melebihi jumlah total.`
        : "Jumlah rusak tidak boleh melebihi jumlah total.";
  }

  if (Object.keys(errors).length > 0 || total === null || damaged === null) {
    return { errors, parsed: null };
  }
  return { errors, parsed: { name, category, description, total, damaged } };
}

export type RequestFormValues = {
  itemId: string;
  quantity: string;
  borrowDate: string;
  dueDate: string;
  purpose: string;
};
export type RequestErrors = Partial<Record<keyof RequestFormValues, string>>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_LOAN_DAYS = 30;

export function validateRequest(
  values: RequestFormValues,
  items: Item[],
  today: string,
): {
  errors: RequestErrors;
  parsed: { item: Item; quantity: number; purpose: string } | null;
} {
  const errors: RequestErrors = {};
  const item = items.find((i) => i.id === values.itemId);
  const available = item ? getAvailable(item) : 0;

  if (!values.itemId) errors.itemId = "Pilih barang yang akan dipinjam.";
  else if (!item) errors.itemId = "Barang tidak ditemukan.";
  else if (available <= 0) errors.itemId = "Stok barang ini sedang habis.";

  const qty = parseIntStrict(values.quantity);
  if (!values.quantity.trim()) errors.quantity = "Jumlah pinjam wajib diisi.";
  else if (qty === null) errors.quantity = "Masukkan bilangan bulat, tanpa minus atau desimal.";
  else if (qty < 1) errors.quantity = "Jumlah pinjam minimal 1 unit.";
  else if (item && available > 0 && qty > available) {
    errors.quantity = `Jumlah melebihi stok tersedia (${available} unit).`;
  }

  if (!DATE_RE.test(values.borrowDate)) errors.borrowDate = "Tanggal pinjam wajib diisi.";
  else if (values.borrowDate < today) errors.borrowDate = "Tanggal pinjam tidak boleh sebelum hari ini.";

  if (!DATE_RE.test(values.dueDate)) errors.dueDate = "Tanggal rencana kembali wajib diisi.";
  else if (!errors.borrowDate && values.dueDate < values.borrowDate) {
    errors.dueDate = "Tanggal kembali tidak boleh sebelum tanggal pinjam.";
  } else if (!errors.borrowDate && values.dueDate > addDays(values.borrowDate, MAX_LOAN_DAYS)) {
    errors.dueDate = `Masa pinjam maksimal ${MAX_LOAN_DAYS} hari.`;
  }

  const purpose = values.purpose.trim();
  if (purpose.length > 200) errors.purpose = "Keperluan maksimal 200 karakter.";

  if (Object.keys(errors).length > 0 || !item || qty === null) {
    return { errors, parsed: null };
  }
  return { errors, parsed: { item, quantity: qty, purpose } };
}

/* ------------------------------------------------------------------ */
/* Operasi data barang                                                 */
/* ------------------------------------------------------------------ */

export function addItem(data: AppData, values: ItemFormValues): Result {
  const { parsed } = validateItem(values, data.items);
  if (!parsed) return fail("Data barang belum valid. Periksa kembali isian formulir.");
  const item: Item = {
    id: newId("brg"),
    name: parsed.name,
    category: parsed.category,
    description: parsed.description,
    total: parsed.total,
    damaged: parsed.damaged,
    borrowed: 0,
  };
  return done({ ...data, items: [...data.items, item] }, `Barang "${item.name}" berhasil ditambahkan.`);
}

export function updateItem(data: AppData, id: string, values: ItemFormValues): Result {
  const current = data.items.find((i) => i.id === id);
  if (!current) return fail("Barang tidak ditemukan. Mungkin sudah dihapus.");
  const { parsed } = validateItem(values, data.items, current);
  if (!parsed) return fail("Data barang belum valid. Periksa kembali isian formulir.");
  const items = data.items.map((i) =>
    i.id === id
      ? {
          ...i,
          name: parsed.name,
          category: parsed.category,
          description: parsed.description,
          total: parsed.total,
          damaged: parsed.damaged,
        }
      : i,
  );
  const requests = data.requests.map((r) =>
    r.itemId === id ? { ...r, itemName: parsed.name } : r,
  );
  return done({ ...data, items, requests }, `Barang "${parsed.name}" berhasil diperbarui.`);
}

export function deleteItem(data: AppData, id: string, today: string): Result {
  const item = data.items.find((i) => i.id === id);
  if (!item) return fail("Barang tidak ditemukan. Mungkin sudah dihapus.");
  if (item.borrowed > 0) {
    return fail(
      `"${item.name}" tidak dapat dihapus karena ${item.borrowed} unit masih dipinjam. Catat pengembaliannya terlebih dahulu.`,
    );
  }
  const requests = data.requests.map((r) =>
    r.itemId === id && (r.status === "Menunggu" || r.status === "Disetujui")
      ? {
          ...r,
          status: "Ditolak" as const,
          decidedAt: today,
          rejectReason: "Barang dihapus dari inventaris.",
        }
      : r,
  );
  return done(
    { ...data, items: data.items.filter((i) => i.id !== id), requests },
    `Barang "${item.name}" berhasil dihapus.`,
  );
}

export function markDamaged(data: AppData, id: string, units: number): Result {
  const item = data.items.find((i) => i.id === id);
  if (!item) return fail("Barang tidak ditemukan.");
  if (!Number.isInteger(units) || units < 1) return fail("Jumlah unit harus berupa bilangan bulat minimal 1.");
  const available = getAvailable(item);
  if (units > available) {
    return fail(`Hanya ${available} unit tersedia yang dapat dicatat rusak.`);
  }
  const items = data.items.map((i) => (i.id === id ? { ...i, damaged: i.damaged + units } : i));
  return done({ ...data, items }, `${units} unit "${item.name}" dicatat rusak.`);
}

export function markRepaired(data: AppData, id: string, units: number): Result {
  const item = data.items.find((i) => i.id === id);
  if (!item) return fail("Barang tidak ditemukan.");
  if (!Number.isInteger(units) || units < 1) return fail("Jumlah unit harus berupa bilangan bulat minimal 1.");
  if (units > item.damaged) {
    return fail(`Hanya ${item.damaged} unit rusak yang dapat dicatat telah diperbaiki.`);
  }
  const items = data.items.map((i) => (i.id === id ? { ...i, damaged: i.damaged - units } : i));
  return done({ ...data, items }, `${units} unit "${item.name}" dicatat telah diperbaiki dan kembali tersedia.`);
}

/* ------------------------------------------------------------------ */
/* Operasi pengajuan                                                   */
/* ------------------------------------------------------------------ */

function patchRequest(
  data: AppData,
  id: string,
  patch: Partial<BorrowRequest>,
  items: Item[] = data.items,
): AppData {
  return {
    ...data,
    items,
    requests: data.requests.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  };
}

export function submitRequest(
  data: AppData,
  session: Session,
  values: RequestFormValues,
  today: string,
): Result {
  const { parsed } = validateRequest(values, data.items, today);
  if (!parsed) return fail("Pengajuan belum valid. Periksa kembali isian formulir.");
  const request: BorrowRequest = {
    id: newId("req"),
    studentId: session.userId,
    studentName: session.name,
    itemId: parsed.item.id,
    itemName: parsed.item.name,
    quantity: parsed.quantity,
    borrowDate: values.borrowDate,
    dueDate: values.dueDate,
    purpose: parsed.purpose,
    status: "Menunggu",
    createdAt: today,
  };
  return done(
    { ...data, requests: [request, ...data.requests] },
    "Pengajuan terkirim. Menunggu pemeriksaan petugas laboratorium.",
  );
}

export function cancelRequest(data: AppData, id: string, studentId: string, today: string): Result {
  const req = data.requests.find((r) => r.id === id);
  if (!req || req.studentId !== studentId) return fail("Pengajuan tidak ditemukan.");
  if (req.status !== "Menunggu") {
    return fail("Hanya pengajuan berstatus Menunggu yang dapat dibatalkan.");
  }
  return done(
    patchRequest(data, id, { status: "Dibatalkan", decidedAt: today }),
    "Pengajuan berhasil dibatalkan.",
  );
}

export function approveRequest(data: AppData, id: string, today: string): Result {
  const req = data.requests.find((r) => r.id === id);
  if (!req) return fail("Pengajuan tidak ditemukan.");
  if (req.status !== "Menunggu") return fail("Pengajuan ini sudah diproses sebelumnya.");
  if (!data.items.some((i) => i.id === req.itemId)) {
    return fail("Barang pada pengajuan ini sudah tidak ada di inventaris.");
  }
  return done(
    patchRequest(data, id, { status: "Disetujui", decidedAt: today }),
    `Pengajuan ${req.studentName} disetujui. Catat penyerahan saat barang diambil.`,
  );
}

export function rejectRequest(data: AppData, id: string, reason: string, today: string): Result {
  const req = data.requests.find((r) => r.id === id);
  if (!req) return fail("Pengajuan tidak ditemukan.");
  if (req.status !== "Menunggu") return fail("Pengajuan ini sudah diproses sebelumnya.");
  const trimmed = reason.trim();
  if (trimmed.length > 200) return fail("Alasan penolakan maksimal 200 karakter.");
  return done(
    patchRequest(data, id, {
      status: "Ditolak",
      decidedAt: today,
      rejectReason: trimmed || undefined,
    }),
    `Pengajuan ${req.studentName} ditolak.`,
  );
}

export function handoverRequest(data: AppData, id: string, today: string): Result {
  const req = data.requests.find((r) => r.id === id);
  if (!req) return fail("Pengajuan tidak ditemukan.");
  if (req.status !== "Disetujui") return fail("Hanya pengajuan yang sudah disetujui yang dapat diserahkan.");
  const item = data.items.find((i) => i.id === req.itemId);
  if (!item) return fail("Barang pada pengajuan ini sudah tidak ada di inventaris.");
  const available = getAvailable(item);
  if (req.quantity > available) {
    return fail(
      `Stok tidak mencukupi: diminta ${req.quantity} unit "${item.name}", tersedia ${available} unit.`,
    );
  }
  const items = data.items.map((i) =>
    i.id === item.id ? { ...i, borrowed: i.borrowed + req.quantity } : i,
  );
  return done(
    patchRequest(data, id, { status: "Sedang Dipinjam", handedOverAt: today }, items),
    `Penyerahan dicatat. ${req.quantity} unit "${item.name}" kini dipinjam ${req.studentName}.`,
  );
}

export function returnRequest(
  data: AppData,
  id: string,
  damagedUnits: number,
  note: string,
  today: string,
): Result {
  const req = data.requests.find((r) => r.id === id);
  if (!req) return fail("Pengajuan tidak ditemukan.");
  if (req.status !== "Sedang Dipinjam") {
    return fail("Hanya peminjaman yang sedang berjalan yang dapat dicatat pengembaliannya.");
  }
  if (!Number.isInteger(damagedUnits) || damagedUnits < 0 || damagedUnits > req.quantity) {
    return fail(`Jumlah unit rusak harus antara 0 dan ${req.quantity}.`);
  }
  const item = data.items.find((i) => i.id === req.itemId);
  if (!item) return fail("Barang pada pengajuan ini sudah tidak ada di inventaris.");
  const trimmedNote = note.trim();
  if (trimmedNote.length > 200) return fail("Catatan maksimal 200 karakter.");

  const good = req.quantity - damagedUnits;
  const items = data.items.map((i) =>
    i.id === item.id
      ? {
          ...i,
          borrowed: Math.max(0, i.borrowed - req.quantity),
          damaged: Math.min(i.total, i.damaged + damagedUnits),
        }
      : i,
  );
  const message =
    damagedUnits > 0
      ? `Pengembalian dicatat: ${good} unit kembali tersedia, ${damagedUnits} unit dicatat rusak.`
      : `Pengembalian dicatat: ${req.quantity} unit kembali ke stok tersedia.`;
  return done(
    patchRequest(
      data,
      id,
      {
        status: "Selesai",
        returnedAt: today,
        returnedGood: good,
        returnedDamaged: damagedUnits,
        returnNote: trimmedNote || undefined,
      },
      items,
    ),
    message,
  );
}
