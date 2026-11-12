"use client";

import { useState } from "react";
import { Badge, ConditionBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/date";
import { getAvailable, getCondition, parseIntStrict } from "@/lib/inventory";
import type { BorrowRequest, Item } from "@/lib/types";

type Props = {
  item: Item;
  activeLoans: BorrowRequest[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkDamaged: (units: number) => boolean | Promise<boolean>;
  onMarkRepaired: (units: number) => boolean | Promise<boolean>;
};

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`mt-1 text-xl font-bold tabular-nums ${tone ?? "text-slate-900"}`}>{value}</dd>
    </div>
  );
}

export function ItemDetail({ item, activeLoans, onClose, onEdit, onDelete, onMarkDamaged, onMarkRepaired }: Props) {
  const [units, setUnits] = useState("1");
  const available = getAvailable(item);
  const parsed = parseIntStrict(units) ?? 0;

  return (
    <Modal
      title={item.name}
      description="Detail barang dan rincian stok unit."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="dangerOutline" icon="trash" onClick={onDelete}>
            Hapus
          </Button>
          <Button variant="secondary" icon="pencil" onClick={onEdit}>
            Ubah
          </Button>
          <Button data-autofocus onClick={onClose}>
            Tutup
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info">{item.category}</Badge>
          <ConditionBadge condition={getCondition(item)} />
        </div>
        <p className="text-sm leading-relaxed text-slate-700">
          {item.description || "Belum ada keterangan untuk barang ini."}
        </p>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Jumlah total" value={item.total} />
          <Stat label="Tersedia" value={available} tone="text-emerald-700" />
          <Stat label="Sedang dipinjam" value={item.borrowed} tone="text-violet-700" />
          <Stat label="Rusak" value={item.damaged} tone="text-red-700" />
        </dl>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Peminjaman aktif</h3>
          {activeLoans.length === 0 ? (
            <p className="mt-1.5 text-sm text-slate-600">Tidak ada unit yang sedang dipinjam.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
              {activeLoans.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                  <span className="font-medium text-slate-900">
                    {r.studentName} <span className="font-normal text-slate-600">· {r.quantity} unit</span>
                  </span>
                  <span className="text-slate-600">Kembali {formatDate(r.dueDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Catat kondisi unit</h3>
          <p className="mt-1 text-xs text-slate-600">
            Pindahkan unit tersedia menjadi rusak, atau kembalikan unit rusak yang sudah diperbaiki.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="adjust-units">
              Jumlah unit
            </label>
            <input
              id="adjust-units"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className={`${inputClass(false)} h-10 sm:w-28`}
            />
            <Button variant="secondary" disabled={available === 0} onClick={() => void onMarkDamaged(parsed)}>
              Catat Rusak
            </Button>
            <Button variant="secondary" disabled={item.damaged === 0} onClick={() => void onMarkRepaired(parsed)}>
              Catat Diperbaiki
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
