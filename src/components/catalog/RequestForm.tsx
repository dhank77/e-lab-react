"use client";

import { useId, useState, type FormEvent } from "react";
import { ConditionBadge } from "@/components/ui/Badge";
import { Field, Select, describedBy, inputClass } from "@/components/ui/Form";
import { addDays, todayStr } from "@/lib/date";
import {
  MAX_LOAN_DAYS,
  getAvailable,
  getCondition,
  validateRequest,
  type RequestErrors,
  type RequestFormValues,
} from "@/lib/inventory";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  formId: string;
  items: Item[];
  initialItemId?: string;
  onSubmit: (values: RequestFormValues) => boolean;
};

const ORDER: Array<keyof RequestFormValues> = ["itemId", "quantity", "borrowDate", "dueDate", "purpose"];

export function RequestForm({ formId, items, initialItemId, onSubmit }: Props) {
  const uid = useId();
  const id = (k: keyof RequestFormValues) => `${uid}-${k}`;
  const [today] = useState(() => todayStr());
  const [values, setValues] = useState<RequestFormValues>(() => ({
    itemId: initialItemId ?? "",
    quantity: "1",
    borrowDate: todayStr(),
    dueDate: addDays(todayStr(), 7),
    purpose: "",
  }));
  const [errors, setErrors] = useState<RequestErrors>({});

  const set = (key: keyof RequestFormValues, value: string) => {
    setValues((v) => {
      const next = { ...v, [key]: value };
      if (key === "borrowDate" && /^\d{4}-\d{2}-\d{2}$/.test(value) && next.dueDate < value) {
        next.dueDate = value;
      }
      return next;
    });
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validateRequest(values, items, today);
    setErrors(result.errors);
    const first = ORDER.find((k) => result.errors[k]);
    if (first) {
      document.getElementById(id(first))?.focus();
      return;
    }
    onSubmit(values);
  };

  const selected = items.find((i) => i.id === values.itemId);
  const props = (key: keyof RequestFormValues) => ({
    id: id(key),
    "aria-invalid": errors[key] ? (true as const) : undefined,
    "aria-describedby": describedBy(id(key), errors[key]),
  });

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field id={id("itemId")} label="Barang yang dipinjam" required error={errors.itemId}>
        <Select
          {...props("itemId")}
          invalid={!!errors.itemId}
          value={values.itemId}
          onChange={(e) => set("itemId", e.target.value)}
        >
          <option value="">Pilih barang…</option>
          {items.map((i) => (
            <option key={i.id} value={i.id} disabled={getAvailable(i) === 0}>
              {i.name} ({getAvailable(i) === 0 ? "stok habis" : `tersedia ${getAvailable(i)}`})
            </option>
          ))}
        </Select>
      </Field>

      {selected && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <span>{selected.category}</span>
          <ConditionBadge condition={getCondition(selected)} />
          <span>
            Tersedia: <strong className="tabular-nums text-slate-900">{getAvailable(selected)}</strong> unit
          </span>
        </div>
      )}

      <Field
        id={id("quantity")}
        label="Jumlah pinjam (unit)"
        required
        error={errors.quantity}
        hint={selected ? `Maksimal ${getAvailable(selected)} unit.` : undefined}
      >
        <input
          {...props("quantity")}
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={values.quantity}
          onChange={(e) => set("quantity", e.target.value)}
          className={cn(inputClass(!!errors.quantity), "h-10")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={id("borrowDate")} label="Tanggal pinjam" required error={errors.borrowDate}>
          <input
            {...props("borrowDate")}
            type="date"
            min={today}
            value={values.borrowDate}
            onChange={(e) => set("borrowDate", e.target.value)}
            className={cn(inputClass(!!errors.borrowDate), "h-10")}
          />
        </Field>
        <Field
          id={id("dueDate")}
          label="Tanggal rencana kembali"
          required
          error={errors.dueDate}
          hint={`Maksimal ${MAX_LOAN_DAYS} hari masa pinjam.`}
        >
          <input
            {...props("dueDate")}
            type="date"
            min={values.borrowDate || today}
            value={values.dueDate}
            onChange={(e) => set("dueDate", e.target.value)}
            className={cn(inputClass(!!errors.dueDate), "h-10")}
          />
        </Field>
      </div>

      <Field id={id("purpose")} label="Keperluan" error={errors.purpose} hint="Opsional, misalnya nama praktikum atau proyek.">
        <textarea
          {...props("purpose")}
          rows={3}
          maxLength={220}
          value={values.purpose}
          onChange={(e) => set("purpose", e.target.value)}
          className={cn(inputClass(!!errors.purpose), "resize-y py-2")}
        />
      </Field>

      <p className="text-xs leading-relaxed text-slate-500">
        Pengajuan berstatus Menunggu belum mengurangi stok. Stok berpindah ke &ldquo;sedang dipinjam&rdquo;
        setelah petugas mencatat penyerahan barang.
      </p>
    </form>
  );
}
