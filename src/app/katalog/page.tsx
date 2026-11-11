import type { Metadata } from "next";
import { GuestCatalogView } from "@/components/guest/GuestCatalogView";

export const metadata: Metadata = {
  title: "Katalog Alat Laboratorium",
  description: "Katalog publik alat laboratorium: kategori, kondisi, dan jumlah alat yang tersedia.",
};

export default function PublicCatalogPage() {
  return <GuestCatalogView />;
}
