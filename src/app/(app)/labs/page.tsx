import Link from "next/link";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Data Lab — E-Lab" };

type LabRow = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  items: { quantity_total: number; quantity_available: number }[];
};

export default async function LabsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { supabase } = await requireUser();

  let query = supabase
    .from("labs")
    .select("id, name, location, description, items(quantity_total, quantity_available)")
    .order("name");
  if (q) query = query.ilike("name", `%${q}%`);
  const { data: labs, error } = await query.returns<LabRow[]>();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Data Lab</h1>
          <p className="mt-1 text-slate-500">Pilih lab untuk melihat dan meminjam barang.</p>
        </div>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Cari lab..." className="input w-56" />
          <button className="btn-secondary">Cari</button>
        </form>
      </div>

      {error && <p className="text-red-600">{error.message}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {labs?.map((lab) => {
          const total = lab.items.reduce((a, i) => a + i.quantity_total, 0);
          const avail = lab.items.reduce((a, i) => a + i.quantity_available, 0);
          return (
            <Link key={lab.id} href={`/labs/${lab.id}`} className="card group flex flex-col p-5 transition hover:shadow-md">
              <h2 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600">{lab.name}</h2>
              {lab.location && <p className="mt-1 text-sm text-slate-500">📍 {lab.location}</p>}
              {lab.description && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{lab.description}</p>}
              <div className="mt-auto flex gap-4 pt-4 text-sm">
                <span><b className="text-slate-900">{lab.items.length}</b> <span className="text-slate-500">jenis barang</span></span>
                <span><b className="text-emerald-600">{avail}</b><span className="text-slate-500">/{total} tersedia</span></span>
              </div>
            </Link>
          );
        })}
      </div>

      {labs?.length === 0 && (
        <div className="card px-5 py-12 text-center text-slate-500">Belum ada data lab.</div>
      )}
    </div>
  );
}
