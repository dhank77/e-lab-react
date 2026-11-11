import { requireAdmin } from "@/lib/auth";
import { CONDITION_LABEL } from "@/lib/format";
import type { Item, Lab } from "@/lib/types";
import { deleteItem, deleteLab } from "../../actions";
import { ItemForm, LabForm } from "./Forms";

export const metadata = { title: "Inventaris — E-Lab" };

type LabWithItems = Lab & { items: Item[] };

export default async function InventoryPage() {
  const { supabase } = await requireAdmin();
  const { data: labs } = await supabase
    .from("labs")
    .select("*, items(*)")
    .order("name")
    .returns<LabWithItems[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Inventaris</h1>
        <p className="mt-1 text-slate-500">Kelola data lab dan barang.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Tambah lab</h2>
            <LabForm />
          </section>
          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Tambah barang</h2>
            <ItemForm labs={(labs ?? []).map((l) => ({ id: l.id, name: l.name }))} />
          </section>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {labs?.map((lab) => (
            <section key={lab.id} className="card overflow-x-auto">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{lab.name}</h2>
                  <p className="text-sm text-slate-500">{lab.location}</p>
                </div>
                <form action={deleteLab}>
                  <input type="hidden" name="lab_id" value={lab.id} />
                  <button className="text-sm text-red-600 hover:underline" title="Menghapus lab juga menghapus semua barangnya">
                    Hapus lab
                  </button>
                </form>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Barang</th>
                    <th>Kode</th>
                    <th>Kondisi</th>
                    <th className="text-center">Stok</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {lab.items.map((i) => (
                    <tr key={i.id}>
                      <td className="font-medium text-slate-900">{i.name}</td>
                      <td className="font-mono text-sm">{i.code ?? "-"}</td>
                      <td className="text-sm">{CONDITION_LABEL[i.condition]}</td>
                      <td className="text-center">{i.quantity_available}/{i.quantity_total}</td>
                      <td className="text-right">
                        <form action={deleteItem}>
                          <input type="hidden" name="item_id" value={i.id} />
                          <button className="text-sm text-red-600 hover:underline">Hapus</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {lab.items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-slate-500">Belum ada barang.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
