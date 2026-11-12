"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Gate } from "@/components/layout/AppShell";
import { Badge, ConditionBadge } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { SearchInput, Select } from "@/components/ui/Form";
import { Card, EmptyState, PageHeader, PageSkeleton } from "@/components/ui/Layout";
import { Modal } from "@/components/ui/Modal";
import { getAvailable, getCondition } from "@/lib/inventory";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { RequestForm } from "./RequestForm";

const FORM_ID = "request-form";

type Dialog = { itemId: string } | null;

export function KatalogView() {
  const { items, submitRequest } = useStore();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort((a, b) => a.localeCompare(b, "id")),
    [items],
  );
  const activeCategory = categories.includes(category) ? category : "";

  const list = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return items.filter(
      (i) =>
        (!q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)) &&
        (!activeCategory || i.category === activeCategory) &&
        (!onlyAvailable || getAvailable(i) > 0),
    );
  }, [items, deferredQuery, activeCategory, onlyAvailable]);

  const reset = () => {
    setQuery("");
    setCategory("");
    setOnlyAvailable(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Katalog Alat"
        description="Telusuri alat laboratorium yang tersedia, lalu ajukan peminjaman. Petugas akan memeriksa pengajuan Anda."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/mahasiswa/pengajuan" className={buttonClass("secondary", "md", "h-11 px-5")}>
              Pengajuan Saya
            </Link>
            <Button icon="plus" className="h-11 px-5" onClick={() => setDialog({ itemId: "" })}>
              Ajukan Peminjaman
            </Button>
          </div>
        }
      />

      <Gate fallback={<PageSkeleton height="h-[32rem]" />}>
        <Card>
          <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_14rem]">
            <SearchInput
              label="Cari alat"
              placeholder="Cari nama alat…"
              value={query}
              onChange={setQuery}
            />
            <Select aria-label="Filter kategori" value={activeCategory} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Semua kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 md:col-span-2">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="size-4 rounded border-slate-300 accent-blue-600"
              />
              Hanya tampilkan alat yang tersedia
            </label>
          </div>
        </Card>

        <p className="text-sm text-slate-600" aria-live="polite">
          Menampilkan {list.length} dari {items.length} alat
        </p>

        {items.length === 0 ? (
          <Card>
            <EmptyState title="Katalog masih kosong" description="Belum ada alat yang terdaftar di inventaris laboratorium." />
          </Card>
        ) : list.length === 0 ? (
          <Card>
            <EmptyState
              icon="search"
              title="Alat tidak ditemukan"
              description="Coba kata kunci atau kategori lain."
              action={
                <Button variant="secondary" onClick={reset}>
                  Atur Ulang Filter
                </Button>
              }
            />
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((item) => {
              const available = getAvailable(item);
              return (
                <li key={item.id}>
                  <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <Badge tone="info">{item.category}</Badge>
                      <ConditionBadge condition={getCondition(item)} />
                    </div>
                    <h2 className="mt-3 text-base font-semibold text-slate-900">{item.name}</h2>
                    <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-600">
                      {item.description || "Belum ada keterangan."}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <p className="text-sm">
                        <span className={cn("text-xl font-bold tabular-nums", available === 0 ? "text-red-600" : "text-slate-900")}>
                          {available}
                        </span>
                        <span className="text-slate-500"> unit tersedia</span>
                      </p>
                      <Button
                        size="sm"
                        disabled={available === 0}
                        onClick={() => setDialog({ itemId: item.id })}
                        aria-label={`Ajukan pinjam ${item.name}`}
                      >
                        {available === 0 ? "Stok habis" : "Ajukan Pinjam"}
                      </Button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </Gate>

      {dialog && (
        <Modal
          title="Ajukan Peminjaman"
          description="Pengajuan akan diperiksa oleh petugas laboratorium."
          onClose={() => setDialog(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDialog(null)}>
                Batal
              </Button>
              <Button type="submit" form={FORM_ID}>
                Kirim Pengajuan
              </Button>
            </>
          }
        >
          <RequestForm
            formId={FORM_ID}
            items={items}
            initialItemId={dialog.itemId}
            onSubmit={async (values) => {
              const ok = await submitRequest(values);
              if (ok) setDialog(null);
              return ok;
            }}
          />
        </Modal>
      )}
    </div>
  );
}
