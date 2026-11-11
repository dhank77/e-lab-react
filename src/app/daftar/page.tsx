import type { Metadata } from "next";
import { RegisterView } from "@/components/auth/RegisterView";

export const metadata: Metadata = {
  title: "Daftar Akun Mahasiswa",
  description: "Buat akun mahasiswa E-Lab menggunakan NIM untuk mengajukan peminjaman alat laboratorium.",
};

export default function RegisterPage() {
  return <RegisterView />;
}
