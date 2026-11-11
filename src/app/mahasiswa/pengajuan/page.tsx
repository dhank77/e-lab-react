import type { Metadata } from "next";
import { PengajuanSayaView } from "@/components/requests/PengajuanSayaView";

export const metadata: Metadata = { title: "Pengajuan Saya" };

export default function PengajuanSayaPage() {
  return <PengajuanSayaView />;
}
