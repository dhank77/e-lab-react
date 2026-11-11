import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function MahasiswaLayout({ children }: { children: ReactNode }) {
  return <AppShell role="mahasiswa">{children}</AppShell>;
}
