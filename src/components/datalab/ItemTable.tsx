import { ConditionBadge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/Button";
import { getAvailable, getCondition } from "@/lib/inventory";
import type { Item } from "@/lib/types";

type Props = {
  items: Item[];
  startIndex: number;
  onDetail: (item: Item) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
};

function Stock({ item }: { item: Item }) {
  const note = [
    item.borrowed > 0 ? `${item.borrowed} dipinjam` : "",
    item.damaged > 0 ? `${item.damaged} rusak` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div title={`Tersedia ${getAvailable(item)} dari total ${item.total} unit`}>
      <p className="tabular-nums">
        <span className="font-semibold text-slate-900">{getAvailable(item)}</span>
        <span className="text-slate-500"> / {item.total}</span>
      </p>
      {note && <p className="mt-0.5 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

function Actions({ item, onDetail, onEdit, onDelete }: Omit<Props, "items" | "startIndex"> & { item: Item }) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <IconButton icon="eye" label={`Lihat detail ${item.name}`} onClick={() => onDetail(item)} />
      <IconButton icon="pencil" label={`Ubah ${item.name}`} onClick={() => onEdit(item)} />
      <IconButton icon="trash" tone="danger" label={`Hapus ${item.name}`} onClick={() => onDelete(item)} />
    </div>
  );
}

export function ItemTable({ items, startIndex, onDetail, onEdit, onDelete }: Props) {
  return (
    <>
      {/* Tabel (tablet & desktop) */}
      <table className="hidden w-full text-left text-sm md:table">
        <thead>
          <tr className="border-y border-slate-200 bg-slate-50/70 text-slate-600">
            <th scope="col" className="w-16 px-5 py-3 font-medium">No.</th>
            <th scope="col" className="px-3 py-3 font-medium">Nama Barang</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Jumlah Tersedia</th>
            <th scope="col" className="px-3 py-3 font-medium">Kondisi</th>
            <th scope="col" className="px-5 py-3 text-right font-medium">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item, i) => (
            <tr key={item.id} className="hover:bg-slate-50/70">
              <td className="px-5 py-3 text-slate-600 tabular-nums">{startIndex + i + 1}</td>
              <td className="px-3 py-3">
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">{item.category}</p>
              </td>
              <td className="px-3 py-3 text-right">
                <Stock item={item} />
              </td>
              <td className="px-3 py-3">
                <ConditionBadge condition={getCondition(item)} />
              </td>
              <td className="px-5 py-3">
                <Actions item={item} onDetail={onDetail} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Daftar kartu (ponsel) */}
      <ul className="divide-y divide-slate-100 border-t border-slate-200 md:hidden">
        {items.map((item, i) => (
          <li key={item.id} className="px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">
                  {startIndex + i + 1}. {item.category}
                </p>
                <p className="mt-0.5 font-medium text-slate-900">{item.name}</p>
              </div>
              <ConditionBadge condition={getCondition(item)} />
            </div>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">Jumlah tersedia</p>
                <Stock item={item} />
              </div>
              <Actions item={item} onDetail={onDetail} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
