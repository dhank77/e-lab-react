"use client";

import { useActionState, useState } from "react";
import { requestLoan } from "@/app/(app)/actions";
import { Alert } from "@/components/Alert";
import { SubmitButton } from "@/components/SubmitButton";

export function BorrowForm({
  itemId,
  labId,
  itemName,
  available,
}: {
  itemId: string;
  labId: string;
  itemName: string;
  available: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(requestLoan, undefined);
  const today = new Date().toISOString().slice(0, 10);

  if (available < 1) return <span className="text-sm text-slate-400">Stok habis</span>;

  if (!open)
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        Pinjam
      </button>
    );

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-slate-900/40 px-4" onClick={() => setOpen(false)}>
      <div className="card w-full max-w-md p-6 text-left" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-900">Pinjam {itemName}</h3>
        <p className="text-sm text-slate-500">Tersedia {available} unit</p>

        {state?.success ? (
          <div className="mt-4 space-y-4">
            <Alert type="success">{state.success}</Alert>
            <button className="btn-secondary w-full" onClick={() => setOpen(false)}>Tutup</button>
          </div>
        ) : (
          <form action={action} className="mt-4 space-y-4">
            {state?.error && <Alert type="error">{state.error}</Alert>}
            <input type="hidden" name="item_id" value={itemId} />
            <input type="hidden" name="lab_id" value={labId} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="quantity">Jumlah</label>
                <input id="quantity" name="quantity" type="number" min={1} max={available} defaultValue={1} required className="input" />
              </div>
              <div>
                <label className="label" htmlFor="due_date">Tanggal kembali</label>
                <input id="due_date" name="due_date" type="date" min={today} required className="input" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="purpose">Keperluan</label>
              <textarea id="purpose" name="purpose" rows={3} className="input" placeholder="Contoh: Praktikum Rekayasa Web" />
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => setOpen(false)}>Batal</button>
              <SubmitButton className="btn-primary flex-1" pendingText="Mengirim...">Ajukan</SubmitButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
