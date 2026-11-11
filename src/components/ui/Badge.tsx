import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Condition, RequestStatus } from "@/lib/types";

type Tone = "success" | "danger" | "warning" | "info" | "violet" | "neutral";

const tones: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-700",
  danger: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-800",
  info: "bg-blue-50 text-blue-700",
  violet: "bg-violet-50 text-violet-700",
  neutral: "bg-slate-100 text-slate-700",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const conditionTone: Record<Condition, Tone> = {
  Baik: "success",
  Rusak: "danger",
  Campuran: "warning",
};

export function ConditionBadge({ condition }: { condition: Condition }) {
  return <Badge tone={conditionTone[condition]}>{condition}</Badge>;
}

const statusTone: Record<RequestStatus, Tone> = {
  Menunggu: "warning",
  Disetujui: "info",
  "Sedang Dipinjam": "violet",
  Selesai: "success",
  Ditolak: "danger",
  Dibatalkan: "neutral",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge tone={statusTone[status]}>{status}</Badge>;
}
