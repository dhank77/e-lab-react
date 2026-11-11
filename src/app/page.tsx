import type { Metadata } from "next";
import { LoginView } from "@/components/LoginView";

export const metadata: Metadata = { title: "Masuk" };

export default function HomePage() {
  return <LoginView />;
}
