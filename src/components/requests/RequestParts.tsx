import { formatDate } from "@/lib/date";
import type { BorrowRequest } from "@/lib/types";

export function RequestMeta({ request }: { request: BorrowRequest }) {
  const rows: Array<[string, string]> = [
    ["Barang", request.itemName],
    ["Jumlah", `${request.quantity} unit`],
    ["Tanggal pinjam", formatDate(request.borrowDate)],
    ["Rencana kembali", formatDate(request.dueDate)],
  ];
  return (
    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-slate-500">{label}</dt>
          <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function returnSummary(request: BorrowRequest): string {
  const good = request.returnedGood ?? request.quantity;
  const damaged = request.returnedDamaged ?? 0;
  if (damaged === 0) return "Semua unit baik";
  if (good === 0) return `${damaged} unit rusak`;
  return `${good} unit baik, ${damaged} unit rusak`;
}
