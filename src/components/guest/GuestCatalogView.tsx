"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ConditionBadge } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { SearchInput, Select } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, Skeleton } from "@/components/ui/Layout";
import { getAvailable, getCondition } from "@/lib/inventory";
import { useStore } from "@/lib/store";

export function GuestCatalogView() {
  const { ready, items } = useStore();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort((a, b) => a.localeCompare(b, "id")),
    [items],
  );
  const activeCategory = categories.includes(category) ? category : "";

  const list = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return items
      .filter(
        (i) =>
          (!q || i.name.toLowerCase().includes(q)) &&
          (!activeCategory || i.category === activeCategory),
      )
      .sort((a, b) => a.name.localeCompare(b.name, "id", { sensitivity: "base" }));
  }, [items, deferredQuery, activeCategory]);

  const filtering = query.trim() !== "" || activeCategory !== "";
  const reset = () => {
    setQuery("");
    setCategory("");
  };

  return (
    <div className="min-h-dvh bg-blue-50 text-slate-800">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-5 sm:px-6 sm:py-6">
        <Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Icon name="flask" className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-bold text-blue-950">E-Lab</span>
            <span className="block text-xs text-slate-600">Inventaris Laboratorium</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="rounded-md bg-blue-100 px-2.5 py-1 text-xs font-bold tracking-widest text-blue-800">
            GUEST
          </span>
          <Link href="/" className={buttonClass("secondary", "sm", "hidden sm:inline-flex")}>
            Masuk
          </Link>
          <Link href="/daftar" className={buttonClass("primary", "sm")}>
            Daftar
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-3 pb-8 pt-2 sm:px-6 sm:pb-12">
        <section className="rounded-3xl bg-white p-5 shadow-[0_16px_45px_rgba(30,64,175,0.09)] sm:p-8 lg:p-10">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl">
              Katalog Alat Laboratorium
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Lihat kategori, kondisi, dan jumlah alat yang tersedia.
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
            <SearchInput
              label="Cari nama barang"
              placeholder="Cari nama barang…"
              value={query}
              onChange={setQuery}
            />
            <Select
              aria-label="Filter kategori"
              value={activeCategory}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Semua kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <h2 className="text-sm font-semibold text-blue-950">Daftar barang</h2>
            <p className="text-sm text-slate-500" aria-live="polite">
              {ready ? `${list.length} barang` : "Memuat…"}
            </p>
          </div>

          {!ready ? (
            <div className="divide-y divide-slate-200" role="status">
              <span className="sr-only">Memuat katalog…</span>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-5">
                  <div className="w-full max-w-sm space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <EmptyState
              icon="search"
              title={items.length === 0 ? "Katalog masih kosong" : "Barang tidak ditemukan"}
              description={
                items.length === 0
                  ? "Belum ada alat yang terdaftar di inventaris laboratorium."
                  : "Tidak ada barang yang cocok dengan pencarian atau kategori yang dipilih. Coba kata kunci lain."
              }
              action={
                filtering ? (
                  <Button variant="secondary" onClick={reset}>
                    Atur Ulang Filter
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-slate-200">
              {list.map((item) => {
                const available = getAvailable(item);
                return (
                  <li key={item.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                      <h3 className="font-bold text-blue-950">{item.name}</h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500">
                        <span>{item.category}</span>
                        <span aria-hidden="true" className="text-slate-300">•</span>
                        <ConditionBadge condition={getCondition(item)} />
                      </div>
                    </div>
                    <p className="shrink-0 text-sm text-slate-600 sm:text-right">
                      <span className="text-xl font-bold tabular-nums text-blue-950">{available}</span>{" "}
                      unit tersedia
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-6 flex flex-col gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-950 sm:flex-row sm:items-center sm:justify-between">
            <p className="leading-relaxed">
              Halaman Guest bersifat hanya-baca. Masuk dengan akun mahasiswa untuk mengajukan peminjaman.
            </p>
            <Link href="/" className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600">
              Masuk
              <Icon name="arrowRight" className="size-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
