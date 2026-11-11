import type { Metadata } from "next";
import { DataLabView } from "@/components/datalab/DataLabView";

export const metadata: Metadata = { title: "Data Lab" };

export default function DataLabPage() {
  return <DataLabView />;
}
