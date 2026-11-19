import type { Metadata } from "next";
import { RiwayatAktivitasView } from "@/components/requests/RiwayatAktivitasView";

export const metadata: Metadata = { title: "Riwayat Aktivitas" };

export default function RiwayatAktivitasPage() {
  return <RiwayatAktivitasView />;
}
