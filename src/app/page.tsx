import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const features = [
    { title: "Data Lab Lengkap", desc: "Lihat daftar laboratorium beserta barang, kondisi, dan stok tersedia." },
    { title: "Pinjam Online", desc: "Ajukan peminjaman barang dengan memilih jumlah dan tanggal kembali." },
    { title: "Pantau Status", desc: "Lacak pengajuan: menunggu, dipinjam, dikembalikan, atau ditolak." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <span className="flex items-center gap-2 font-bold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">E</span>
          E-Lab
        </span>
        <div className="flex gap-2">
          {user ? (
            <Link href="/dashboard" className="btn-primary">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn-secondary">Masuk</Link>
              <Link href="/register" className="btn-primary">Daftar</Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-16 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Peminjaman barang laboratorium, <span className="text-indigo-600">tanpa ribet</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          E-Lab membantu mahasiswa dan laboran mengelola data lab, inventaris, dan peminjaman barang dalam satu tempat.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href={user ? "/labs" : "/register"} className="btn-primary px-6 py-3 text-base">
            {user ? "Lihat Lab" : "Mulai sekarang"}
          </Link>
        </div>

        <div className="mt-20 grid gap-6 text-left sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-6">
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
