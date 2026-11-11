import type { Metadata } from "next";
import { KatalogView } from "@/components/catalog/KatalogView";

export const metadata: Metadata = { title: "Katalog Alat" };

export default function KatalogPage() {
  return <KatalogView />;
}
