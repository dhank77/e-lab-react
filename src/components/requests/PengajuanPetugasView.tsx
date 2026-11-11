"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Gate } from "@/components/layout/AppShell";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/Form";
import { Card, EmptyState, PageHeader, PageSkeleton } from "@/components/ui/Layout";
import { formatDate, todayStr } from "@/lib/date";
import { getAvailable, isOverdue } from "@/lib/inventory";
import { useStore } from "@/lib/store";
import type { BorrowRequest } from "@/lib/types";
import { cn, initials } from "@/lib/utils";
import { RejectModal, ReturnModal } from "./RequestModals";
import { RequestMeta, returnSummary } from "./RequestParts";

const TABS = [
  { key: "Menunggu", label: "Menunggu" },
  { key: "Disetujui", label: "Siap Diserahkan" },
  { key: "Sedang Dipinjam", label: "Sedang Dipinjam" },
  { key: "Semua", label: "Semua" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const EMPTY_TEXT: Record<TabKey, string> = {
  Menunggu: "Tidak ada pengajuan yang menunggu pemeriksaan.",
  Disetujui: "Belum ada pengajuan yang siap diserahkan.",
  "Sedang Dipinjam": "Tidak ada barang yang sedang dipinjam.",
  Semua: "Belum ada pengajuan peminjaman.",
};

export function PengajuanPetugasView() {
  const { items, requests, approveRequest, rejectRequest, handoverRequest, returnRequest } = useStore();
  const [tab, setTab] = useState<TabKey>("Menunggu");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [rejecting, setRejecting] = useState<BorrowRequest | null>(null);
  const [returning, setReturning] = useState<BorrowRequest | null>(null);

  const today = todayStr();
  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { Menunggu: 0, Disetujui: 0, "Sedang Dipinjam": 0, Semua: requests.length };
    for (const r of requests) {
      if (r.status === "Menunggu" || r.status === "Disetujui" || r.status === "Sedang Dipinjam") c[r.status]++;
    }
    return c;
  }, [requests]);

  const list = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return requests.filter(
      (r) =>
        (tab === "Semua" || r.status === tab) &&
        (!q || r.studentName.toLowerCase().includes(q) || r.itemName.toLowerCase().includes(q)),
    );
  }, [requests, tab, deferredQuery]);

  const availableOf = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    return item ? getAvailable(item) : 0;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengajuan"
        description="Periksa pengajuan peminjaman dari mahasiswa, setujui atau tolak, lalu catat penyerahan dan pengembalian barang."
      />

      <Gate fallback={<PageSkeleton height="h-[30rem]" />}>
        <Card>
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div role="group" aria-label="Filter status pengajuan" className="flex flex-wrap gap-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  aria-pressed={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
                    tab === t.key
                      ? "bg-blue-600 text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs font-semibold tabular-nums",
                      tab === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700",
                    )}
                  >
                    {counts[t.key]}
                  </span>
                </button>
              ))}
            </div>
            <SearchInput
              label="Cari nama mahasiswa atau barang"
              placeholder="Cari mahasiswa atau barang…"
              value={query}
              onChange={setQuery}
              className="lg:w-72"
            />
          </div>

          {list.length === 0 ? (
            <EmptyState
              icon="clipboard"
              title={query.trim() ? "Pengajuan tidak ditemukan" : "Tidak ada data"}
              description={query.trim() ? "Coba kata kunci lain atau ganti filter status." : EMPTY_TEXT[tab]}
              action={
                query.trim() ? (
                  <Button variant="secondary" onClick={() => setQuery("")}>
                    Hapus Pencarian
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {list.map((r) => {
                const stock = availableOf(r.itemId);
                const short = stock < r.quantity;
                return (
                  <li key={r.id} className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                          {initials(r.studentName)}
                        </span>
                        <div className="min-w-0 leading-tight">
                          <p className="truncate font-semibold text-slate-900">{r.studentName}</p>
                          <p className="mt-0.5 text-xs text-slate-500">Diajukan {formatDate(r.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOverdue(r, today) && <Badge tone="danger">Terlambat</Badge>}
                        <StatusBadge status={r.status} />
                      </div>
                    </div>

                    <RequestMeta request={r} />

                    {r.purpose && (
                      <p className="mt-3 text-sm text-slate-600">
                        <span className="text-slate-500">Keperluan:</span> {r.purpose}
                      </p>
                    )}

                    {(r.status === "Menunggu" || r.status === "Disetujui") && (
                      <p
                        className={cn(
                          "mt-3 text-sm",
                          short ? "font-medium text-red-700" : "text-slate-600",
                        )}
                      >
                        Stok tersedia saat ini: {stock} unit
                        {short && ` — kurang dari jumlah yang diminta (${r.quantity} unit).`}
                      </p>
                    )}
                    {r.status === "Ditolak" && (
                      <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                        Alasan penolakan: {r.rejectReason || "Tidak ada alasan yang dicantumkan."}
                      </p>
                    )}
                    {r.status === "Selesai" && (
                      <p className="mt-3 text-sm text-slate-600">
                        Dikembalikan {formatDate(r.returnedAt)} · {returnSummary(r)}
                        {r.returnNote ? ` · ${r.returnNote}` : ""}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {r.status === "Menunggu" && (
                        <>
                          <Button variant="success" size="sm" icon="check" onClick={() => approveRequest(r.id)}>
                            Setujui
                          </Button>
                          <Button variant="dangerOutline" size="sm" icon="x" onClick={() => setRejecting(r)}>
                            Tolak
                          </Button>
                        </>
                      )}
                      {r.status === "Disetujui" && (
                        <Button size="sm" disabled={short} onClick={() => handoverRequest(r.id)}>
                          Catat Penyerahan
                        </Button>
                      )}
                      {r.status === "Sedang Dipinjam" && (
                        <Button size="sm" onClick={() => setReturning(r)}>
                          Catat Pengembalian
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </Gate>

      {rejecting && (
        <RejectModal
          request={rejecting}
          onClose={() => setRejecting(null)}
          onSubmit={(reason) => rejectRequest(rejecting.id, reason)}
        />
      )}
      {returning && (
        <ReturnModal
          request={returning}
          onClose={() => setReturning(null)}
          onSubmit={(damaged, note) => returnRequest(returning.id, damaged, note)}
        />
      )}
    </div>
  );
}
