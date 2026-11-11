"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Gate } from "@/components/layout/AppShell";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput, Select } from "@/components/ui/Form";
import { Card, EmptyState, PageHeader, PageSkeleton } from "@/components/ui/Layout";
import { returnSummary } from "@/components/requests/RequestParts";
import { formatDate, todayStr } from "@/lib/date";
import { isOverdue } from "@/lib/inventory";
import { useStore } from "@/lib/store";
import type { BorrowRequest } from "@/lib/types";

function Return({ r, today }: { r: BorrowRequest; today: string }) {
  if (r.status === "Selesai") {
    return (
      <>
        <p className="font-medium text-slate-900">{formatDate(r.returnedAt)}</p>
        <p className="text-xs text-slate-500">{returnSummary(r)}</p>
      </>
    );
  }
  return (
    <>
      <p className="text-slate-600">Belum dikembalikan</p>
      {isOverdue(r, today) && <Badge tone="danger" className="mt-1">Terlambat</Badge>}
    </>
  );
}

export function TransaksiView() {
  const { requests } = useStore();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [status, setStatus] = useState("");
  const today = todayStr();

  // Transaksi = pengajuan yang sudah diserahkan (sedang dipinjam atau selesai).
  const transactions = useMemo(() => requests.filter((r) => !!r.handedOverAt), [requests]);
  const list = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return transactions
      .filter(
        (r) =>
          (!status || r.status === status) &&
          (!q || r.studentName.toLowerCase().includes(q) || r.itemName.toLowerCase().includes(q)),
      )
      .sort((a, b) => (b.handedOverAt ?? "").localeCompare(a.handedOverAt ?? ""));
  }, [transactions, deferredQuery, status]);

  const filtering = query.trim() !== "" || status !== "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Transaksi"
        description="Catatan penyerahan dan pengembalian barang, lengkap dengan peminjam dan tanggal pengembalian."
      />

      <Gate fallback={<PageSkeleton height="h-[26rem]" />}>
        <Card>
          <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_13rem]">
            <SearchInput
              label="Cari peminjam atau barang"
              placeholder="Cari peminjam atau barang…"
              value={query}
              onChange={setQuery}
            />
            <Select aria-label="Filter status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua status</option>
              <option value="Sedang Dipinjam">Sedang Dipinjam</option>
              <option value="Selesai">Selesai</option>
            </Select>
          </div>

          {list.length === 0 ? (
            <div className="border-t border-slate-200">
              <EmptyState
                icon="history"
                title={filtering ? "Transaksi tidak ditemukan" : "Belum ada transaksi"}
                description={
                  filtering
                    ? "Tidak ada transaksi yang cocok dengan pencarian atau filter."
                    : "Transaksi akan muncul setelah petugas mencatat penyerahan barang."
                }
                action={
                  filtering ? (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setQuery("");
                        setStatus("");
                      }}
                    >
                      Atur Ulang Filter
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <>
              <table className="hidden w-full text-left text-sm md:table">
                <thead>
                  <tr className="border-y border-slate-200 bg-slate-50/70 text-slate-600">
                    <th scope="col" className="w-14 px-5 py-3 font-medium">No.</th>
                    <th scope="col" className="px-3 py-3 font-medium">Peminjam</th>
                    <th scope="col" className="px-3 py-3 font-medium">Barang</th>
                    <th scope="col" className="px-3 py-3 font-medium">Periode Pinjam</th>
                    <th scope="col" className="px-3 py-3 font-medium">Pengembalian</th>
                    <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((r, i) => (
                    <tr key={r.id} className="align-top hover:bg-slate-50/70">
                      <td className="px-5 py-3 text-slate-600 tabular-nums">{i + 1}</td>
                      <td className="px-3 py-3 font-medium text-slate-900">{r.studentName}</td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-900">{r.itemName}</p>
                        <p className="text-xs text-slate-500">{r.quantity} unit</p>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        <p>Diserahkan {formatDate(r.handedOverAt)}</p>
                        <p className="text-xs text-slate-500">Rencana kembali {formatDate(r.dueDate)}</p>
                      </td>
                      <td className="px-3 py-3">
                        <Return r={r} today={today} />
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <ul className="divide-y divide-slate-100 border-t border-slate-200 md:hidden">
                {list.map((r, i) => (
                  <li key={r.id} className="space-y-2 px-4 py-3.5 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">{i + 1}.</p>
                        <p className="font-semibold text-slate-900">{r.studentName}</p>
                        <p className="text-slate-700">
                          {r.itemName} · {r.quantity} unit
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-slate-600">
                      Diserahkan {formatDate(r.handedOverAt)} · Rencana kembali {formatDate(r.dueDate)}
                    </p>
                    <div>
                      <p className="text-xs text-slate-500">Pengembalian</p>
                      <Return r={r} today={today} />
                    </div>
                  </li>
                ))}
              </ul>

              <p className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:px-5" aria-live="polite">
                Menampilkan {list.length} dari {transactions.length} transaksi
              </p>
            </>
          )}
        </Card>
      </Gate>
    </div>
  );
}
