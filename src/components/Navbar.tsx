"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/auth/actions";

type NavItem = { href: string; label: string };

export function Navbar({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links: NavItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/labs", label: "Data Lab" },
    { href: "/peminjaman", label: "Peminjaman Saya" },
    ...(isAdmin
      ? [
          { href: "/admin", label: "Kelola Peminjaman" },
          { href: "/admin/inventaris", label: "Inventaris" },
        ]
      : []),
  ];

  const active = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">E</span>
          E-Lab
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                active(l.href) ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <span className="text-sm text-slate-600">
            {name}
            {isAdmin && <span className="badge ml-2 bg-slate-900 text-white ring-slate-900">Admin</span>}
          </span>
          <form action={logout}>
            <button className="btn-secondary">Keluar</button>
          </form>
        </div>

        <button className="btn-secondary md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          ☰
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                active(l.href) ? "bg-indigo-50 text-indigo-700" : "text-slate-600"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <form action={logout} className="mt-2">
            <button className="btn-secondary w-full">Keluar ({name})</button>
          </form>
        </div>
      )}
    </header>
  );
}
