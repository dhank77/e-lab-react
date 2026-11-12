"use client";

import { useId, useState, type FormEvent } from "react";
import { ConditionBadge } from "@/components/ui/Badge";
import { Field, describedBy, inputClass } from "@/components/ui/Form";
import {
  getAvailable,
  getCondition,
  parseIntStrict,
  validateItem,
  type ItemErrors,
  type ItemFormValues,
} from "@/lib/inventory";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  formId: string;
  item?: Item;
  items: Item[];
  categories: string[];
  onSubmit: (values: ItemFormValues) => boolean | Promise<boolean>;
};

const FIELD_ORDER: Array<keyof ItemFormValues> = ["name", "category", "total", "damaged", "description"];

export function ItemForm({ formId, item, items, categories, onSubmit }: Props) {
  const uid = useId();
  const id = (key: keyof ItemFormValues) => `${uid}-${key}`;
  const [values, setValues] = useState<ItemFormValues>({
    name: item?.name ?? "",
    category: item?.category ?? "",
    description: item?.description ?? "",
    total: item ? String(item.total) : "",
    damaged: item ? String(item.damaged) : "0",
  });
  const [errors, setErrors] = useState<ItemErrors>({});

  const set = (key: keyof ItemFormValues, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = validateItem(values, items, item);
    setErrors(result.errors);
    const firstInvalid = FIELD_ORDER.find((k) => result.errors[k]);
    if (firstInvalid) {
      document.getElementById(id(firstInvalid))?.focus();
      return;
    }
    await onSubmit(values);
  };

  const borrowed = item?.borrowed ?? 0;
  const total = parseIntStrict(values.total);
  const damaged = parseIntStrict(values.damaged);
  const preview =
    total !== null && damaged !== null && total >= 1 && damaged + borrowed <= total
      ? { total, damaged, borrowed }
      : null;

  const field = (key: keyof ItemFormValues) => ({
    id: id(key),
    "aria-invalid": errors[key] ? (true as const) : undefined,
    "aria-describedby": describedBy(id(key), errors[key]),
  });

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field id={id("name")} label="Nama barang" required error={errors.name}>
        <input
          {...field("name")}
          type="text"
          value={values.name}
          maxLength={90}
          placeholder="Contoh: Sensor suhu LM35"
          onChange={(e) => set("name", e.target.value)}
          className={cn(inputClass(!!errors.name), "h-10")}
        />
      </Field>

      <Field id={id("category")} label="Kategori" required error={errors.category} hint="Pilih dari saran atau ketik kategori baru.">
        <input
          {...field("category")}
          type="text"
          list={`${uid}-categories`}
          value={values.category}
          maxLength={45}
          placeholder="Contoh: Sensor"
          onChange={(e) => set("category", e.target.value)}
          className={cn(inputClass(!!errors.category), "h-10")}
        />
        <datalist id={`${uid}-categories`}>
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={id("total")} label="Jumlah total (unit)" required error={errors.total}>
          <input
            {...field("total")}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={values.total}
            placeholder="0"
            onChange={(e) => set("total", e.target.value)}
            className={cn(inputClass(!!errors.total), "h-10")}
          />
        </Field>
        <Field
          id={id("damaged")}
          label="Jumlah rusak (unit)"
          required
          error={errors.damaged}
          hint="Isi 0 jika semua unit dalam kondisi baik."
        >
          <input
            {...field("damaged")}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={values.damaged}
            onChange={(e) => set("damaged", e.target.value)}
            className={cn(inputClass(!!errors.damaged), "h-10")}
          />
        </Field>
      </div>

      <Field id={id("description")} label="Keterangan" error={errors.description} hint="Opsional, maksimal 200 karakter.">
        <textarea
          {...field("description")}
          rows={3}
          value={values.description}
          maxLength={220}
          placeholder="Spesifikasi singkat atau catatan penggunaan"
          onChange={(e) => set("description", e.target.value)}
          className={cn(inputClass(!!errors.description), "resize-y py-2")}
        />
      </Field>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-sm">
        <p className="font-medium text-slate-800">Stok dihitung otomatis</p>
        <p className="mt-1 text-slate-600">
          Tersedia = total − rusak − sedang dipinjam.
          {item ? ` Saat ini ${borrowed} unit sedang dipinjam.` : ""}
        </p>
        {preview ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-slate-700">
              Tersedia: <strong className="tabular-nums text-slate-900">{getAvailable(preview)}</strong> unit
            </span>
            <span className="inline-flex items-center gap-2 text-slate-700">
              Kondisi: <ConditionBadge condition={getCondition(preview)} />
            </span>
          </div>
        ) : (
          <p className="mt-2.5 text-slate-500">Isi jumlah total dan rusak untuk melihat pratinjau.</p>
        )}
      </div>
    </form>
  );
}
