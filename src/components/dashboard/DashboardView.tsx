"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { Gate } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Card, PageHeader, PageSkeleton, StatCard } from "@/components/ui/Layout";
import { formatDate, todayStr } from "@/lib/date";
import { getAvailable, getSummary, isOverdue } from "@/lib/inventory";
import { useStore } from "@/lib/store";

function Panel({
  title,
  href,
  linkLabel,
  empty,
  isEmpty,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  empty: string;
  isEmpty: boolean;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          {linkLabel}
          <Icon name="arrowRight" className="size-4" />
        </Link>
      </div>
      {isEmpty ? <p className="px-5 py-8 text-center text-sm text-slate-600">{empty}</p> : children}
    </Card>
  );
}

export function DashboardView() {
  const { items, requests } = useStore();
  const today = todayStr();
  const summary = useMemo(() => getSummary(items, requests), [items, requests]);

  const pending = requests.filter((r) => r.status === "Menunggu").slice(0, 5);
  const approved = requests.filter((r) => r.status === "Disetujui").slice(0, 5);
  const active = requests.filter((r) => r.status === "Sedang Dipinjam").slice(0, 5);
  const lowStock = useMemo(
    () =>
      items
        .map((i) => ({ item: i, available: getAvailable(i) }))
        .filter((x) => x.available <= 5)
        .sort((a, b) => a.available - b.available)
        .slice(0, 5),
    [items],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan stok laboratorium, pengajuan baru, dan peminjaman yang sedang berjalan."
        action={
          <Link href="/petugas/data-lab" className={buttonClass("primary", "md", "h-11 w-full px-5 sm:w-auto")}>
            <Icon name="box" className="size-4" />
            Kelola Data Lab
          </Link>
        }
      />

      <Gate fallback={<PageSkeleton cards={4} />}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Stok tersedia"
            value={summary.available}
            icon="box"
            accent="green"
            hint={`dari ${summary.total} unit · ${summary.itemTypes} jenis barang`}
            href="/petugas/data-lab"
          />
          <StatCard
            label="Pengajuan baru"
            value={summary.pending}
            icon="clipboard"
            accent="amber"
            hint="menunggu pemeriksaan"
            href="/petugas/pengajuan"
          />
          <StatCard
            label="Siap diserahkan"
            value={summary.approved}
            icon="check"
            accent="blue"
            hint="sudah disetujui"
            href="/petugas/pengajuan"
          />
          <StatCard
            label="Peminjaman aktif"
            value={summary.active}
            icon="history"
            accent="violet"
            hint={`${summary.borrowed} unit sedang dipinjam`}
            href="/petugas/transaksi"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel
            title="Pengajuan baru"
            href="/petugas/pengajuan"
            linkLabel="Periksa"
            isEmpty={pending.length === 0}
            empty="Tidak ada pengajuan yang menunggu."
          >
            <ul className="divide-y divide-slate-100">
              {pending.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 px-5 py-3.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{r.studentName}</p>
                    <p className="text-slate-600">
                      {r.itemName} · {r.quantity} unit
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-slate-500">Pinjam {formatDate(r.borrowDate)}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="Peminjaman aktif"
            href="/petugas/pengajuan"
            linkLabel="Catat pengembalian"
            isEmpty={active.length === 0}
            empty="Tidak ada barang yang sedang dipinjam."
          >
            <ul className="divide-y divide-slate-100">
              {active.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 px-5 py-3.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{r.studentName}</p>
                    <p className="text-slate-600">
                      {r.itemName} · {r.quantity} unit
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-slate-500">Kembali {formatDate(r.dueDate)}</p>
                    {isOverdue(r, today) && <Badge tone="danger" className="mt-1">Terlambat</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="Siap diserahkan"
            href="/petugas/pengajuan"
            linkLabel="Catat penyerahan"
            isEmpty={approved.length === 0}
            empty="Belum ada pengajuan yang disetujui."
          >
            <ul className="divide-y divide-slate-100">
              {approved.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 px-5 py-3.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{r.studentName}</p>
                    <p className="text-slate-600">
                      {r.itemName} · {r.quantity} unit
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-slate-500">Ambil {formatDate(r.borrowDate)}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="Stok menipis"
            href="/petugas/data-lab"
            linkLabel="Data Lab"
            isEmpty={lowStock.length === 0}
            empty="Semua barang memiliki stok yang cukup."
          >
            <ul className="divide-y divide-slate-100">
              {lowStock.map(({ item, available }) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.category}</p>
                  </div>
                  <Badge tone={available === 0 ? "danger" : "warning"}>
                    {available === 0 ? "Habis" : `${available} unit`}
                  </Badge>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </Gate>
    </div>
  );
}
