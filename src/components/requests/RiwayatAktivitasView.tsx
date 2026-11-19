"use client";

import { useMemo } from "react";
import { Gate } from "@/components/layout/AppShell";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Card, EmptyState, PageHeader, PageSkeleton } from "@/components/ui/Layout";
import { formatDate } from "@/lib/date";
import { useStore } from "@/lib/store";
import type { BorrowRequest } from "@/lib/types";

function statsLabel(count: number, label: string) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{count}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

export function RiwayatAktivitasView() {
  const { session, requests } = useStore();
  const today = new Date().toISOString().slice(0, 10);

  const mine = useMemo(
    () => requests.filter((r) => r.studentId === session?.userId),
    [requests, session],
  );

  const total = mine.length;
  const active = mine.filter((r) => r.status === "Sedang Dipinjam").length;
  const completed = mine.filter((r) => r.status === "Selesai").length;
  const rejected = mine.filter((r) => r.status === "Ditolak").length;
  const cancelled = mine.filter((r) => r.status === "Dibatalkan").length;

  const list = useMemo(
    () =>
      [...mine].sort(
        (a, b) =>
          new Date(b.createdAt ?? "").getTime() - new Date(a.createdAt ?? "").getTime(),
      ),
    [mine],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Aktivitas"
        description="Catatan lengkap semua pengajuan dan peminjaman barang Anda dari waktu ke waktu."
      />

      <Gate fallback={<PageSkeleton cards={1} height="h-[26rem]" />}>
        <div className="grid gap-4 sm:grid-cols-3">
          {statsLabel(total, "Total pengajuan")}
          {statsLabel(active, "Sedang dipinjam")}
          {statsLabel(completed, "Selesai")}
          {statsLabel(rejected, "Ditolak")}
          {statsLabel(cancelled, "Dibatalkan")}
        </div>

        <Card>
          {list.length === 0 ? (
            <EmptyState
              icon="history"
              title="Belum ada aktivitas"
              description={
                total === 0
                  ? "Anda belum pernah mengajukan peminjaman. Mulai dari katalog alat."
                  : "Tidak ada aktivitas yang dicatat."
              }
              action={
                total === 0 ? (
                  <a
                    href="/mahasiswa/katalog"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <span style={{ display: "inline-block", width: 0, height: 0 }} />
                    Buka Katalog
                  </a>
                ) : undefined
              }
            />
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    Tanggal Diajukan
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">Barang</th>
                  <th scope="col" className="px-5 py-3.5 font-medium">Jumlah</th>
                  <th scope="col" className="px-5 py-3.5 font-medium">Periode</th>
                  <th scope="col" className="px-5 py-3.5 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3.5 font-medium text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((r) => {
                  const late = r.status === "Sedang Dipinjam" && r.dueDate < today;
                  return (
                    <tr key={r.id} className="align-middle hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 text-slate-700">
                        <p className="font-medium text-slate-900">{formatDate(r.createdAt)}</p>
                        <p className="text-xs text-slate-500">{r.status === "Menunggu" ? "Diajukan" : "Diproses"}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">{r.itemName}</p>
                        <p className="text-xs text-slate-500">{r.quantity} unit</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        <p>Pinjam {formatDate(r.borrowDate)}</p>
                        <p className="text-xs text-slate-500">Kembali {formatDate(r.dueDate)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={r.status} />
                        {late && <Badge tone="danger" className="ml-2">Terlambat</Badge>}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {r.status === "Selesai" && r.returnedAt && (
                          <p className="text-xs text-slate-500">
                            Kembalikan {formatDate(r.returnedAt)}
                          </p>
                        )}
                        {r.status === "Ditolak" && r.rejectReason && (
                          <p className="text-xs text-slate-500 max-w-[200px]">
                            {r.rejectReason}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </Gate>
    </div>
  );
}
