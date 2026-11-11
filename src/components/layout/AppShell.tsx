"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn, initials } from "@/lib/utils";
import { homeFor, NAV, ROLE_LABEL } from "./nav";

const ShellContext = createContext({ allowed: false });

/** Menampilkan `fallback` sampai data dimuat dan peran pengguna sesuai dengan area halaman. */
export function Gate({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  const { allowed } = useContext(ShellContext);
  return <>{allowed ? children : fallback}</>;
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
        <Icon name="flask" className="size-5" />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="text-base font-bold text-slate-900">E-Lab</p>
        <p className="text-xs text-slate-600">Inventaris Laboratorium</p>
      </div>
    </div>
  );
}

export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const { ready, session, requests, logout, resetData } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const allowed = ready && session?.role === role;

  useEffect(() => {
    if (!ready) return;
    if (!session) router.replace("/");
    else if (session.role !== role) router.replace(homeFor(session.role));
  }, [ready, session, role, router]);

  const pending = useMemo(() => requests.filter((r) => r.status === "Menunggu").length, [requests]);
  const nav = NAV[role];
  const ctx = useMemo(() => ({ allowed }), [allowed]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    router.replace("/");
  };

  const badgeFor = (item: (typeof nav)[number]) =>
    item.badge === "pending" && allowed && pending > 0 ? pending : 0;

  return (
    <ShellContext.Provider value={ctx}>
      <div className="min-h-dvh bg-slate-50">
        {/* Navigasi samping (desktop) */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="px-5 py-5">
            <Brand />
          </div>
          <nav aria-label="Menu utama" className="flex-1 overflow-y-auto px-4 pb-4">
            <p className="px-2 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Menu {role === "petugas" ? "Petugas Lab" : "Mahasiswa"}
            </p>
            <ul className="space-y-1">
              {nav.map((item) => {
                const active = isActive(item.href);
                const badge = badgeFor(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-600",
                        active ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <Icon name={item.icon} className="size-5" />
                      <span className="flex-1">{item.label}</span>
                      {badge > 0 && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="border-t border-slate-200 p-4">
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <Icon name="reset" className="size-4" />
              Atur ulang data
            </button>
            <div className="mt-4 flex min-h-11 items-center gap-3">
              {allowed && session ? (
                <>
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {initials(session.name)}
                  </span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-semibold text-slate-900">{session.name}</p>
                    <p className="text-xs text-slate-600">{ROLE_LABEL[role]}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    aria-label="Keluar"
                    title="Keluar"
                    className="inline-flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    <Icon name="logout" className="size-5" />
                  </button>
                </>
              ) : (
                <div className="h-10 w-full rounded-lg bg-slate-100" />
              )}
            </div>
          </div>
        </aside>

        {/* Bilah atas (tablet & ponsel) */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:hidden">
          <Brand />
          <div className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Menu akun"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex size-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {allowed && session ? initials(session.name) : <Icon name="user" className="size-5" />}
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Tutup menu akun"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                >
                  {session && (
                    <div className="border-b border-slate-100 px-3 pb-2 pt-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{session.name}</p>
                      <p className="text-xs text-slate-600">{ROLE_LABEL[role]}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmReset(true);
                    }}
                    className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Icon name="reset" className="size-4" />
                    Atur ulang data
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
                  >
                    <Icon name="logout" className="size-4" />
                    Keluar
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="lg:pl-72">
          <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-10">
            {children}
          </main>
        </div>

        {/* Navigasi bawah (tablet & ponsel) */}
        <nav
          aria-label="Menu utama"
          className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          {nav.map((item) => {
            const active = isActive(item.href);
            const badge = badgeFor(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-1 text-xs font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600",
                  active ? "text-blue-700" : "text-slate-600",
                )}
              >
                <span
                  className={cn(
                    "relative inline-flex h-7 w-12 items-center justify-center rounded-full",
                    active && "bg-blue-50",
                  )}
                >
                  <Icon name={item.icon} className="size-5" />
                  {badge > 0 && (
                    <span className="absolute -right-0.5 -top-1 min-w-4 rounded-full bg-blue-600 px-1 text-center text-[10px] font-bold leading-4 text-white">
                      {badge}
                    </span>
                  )}
                </span>
                {item.shortLabel}
              </Link>
            );
          })}
        </nav>

        {confirmReset && (
          <ConfirmDialog
            title="Atur ulang data?"
            tone="primary"
            confirmLabel="Atur Ulang"
            message="Semua barang, pengajuan, dan riwayat transaksi akan dikembalikan ke data awal. Perubahan yang sudah Anda buat akan hilang."
            onCancel={() => setConfirmReset(false)}
            onConfirm={() => {
              resetData();
              setConfirmReset(false);
            }}
          />
        )}
      </div>
    </ShellContext.Provider>
  );
}
