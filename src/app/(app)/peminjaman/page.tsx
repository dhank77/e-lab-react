import { requireUser } from "@/lib/auth";
import { formatDate, isOverdue } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/Alert";
import type { Loan } from "@/lib/types";
import { cancelLoan } from "../actions";

export const metadata = { title: "Peminjaman Saya — E-Lab" };

type Row = Loan & { items: { name: string; code: string | null; labs: { name: string } | null } | null };

export default async function MyLoansPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: loans } = await supabase
    .from("loans")
    .select("*, items(name, code, labs(name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Row[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Peminjaman Saya</h1>
        <p className="mt-1 text-slate-500">Riwayat dan status pengajuan peminjaman barang.</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Barang</th>
              <th>Jumlah</th>
              <th>Tgl pinjam</th>
              <th>Tgl kembali</th>
              <th>Status</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loans?.map((l) => (
              <tr key={l.id}>
                <td>
                  <p className="font-medium text-slate-900">{l.items?.name}</p>
                  <p className="text-sm text-slate-500">{l.items?.labs?.name}</p>
                  {l.purpose && <p className="text-xs text-slate-400">“{l.purpose}”</p>}
                  {l.admin_note && <p className="text-xs text-indigo-600">Catatan admin: {l.admin_note}</p>}
                </td>
                <td>{l.quantity}</td>
                <td className="text-sm">{formatDate(l.borrow_date)}</td>
                <td className="text-sm">
                  {formatDate(l.due_date)}
                  {l.returned_at && <p className="text-xs text-slate-400">dikembalikan {formatDate(l.returned_at)}</p>}
                </td>
                <td><StatusBadge status={l.status} overdue={isOverdue(l.due_date, l.status)} /></td>
                <td className="text-right">
                  {l.status === "pending" && (
                    <form action={cancelLoan}>
                      <input type="hidden" name="loan_id" value={l.id} />
                      <button className="btn-secondary text-red-600">Batalkan</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {loans?.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">Belum ada peminjaman.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
