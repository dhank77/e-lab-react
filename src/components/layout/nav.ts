import type { IconName } from "@/components/ui/Icon";
import type { Role } from "@/lib/types";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: IconName;
  badge?: "pending";
};

export const NAV: Record<Role, NavItem[]> = {
  petugas: [
    { href: "/petugas/dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: "dashboard" },
    { href: "/petugas/data-lab", label: "Data Lab", shortLabel: "Data Lab", icon: "box" },
    { href: "/petugas/pengajuan", label: "Pengajuan", shortLabel: "Pengajuan", icon: "clipboard", badge: "pending" },
    { href: "/petugas/transaksi", label: "Riwayat Transaksi", shortLabel: "Riwayat", icon: "history" },
  ],
  mahasiswa: [
    { href: "/mahasiswa/katalog", label: "Katalog Alat", shortLabel: "Katalog", icon: "grid" },
    { href: "/mahasiswa/pengajuan", label: "Pengajuan Saya", shortLabel: "Pengajuan", icon: "clipboard" },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  petugas: "Petugas Lab",
  mahasiswa: "Mahasiswa",
};

export function homeFor(role: Role): string {
  return role === "petugas" ? "/petugas/dashboard" : "/mahasiswa/katalog";
}
