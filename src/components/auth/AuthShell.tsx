import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section className="flex flex-col justify-between bg-blue-600 px-6 py-8 text-white sm:px-10 lg:px-14 lg:py-12">
        <Link href="/" className="flex w-fit items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-white/15">
            <Icon name="flask" className="size-6" />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-bold">E-Lab</span>
            <span className="block text-sm text-blue-100">Inventaris Laboratorium</span>
          </span>
        </Link>
        <div className="py-10 lg:py-0">
          <p className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Inventaris dan peminjaman alat laboratorium dalam satu tempat.
          </p>
          <ul className="mt-6 space-y-3 text-[15px] text-blue-50">
            {[
              "Stok tersedia, rusak, dan dipinjam terhitung otomatis.",
              "Ajukan peminjaman dengan akun mahasiswa dan pantau statusnya.",
              "Lihat katalog secara publik sebagai Guest tanpa mengubah data.",
            ].map((text) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Icon name="check" className="size-3.5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="hidden text-sm text-blue-100 lg:block">Prototipe sistem inventaris laboratorium.</p>
      </section>
      <section className="flex items-center justify-center bg-slate-50 px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </div>
  );
}

export function GuestLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/katalog"
      className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-800 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${className}`}
    >
      <Icon name="eye" className="size-4" />
      Guest
    </Link>
  );
}
