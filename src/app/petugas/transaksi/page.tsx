import type { Metadata } from "next";
import { TransaksiView } from "@/components/transactions/TransaksiView";

export const metadata: Metadata = { title: "Riwayat Transaksi" };

export default function TransaksiPage() {
  return <TransaksiView />;
}
