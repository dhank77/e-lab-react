import type { LoanStatus } from "@/lib/types";

const MAP: Record<LoanStatus, { label: string; cls: string }> = {
  pending: { label: "Menunggu", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  approved: { label: "Dipinjam", cls: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  rejected: { label: "Ditolak", cls: "bg-red-50 text-red-700 ring-red-200" },
  returned: { label: "Dikembalikan", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
};

export function StatusBadge({ status, overdue }: { status: LoanStatus; overdue?: boolean }) {
  if (overdue)
    return <span className="badge bg-red-600 text-white ring-red-600">Terlambat</span>;
  const s = MAP[status];
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}
