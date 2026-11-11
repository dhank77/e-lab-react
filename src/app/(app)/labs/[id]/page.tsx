import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { CONDITION_LABEL } from "@/lib/format";
import type { Item, Lab } from "@/lib/types";
import { BorrowForm } from "./BorrowForm";

export default async function LabDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const { data: lab } = await supabase.from("labs").select("*").eq("id", id).maybeSingle<Lab>();
  if (!lab) notFound();

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("lab_id", id)
    .order("name")
    .returns<Item[]>();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/labs" className="text-sm text-slate-500 hover:text-slate-900">← Semua lab</Link>
        <h1 className="page-title mt-2">{lab.name}</h1>
        <p className="mt-1 text-slate-500">
          {lab.location && <>📍 {lab.location} · </>}
          {lab.description}
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Barang</th>
              <th>Kode</th>
              <th>Kondisi</th>
              <th className="text-center">Tersedia</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item) => (
              <tr key={item.id}>
                <td>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  {item.description && <p className="text-sm text-slate-500">{item.description}</p>}
                </td>
                <td className="font-mono text-sm text-slate-600">{item.code ?? "-"}</td>
                <td className="text-sm">{CONDITION_LABEL[item.condition]}</td>
                <td className="text-center">
                  <span className={item.quantity_available > 0 ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>
                    {item.quantity_available}
                  </span>
                  <span className="text-slate-400"> / {item.quantity_total}</span>
                </td>
                <td className="text-right">
                  <BorrowForm itemId={item.id} labId={lab.id} itemName={item.name} available={item.quantity_available} />
                </td>
              </tr>
            ))}
            {items?.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-500">Belum ada barang di lab ini.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
