"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, describedBy, inputClass } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { parseIntStrict } from "@/lib/inventory";
import type { BorrowRequest } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RejectModal({
  request,
  onClose,
  onSubmit,
}: {
  request: BorrowRequest;
  onClose: () => void;
  onSubmit: (reason: string) => boolean;
}) {
  const uid = useId();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const formId = `${uid}-reject`;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (reason.trim().length > 200) return setError("Alasan penolakan maksimal 200 karakter.");
    if (onSubmit(reason)) onClose();
  };

  return (
    <Modal
      title="Tolak Pengajuan"
      description={`${request.studentName} · ${request.itemName} (${request.quantity} unit)`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button variant="danger" type="submit" form={formId}>
            Tolak Pengajuan
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate>
        <Field
          id={`${uid}-reason`}
          label="Alasan penolakan"
          error={error}
          hint={`Opsional, akan terlihat oleh mahasiswa. ${reason.length}/200 karakter.`}
        >
          <textarea
            id={`${uid}-reason`}
            rows={4}
            value={reason}
            maxLength={220}
            placeholder="Contoh: Stok sedang dipakai untuk praktikum kelas lain."
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError("");
            }}
            aria-invalid={!!error || undefined}
            aria-describedby={describedBy(`${uid}-reason`, error, "hint")}
            className={cn(inputClass(!!error), "resize-y py-2")}
          />
        </Field>
      </form>
    </Modal>
  );
}

export function ReturnModal({
  request,
  onClose,
  onSubmit,
}: {
  request: BorrowRequest;
  onClose: () => void;
  onSubmit: (damagedUnits: number, note: string) => boolean;
}) {
  const uid = useId();
  const formId = `${uid}-return`;
  const qty = request.quantity;
  const [isDamaged, setIsDamaged] = useState(false);
  const [damaged, setDamaged] = useState(String(qty));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const parsed = parseIntStrict(damaged);
  const damagedUnits = isDamaged ? (parsed ?? 0) : 0;
  const validPreview = !isDamaged || (parsed !== null && parsed >= 1 && parsed <= qty);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (isDamaged && (parsed === null || parsed < 1 || parsed > qty)) {
      setError(`Isi jumlah unit rusak antara 1 dan ${qty}.`);
      return;
    }
    if (note.trim().length > 200) return;
    if (onSubmit(damagedUnits, note)) onClose();
  };

  const options = [
    { value: false, title: "Kondisi baik", desc: "Semua unit kembali ke stok tersedia." },
    { value: true, title: "Ada yang rusak", desc: "Unit rusak ditambahkan ke jumlah rusak." },
  ];

  return (
    <Modal
      title="Catat Pengembalian"
      description={`${request.studentName} · ${request.itemName} (${qty} unit)`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form={formId}>
            Simpan Pengembalian
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-800">Kondisi barang saat dikembalikan</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {options.map((o) => (
              <label key={o.title} className="block cursor-pointer">
                <input
                  type="radio"
                  name={`${uid}-condition`}
                  checked={isDamaged === o.value}
                  onChange={() => {
                    setIsDamaged(o.value);
                    setError("");
                  }}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "block h-full rounded-lg border p-3 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600",
                    isDamaged === o.value
                      ? o.value
                        ? "border-red-500 bg-red-50 ring-1 ring-red-500"
                        : "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                      : "border-slate-300 bg-white hover:border-slate-400",
                  )}
                >
                  <span className="block text-sm font-semibold text-slate-900">{o.title}</span>
                  <span className="mt-0.5 block text-xs text-slate-600">{o.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {isDamaged && (
          <Field
            id={`${uid}-damaged`}
            label="Jumlah unit rusak"
            required
            error={error}
            hint={`Maksimal ${qty} unit sesuai jumlah yang dipinjam.`}
          >
            <input
              id={`${uid}-damaged`}
              type="number"
              inputMode="numeric"
              min={1}
              max={qty}
              step={1}
              value={damaged}
              onChange={(e) => {
                setDamaged(e.target.value);
                if (error) setError("");
              }}
              aria-invalid={!!error || undefined}
              aria-describedby={describedBy(`${uid}-damaged`, error, "hint")}
              className={cn(inputClass(!!error), "h-10")}
            />
          </Field>
        )}

        <Field id={`${uid}-note`} label="Catatan" hint="Opsional, misalnya penjelasan kerusakan.">
          <textarea
            id={`${uid}-note`}
            rows={3}
            value={note}
            maxLength={220}
            onChange={(e) => setNote(e.target.value)}
            className={cn(inputClass(false), "resize-y py-2")}
          />
        </Field>

        {validPreview && (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <strong className="tabular-nums text-slate-900">{qty - damagedUnits}</strong> unit kembali ke stok
            tersedia
            {damagedUnits > 0 && (
              <>
                , <strong className="tabular-nums text-red-700">{damagedUnits}</strong> unit dicatat rusak
              </>
            )}
            .
          </p>
        )}
      </form>
    </Modal>
  );
}
