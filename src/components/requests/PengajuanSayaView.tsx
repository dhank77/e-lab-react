"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Gate } from "@/components/layout/AppShell";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Card, EmptyState, PageHeader, PageSkeleton } from "@/components/ui/Layout";
import { ConfirmDialog } from "@/components/ui/Modal";
import { daysBetween, formatDate, todayStr } from "@/lib/date";
import { isOverdue } from "@/lib/inventory";
import { useStore } from "@/lib/store";
import { REQUEST_STATUSES, type BorrowRequest } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RequestMeta, returnSummary } from "./RequestParts";

function Instruction({ request, today }: { request: BorrowRequest; today: string }) {
  if (request.status === "Disetujui") {
    return (
      <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm leading-relaxed text-blue-900">
        <p className="font-semibold">Pengajuan disetujui</p>
        <p className="mt-0.5">
          Ambil barang di laboratorium pada {formatDate(request.borrowDate)} dan tunjukkan kartu mahasiswa.
          Stok baru berpindah ke status dipinjam setelah petugas mencatat penyerahan.
        </p>
      </div>
    );
  }
  if (request.status === "Sedang Dipinjam") {
    const late = isOverdue(request, today);
    const left = daysBetween(today, request.dueDate);
    return (
      <div
        className={cn(
          "mt-3 rounded-lg p-3 text-sm leading-relaxed",
          late ? "bg-red-50 text-red-900" : "bg-violet-50 text-violet-900",
        )}
      >
        <p className="font-semibold">
          {late
            ? `Terlambat ${Math.abs(left)} hari — segera kembalikan`
            : left === 0
              ? "Batas pengembalian hari ini"
              : `Batas pengembalian ${formatDate(request.dueDate)} (${left} hari lagi)`}
        </p>
        <p className="mt-0.5">
          Bawa barang ke petugas laboratorium dalam keadaan bersih dan lengkap. Laporkan jika ada
          kerusakan. Pengembalian dianggap selesai setelah petugas mencatatnya.
        </p>
      </div>
    );
  }
  if (request.status === "Ditolak") {
    return (
      <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
        Alasan penolakan: {request.rejectReason || "Tidak ada alasan yang dicantumkan."}
      </p>
    );
  }
  if (request.status === "Selesai") {
    return (
      <p className="mt-3 text-sm text-slate-600">
        Dikembalikan {formatDate(request.returnedAt)} · {returnSummary(request)}
      </p>
    );
  }
  if (request.status === "Menunggu") {
    return <p className="mt-3 text-sm text-slate-600">Menunggu pemeriksaan petugas laboratorium.</p>;
  }
  return <p className="mt-3 text-sm text-slate-600">Pengajuan ini telah Anda batalkan.</p>;
}

export function PengajuanSayaView() {
  const { session, requests, cancelRequest } = useStore();
  const [filter, setFilter] = useState<string>("");
  const [cancelling, setCancelling] = useState<BorrowRequest | null>(null);
  const today = todayStr();

  const mine = useMemo(
    () => requests.filter((r) => r.studentId === session?.userId),
    [requests, session],
  );
  const list = filter ? mine.filter((r) => r.status === filter) : mine;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengajuan Saya"
        description="Pantau status pengajuan, lihat riwayat peminjaman, dan ikuti instruksi pengembalian barang."
        action={
          <Link href="/mahasiswa/katalog" className={buttonClass("primary", "md", "h-11 w-full px-5 sm:w-auto")}>
            <Icon name="plus" className="size-4" />
            Ajukan Peminjaman
          </Link>
        }
      />

      <Gate fallback={<PageSkeleton height="h-[30rem]" />}>
        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-900">Alur peminjaman & instruksi pengembalian</h2>
          <ol className="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Ajukan", "Pilih alat di katalog dan isi tanggal pinjam serta rencana kembali."],
              ["Tunggu persetujuan", "Petugas memeriksa pengajuan. Anda dapat membatalkannya selama masih Menunggu."],
              ["Ambil alat", "Datang ke laboratorium dan tunjukkan kartu mahasiswa. Petugas mencatat penyerahan."],
              ["Kembalikan", "Serahkan alat ke petugas paling lambat pada tanggal rencana kembali, dalam keadaan bersih dan lengkap."],
            ].map(([title, text], i) => (
              <li key={title} className="flex gap-3">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span>
                  <strong className="block text-slate-900">{title}</strong>
                  <span className="text-slate-600">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <div className="flex flex-wrap gap-2 border-b border-slate-200 p-4 sm:p-5" role="group" aria-label="Filter status">
            {[{ key: "", label: "Semua" }, ...REQUEST_STATUSES.map((s) => ({ key: s, label: s }))].map((t) => {
              const count = t.key ? mine.filter((r) => r.status === t.key).length : mine.length;
              return (
                <button
                  key={t.label}
                  type="button"
                  aria-pressed={filter === t.key}
                  onClick={() => setFilter(t.key)}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
                    filter === t.key
                      ? "bg-blue-600 text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs font-semibold tabular-nums",
                      filter === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {list.length === 0 ? (
            <EmptyState
              icon="clipboard"
              title={mine.length === 0 ? "Belum ada pengajuan" : "Tidak ada pengajuan dengan status ini"}
              description={
                mine.length === 0
                  ? "Anda belum pernah mengajukan peminjaman. Mulai dari katalog alat."
                  : "Pilih status lain untuk melihat pengajuan Anda."
              }
              action={
                mine.length === 0 ? (
                  <Link href="/mahasiswa/katalog" className={buttonClass("primary")}>
                    Buka Katalog
                  </Link>
                ) : (
                  <Button variant="secondary" onClick={() => setFilter("")}>
                    Tampilkan Semua
                  </Button>
                )
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {list.map((r) => (
                <li key={r.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{r.itemName}</p>
                      <p className="mt-0.5 text-xs text-slate-500">Diajukan {formatDate(r.createdAt)}</p>
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
                  <Instruction request={r} today={today} />
                  {r.status === "Menunggu" && (
                    <div className="mt-4">
                      <Button variant="dangerOutline" size="sm" icon="x" onClick={() => setCancelling(r)}>
                        Batalkan Pengajuan
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Gate>

      {cancelling && (
        <ConfirmDialog
          title="Batalkan pengajuan?"
          confirmLabel="Ya, Batalkan"
          cancelLabel="Kembali"
          onCancel={() => setCancelling(null)}
          onConfirm={() => {
            cancelRequest(cancelling.id);
            setCancelling(null);
          }}
          message={
            <p>
              Pengajuan <strong className="text-slate-900">{cancelling.itemName}</strong> ({cancelling.quantity}{" "}
              unit) akan dibatalkan dan tidak dapat diaktifkan kembali. Anda dapat membuat pengajuan baru
              kapan saja.
            </p>
          }
        />
      )}
    </div>
  );
}
