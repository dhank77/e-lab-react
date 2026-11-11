"use client";

import { useActionState, useEffect, useRef } from "react";
import { createItem, createLab } from "@/app/(app)/actions";
import { Alert } from "@/components/Alert";
import { SubmitButton } from "@/components/SubmitButton";

function useResetOnSuccess(success?: string) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (success) ref.current?.reset();
  }, [success]);
  return ref;
}

export function LabForm() {
  const [state, action] = useActionState(createLab, undefined);
  const ref = useResetOnSuccess(state?.success);
  return (
    <form ref={ref} action={action} className="space-y-3">
      {state?.error && <Alert type="error">{state.error}</Alert>}
      {state?.success && <Alert type="success">{state.success}</Alert>}
      <input name="name" placeholder="Nama lab" required className="input" />
      <input name="location" placeholder="Lokasi (mis. Gedung A Lt. 2)" className="input" />
      <textarea name="description" placeholder="Deskripsi" rows={2} className="input" />
      <SubmitButton>Tambah lab</SubmitButton>
    </form>
  );
}

export function ItemForm({ labs }: { labs: { id: string; name: string }[] }) {
  const [state, action] = useActionState(createItem, undefined);
  const ref = useResetOnSuccess(state?.success);
  return (
    <form ref={ref} action={action} className="space-y-3">
      {state?.error && <Alert type="error">{state.error}</Alert>}
      {state?.success && <Alert type="success">{state.success}</Alert>}
      <select name="lab_id" required className="input" defaultValue="">
        <option value="" disabled>Pilih lab</option>
        {labs.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>
      <input name="name" placeholder="Nama barang" required className="input" />
      <div className="grid grid-cols-2 gap-3">
        <input name="code" placeholder="Kode (opsional)" className="input" />
        <input name="quantity_total" type="number" min={0} defaultValue={1} required className="input" />
      </div>
      <select name="condition" className="input" defaultValue="baik">
        <option value="baik">Baik</option>
        <option value="rusak_ringan">Rusak ringan</option>
        <option value="rusak_berat">Rusak berat</option>
      </select>
      <textarea name="description" placeholder="Deskripsi" rows={2} className="input" />
      <SubmitButton>Tambah barang</SubmitButton>
    </form>
  );
}
