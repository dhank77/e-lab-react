import type { Metadata } from "next";
import { PengajuanPetugasView } from "@/components/requests/PengajuanPetugasView";

export const metadata: Metadata = { title: "Pengajuan" };

export default function PengajuanPetugasPage() {
  return <PengajuanPetugasView />;
}
