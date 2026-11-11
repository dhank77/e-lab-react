import { AuthCard } from "@/components/AuthCard";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Masuk — E-Lab" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <AuthCard title="Masuk" subtitle="Masuk untuk melihat lab dan meminjam barang.">
      <LoginForm next={next} notice={error === "confirm" ? "Link konfirmasi tidak valid atau kedaluwarsa." : undefined} />
    </AuthCard>
  );
}
