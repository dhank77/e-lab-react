import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatDate, isOverdue } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import type { LoanStatus } from "@/lib/types";

export const metadata = { title: "Dashboard — E-Lab" };

type LoanRow = {
  id: string;
  quantity: number;
  due_date: string;
  status: LoanStatus;
  created_at: string;
  items: { name: string; labs: { name: string } | null } | null;
};

export default async function DashboardPage() {
  const { supabase, user, profile } = await requireUser();

  const [labs, items, active, pending, recent] = await Promise.all([
    supabase.from("labs").select("*", { count: "exact", head: true }),
    supabase.from("items").select("*", { count: "exact", head: true }),
    supabase.from("loans").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "approved"),
    supabase.from("loans").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pending"),
    supabase
      .from("loans")
      .select("id, quantity, due_date, status, created_at, items(name, labs(name))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<LoanRow[]>(),
  ]);

  const stats = [
    { label: "Jumlah Lab", value: labs.count ?? 0, href: "/labs" },
    { label: "Jenis Barang", value: items.count ?? 0, href: "/labs" },
    { label: "Sedang Dipinjam", value: active.count ?? 0, href: "/peminjaman" },
    { label: "Menunggu Persetujuan", value: pending.count ?? 0, href: "/peminjaman" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Halo, {profile?.full_name || user.email} 👋</h1>
        <p className="mt-1 text-slate-500">Selamat datang di sistem peminjaman barang laboratorium.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-5 transition hover:shadow-md">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Peminjaman terbaru</h2>
          <Link href="/peminjaman" className="text-sm font-medium text-indigo-600 hover:underline">Lihat semua</Link>
        </div>
        {recent.data && recent.data.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {recent.data.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div>
                  <p className="font-medium text-slate-900">{l.items?.name} × {l.quantity}</p>
                  <p className="text-sm text-slate-500">{l.items?.labs?.name} · kembali {formatDate(l.due_date)}</p>
                </div>
                <StatusBadge status={l.status} overdue={isOverdue(l.due_date, l.status)} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-10 text-center text-slate-500">
            Belum ada peminjaman.{" "}
            <Link href="/labs" className="font-medium text-indigo-600 hover:underline">Pinjam barang sekarang</Link>
          </div>
        )}
      </div>
    </div>
  );
}
