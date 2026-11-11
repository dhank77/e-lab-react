import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function PetugasLayout({ children }: { children: ReactNode }) {
  return <AppShell role="petugas">{children}</AppShell>;
}
