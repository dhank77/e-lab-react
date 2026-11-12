import type { Role } from "./types";

const ACCOUNTS_KEY = "labpinjam:v1:student-accounts"; // legacy, no longer used
export const STAFF_EMAIL = "hherawatii083@gmail.com";

export type RegisterValues = {
  name: string;
  nim: string;
  password: string;
  confirmPassword: string;
};

export type RegisterErrors = Partial<Record<keyof RegisterValues, string>>;

export function normalizeNim(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidNim(value: string): boolean {
  return normalizeNim(value).length > 0;
}

export function validateRegistration(values: RegisterValues): {
  errors: RegisterErrors;
  parsed: { name: string; nim: string; password: string } | null;
} {
  const errors: RegisterErrors = {};
  const name = values.name.trim().replace(/\s+/g, " ");
  const nim = normalizeNim(values.nim);

  if (!name) errors.name = "Nama lengkap wajib diisi.";

  if (!nim) errors.nim = "NIM wajib diisi.";

  if (!values.password) errors.password = "Kata sandi wajib diisi.";
  else if (values.password.length < 6) errors.password = "Kata sandi minimal 6 karakter.";
  else if (values.password.length > 72) errors.password = "Kata sandi maksimal 72 karakter.";

  if (!values.confirmPassword) errors.confirmPassword = "Ulangi kata sandi Anda.";
  else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Kata sandi dan ulangi kata sandi tidak sama.";
  }

  if (Object.keys(errors).length > 0) return { errors, parsed: null };
  return { errors, parsed: { name, nim, password: values.password } };
}
