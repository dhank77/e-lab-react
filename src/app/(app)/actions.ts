"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; success?: string } | undefined;

function num(v: FormDataEntryValue | null) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

/* ---------------- User ---------------- */

export async function requestLoan(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const itemId = String(formData.get("item_id"));
  const labId = String(formData.get("lab_id"));
  const quantity = num(formData.get("quantity"));
  const dueDate = String(formData.get("due_date") ?? "");
  const purpose = String(formData.get("purpose") ?? "").trim() || null;

  if (!dueDate) return { error: "Tanggal kembali wajib diisi." };
  if (!(quantity > 0)) return { error: "Jumlah tidak valid." };

  const { error } = await supabase.rpc("request_loan", {
    p_item_id: itemId,
    p_quantity: quantity,
    p_due_date: dueDate,
    p_purpose: purpose,
  });
  if (error) return { error: error.message };

  revalidatePath(`/labs/${labId}`);
  revalidatePath("/peminjaman");
  return { success: "Pengajuan dikirim. Tunggu persetujuan admin." };
}

export async function cancelLoan(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_loan", { p_loan_id: String(formData.get("loan_id")) });
  revalidatePath("/peminjaman");
  revalidatePath("/dashboard");
  if (error) redirect(`/peminjaman?error=${encodeURIComponent(error.message)}`);
}

/* ---------------- Admin: peminjaman ---------------- */

export async function adminLoanAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("loan_id"));
  const op = String(formData.get("op"));
  const note = String(formData.get("note") ?? "").trim() || null;

  const { error } =
    op === "approve"
      ? await supabase.rpc("approve_loan", { p_loan_id: id, p_note: note })
      : op === "reject"
        ? await supabase.rpc("reject_loan", { p_loan_id: id, p_note: note })
        : await supabase.rpc("return_loan", { p_loan_id: id });

  revalidatePath("/admin");
  revalidatePath("/labs", "layout");
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
}

/* ---------------- Admin: inventaris ---------------- */

export async function createLab(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nama lab wajib diisi." };

  const { error } = await supabase.from("labs").insert({
    name,
    location: String(formData.get("location") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/inventaris");
  revalidatePath("/labs");
  return { success: `Lab "${name}" ditambahkan.` };
}

export async function createItem(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const labId = String(formData.get("lab_id") ?? "");
  const qty = num(formData.get("quantity_total"));
  if (!name || !labId) return { error: "Nama barang dan lab wajib diisi." };
  if (!(qty >= 0)) return { error: "Jumlah tidak valid." };

  const { error } = await supabase.from("items").insert({
    lab_id: labId,
    name,
    code: String(formData.get("code") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    quantity_total: qty,
    quantity_available: qty,
    condition: String(formData.get("condition") ?? "baik"),
  });
  if (error) return { error: error.code === "23505" ? "Kode barang sudah dipakai." : error.message };

  revalidatePath("/admin/inventaris");
  revalidatePath(`/labs/${labId}`);
  return { success: `Barang "${name}" ditambahkan.` };
}

export async function deleteItem(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("items").delete().eq("id", String(formData.get("item_id")));
  revalidatePath("/admin/inventaris");
  revalidatePath("/labs", "layout");
}

export async function deleteLab(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("labs").delete().eq("id", String(formData.get("lab_id")));
  revalidatePath("/admin/inventaris");
  revalidatePath("/labs", "layout");
}
