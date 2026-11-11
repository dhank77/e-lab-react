import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const accents = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  violet: "bg-violet-50 text-violet-600",
};

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon: IconName;
  accent: keyof typeof accents;
  hint?: string;
  href?: string;
};

export function StatCard({ label, value, icon, accent, hint, href }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-xl", accents[accent])}>
          <Icon name={icon} className="size-5" />
        </span>
      </div>
      <div className="mt-3">
        <p className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
    </>
  );
  const cls = "block min-h-[7.5rem] rounded-xl border border-slate-200 bg-white p-5 shadow-sm";
  if (href) {
    return (
      <Link href={href} className={cn(cls, "transition-colors hover:border-blue-300 focus-visible:outline-2 focus-visible:outline-blue-600")}>
        {content}
      </Link>
    );
  }
  return <div className={cls}>{content}</div>;
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icon name={icon} className="size-7" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-slate-200/70", className)} />;
}

/** Placeholder dengan tinggi tetap agar tidak terjadi pergeseran tata letak (CLS). */
export function PageSkeleton({ cards = 0, height = "h-[28rem]" }: { cards?: number; height?: string }) {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Memuat data…</span>
      {cards > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: cards }).map((_, i) => (
            <Skeleton key={i} className="h-[7.5rem] rounded-xl" />
          ))}
        </div>
      )}
      <Skeleton className={cn("rounded-xl", height)} />
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>{children}</section>;
}
