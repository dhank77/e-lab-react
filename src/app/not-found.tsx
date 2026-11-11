import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center">
      <div>
        <p className="text-5xl font-bold text-indigo-600">404</p>
        <p className="mt-2 text-slate-600">Halaman tidak ditemukan.</p>
        <Link href="/dashboard" className="btn-primary mt-6">Kembali</Link>
      </div>
    </main>
  );
}
