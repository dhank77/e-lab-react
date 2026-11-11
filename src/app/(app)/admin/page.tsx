import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatDate, isOverdue } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/Alert";
import type { Loan, LoanStatus } from "@/lib/types";
import { adminLoanAction } from "../actions";

export const metadata = { title: "Kelola Peminjaman — E-Lab" };

type Row = Loan & {
  items: { name: string; quantity_available: number; labs: { name: string } | null } | null;
  profiles: { full_name: string; nim: string | null } | null;
};

const TABS: { key: LoanStatus | "all"; label: string }[] = [
  { key: "pending", label: "Menunggu" },
  { key: "approved", label: "Dipinjam" },
  { key: "returned", label: "Dikembalikan" },
  { key: "rejected", label: "Ditolak" },
  { key: "all", label: "Semua" },
];

export default async function AdminLoansPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const { status = "pending", error } = await searchParams;
  const { supabase } = await requireAdmin();

  let q = supabase
    .from("loans")
    .select("*, items(name, quantity_available, labs(name)), profiles(full_name, nim)")
    .order("created_at", { ascending: false });
  if (status !== "all") q = q.eq("status", status);
  const { data: loans } = await q.returns<Row[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Kelola Peminjaman</h1>
        <p className="mt-1 text-slate-500">Setujui, tolak, dan catat pengembalian barang.</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin?status=${t.key}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              status === t.key ? "bg-indigo-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Peminjam</th>
              <th>Barang</th>
              <th>Jumlah</th>
              <th>Periode</th>
              <th>Status</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loans?.map((l) => (
              <tr key={l.id}>
                <td>
                  <p className="font-medium text-slate-900">{l.profiles?.full_name || "-"}</p>
                  <p className="text-sm text-slate-500">{l.profiles?.nim ?? ""}</p>
                </td>
                <td>
                  <p className="font-medium text-slate-900">{l.items?.name}</p>
                  <p className="text-sm text-slate-500">{l.items?.labs?.name}</p>
                  {l.purpose && <p className="text-xs text-slate-400">“{l.purpose}”</p>}
                </td>
                <td>
                  {l.quantity}
                  {l.status === "pending" && (
                    <p className="text-xs text-slate-400">stok {l.items?.quantity_available}</p>
                  )}
                </td>
                <td className="text-sm">
                  {formatDate(l.borrow_date)} – {formatDate(l.due_date)}
                  {l.returned_at && <p className="text-xs text-slate-400">kembali {formatDate(l.returned_at)}</p>}
                </td>
                <td><StatusBadge status={l.status} overdue={isOverdue(l.due_date, l.status)} /></td>
                <td className="text-right">
                  {l.status === "pending" && (
                    <form action={adminLoanAction} className="flex flex-col items-end gap-2">
                      <input type="hidden" name="loan_id" value={l.id} />
                      <input name="note" placeholder="Catatan (opsional)" className="input w-48 py-1 text-xs" />
                      <div className="flex gap-2">
                        <button name="op" value="reject" className="btn-secondary text-red-600">Tolak</button>
                        <button name="op" value="approve" className="btn-primary">Setujui</button>
                      </div>
                    </form>
                  )}
                  {l.status === "approved" && (
                    <form action={adminLoanAction}>
                      <input type="hidden" name="loan_id" value={l.id} />
                      <button name="op" value="return" className="btn-primary">Tandai dikembalikan</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {loans?.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">Tidak ada data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
