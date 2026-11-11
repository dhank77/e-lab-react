import { AuthCard } from "@/components/AuthCard";
import { RegisterForm } from "./RegisterForm";

export const metadata = { title: "Daftar — E-Lab" };

export default function RegisterPage() {
  return (
    <AuthCard title="Buat akun" subtitle="Daftar untuk mulai meminjam barang lab.">
      <RegisterForm />
    </AuthCard>
  );
}
