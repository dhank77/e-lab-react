"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Gate } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { SearchInput, Select } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { Card, EmptyState, PageHeader, PageSkeleton, StatCard } from "@/components/ui/Layout";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { getAvailable, getCondition, getSummary } from "@/lib/inventory";
import { useStore } from "@/lib/store";
import { CONDITIONS, type Item } from "@/lib/types";
import { ItemDetail } from "./ItemDetail";
import { ItemForm } from "./ItemForm";
import { ItemTable } from "./ItemTable";

const PAGE_SIZE = 20;
const FORM_ID = "item-form";

type ModalState = { type: "add" } | { type: "detail" | "edit" | "delete"; id: string } | null;

export function DataLabView() {
  const { items, requests, addItem, updateItem, deleteItem, markDamaged, markRepaired } = useStore();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>(null);

  const summary = useMemo(() => getSummary(items, requests), [items, requests]);
  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort((a, b) => a.localeCompare(b, "id")),
    [items],
  );
  const activeCategory = categories.includes(category) ? category : "";

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return items.filter(
      (i) =>
        (!q || i.name.toLowerCase().includes(q)) &&
        (!activeCategory || i.category === activeCategory) &&
        (!condition || getCondition(i) === condition),
    );
  }, [items, deferredQuery, activeCategory, condition]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(startIndex, startIndex + PAGE_SIZE);
  const filtering = query.trim() !== "" || activeCategory !== "" || condition !== "";

  const resetFilters = () => {
    setQuery("");
    setCategory("");
    setCondition("");
    setPage(1);
  };

  const selected: Item | undefined =
    modal && modal.type !== "add" ? items.find((i) => i.id === modal.id) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Lab"
        description="Kelola inventaris alat laboratorium: tambah barang, perbarui jumlah dan kondisi, serta pantau stok yang tersedia untuk dipinjam."
        action={
          <Button icon="plus" className="h-11 w-full px-5 sm:w-auto" onClick={() => setModal({ type: "add" })}>
            Tambah Barang
          </Button>
        }
      />

      <Gate fallback={<PageSkeleton cards={4} />}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Jenis barang" value={summary.itemTypes} icon="layers" accent="blue" />
          <StatCard label="Unit tersedia" value={summary.available} icon="box" accent="green" />
          <StatCard
            label="Pengajuan menunggu"
            value={summary.pending}
            icon="clipboard"
            accent="amber"
            href="/petugas/pengajuan"
          />
          <StatCard label="Unit rusak" value={summary.damaged} icon="alert" accent="red" />
        </div>

        <Card>
          <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_14rem_12rem]">
            <SearchInput
              label="Cari nama barang"
              placeholder="Cari nama barang…"
              value={query}
              onChange={(v) => {
                setQuery(v);
                setPage(1);
              }}
            />
            <Select
              aria-label="Filter kategori"
              value={activeCategory}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filter kondisi"
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua kondisi</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          {items.length === 0 ? (
            <EmptyState
              title="Belum ada data barang"
              description="Inventaris masih kosong. Tambahkan barang pertama untuk mulai mengelola stok laboratorium."
              action={
                <Button icon="plus" onClick={() => setModal({ type: "add" })}>
                  Tambah Barang
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            <div className="border-t border-slate-200">
              <EmptyState
                icon="search"
                title="Barang tidak ditemukan"
                description="Tidak ada barang yang cocok dengan pencarian atau filter yang dipilih. Coba kata kunci lain atau atur ulang filter."
                action={
                  <Button variant="secondary" onClick={resetFilters}>
                    Atur Ulang Filter
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <ItemTable
                items={visible}
                startIndex={startIndex}
                onDetail={(i) => setModal({ type: "detail", id: i.id })}
                onEdit={(i) => setModal({ type: "edit", id: i.id })}
                onDelete={(i) => setModal({ type: "delete", id: i.id })}
              />
              <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p aria-live="polite">
                  Menampilkan {visible.length} dari {filtered.length} barang
                  {filtering ? ` (total ${items.length})` : ""}
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      <Icon name="chevronLeft" className="size-4" />
                      Sebelumnya
                    </Button>
                    <span className="px-1 tabular-nums">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      Selanjutnya
                      <Icon name="chevronRight" className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </Gate>

      {modal?.type === "add" && (
        <Modal
          title="Tambah Barang"
          description="Isi data barang baru. Jumlah tersedia dihitung otomatis."
          onClose={() => setModal(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(null)}>
                Batal
              </Button>
              <Button type="submit" form={FORM_ID}>
                Simpan Barang
              </Button>
            </>
          }
        >
          <ItemForm
            formId={FORM_ID}
            items={items}
            categories={categories}
            onSubmit={(values) => {
              const ok = addItem(values);
              if (ok) setModal(null);
              return ok;
            }}
          />
        </Modal>
      )}

      {modal?.type === "edit" && selected && (
        <Modal
          title="Ubah Barang"
          description={`Perbarui data ${selected.name}.`}
          onClose={() => setModal(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(null)}>
                Batal
              </Button>
              <Button type="submit" form={FORM_ID}>
                Simpan Perubahan
              </Button>
            </>
          }
        >
          <ItemForm
            formId={FORM_ID}
            item={selected}
            items={items}
            categories={categories}
            onSubmit={(values) => {
              const ok = updateItem(selected.id, values);
              if (ok) setModal(null);
              return ok;
            }}
          />
        </Modal>
      )}

      {modal?.type === "detail" && selected && (
        <ItemDetail
          item={selected}
          activeLoans={requests.filter((r) => r.itemId === selected.id && r.status === "Sedang Dipinjam")}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: "edit", id: selected.id })}
          onDelete={() => setModal({ type: "delete", id: selected.id })}
          onMarkDamaged={(units) => markDamaged(selected.id, units)}
          onMarkRepaired={(units) => markRepaired(selected.id, units)}
        />
      )}

      {modal?.type === "delete" && selected && (
        <ConfirmDialog
          title="Hapus barang?"
          confirmLabel="Ya, Hapus"
          disabled={selected.borrowed > 0}
          onCancel={() => setModal(null)}
          onConfirm={() => {
            if (deleteItem(selected.id)) setModal(null);
          }}
          message={
            <div className="space-y-3">
              <p>
                Anda akan menghapus <strong className="text-slate-900">{selected.name}</strong> (
                {getAvailable(selected)} unit tersedia dari total {selected.total}) dari inventaris.
                Tindakan ini tidak dapat dibatalkan.
              </p>
              {selected.borrowed > 0 ? (
                <p className="rounded-lg bg-red-50 p-3 text-red-800">
                  Barang tidak dapat dihapus karena {selected.borrowed} unit masih dipinjam. Catat
                  pengembaliannya terlebih dahulu.
                </p>
              ) : (
                <p className="text-slate-600">
                  Pengajuan yang masih menunggu atau disetujui untuk barang ini akan otomatis ditolak.
                </p>
              )}
            </div>
          }
        />
      )}
    </div>
  );
}
