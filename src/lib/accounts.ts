import type { Role } from "./types";

const ACCOUNTS_KEY = "labpinjam:v1:student-accounts"; // legacy, no longer used
export const STAFF_EMAILS: string[] = ["hherawatii083@gmail.com", "admin123@elab.local"];

export type RegisterValues = {
  username: string;
  password: string;
  confirmPassword: string;
};

export type RegisterErrors = Partial<Record<keyof RegisterValues, string>>;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function isValidUsername(value: string): boolean {
  return normalizeUsername(value).length > 0;
}

export function validateRegistration(values: RegisterValues): {
  errors: RegisterErrors;
  parsed: { username: string; password: string } | null;
} {
  const errors: RegisterErrors = {};
  const username = normalizeUsername(values.username);

  if (!username) errors.username = "Username wajib diisi.";
  else if (username.length < 3) errors.username = "Username minimal 3 karakter.";
  else if (username.length > 40) errors.username = "Username maksimal 40 karakter.";
  else if (!/^[a-z0-9_-]+$/.test(username)) {
    errors.username = "Username hanya boleh huruf kecil, angka, underscore, dan strip.";
  }

  if (!values.password) errors.password = "Kata sandi wajib diisi.";
  else if (values.password.length < 6) errors.password = "Kata sandi minimal 6 karakter.";
  else if (values.password.length > 72) errors.password = "Kata sandi maksimal 72 karakter.";
  else if (!/[a-z]/.test(values.password)) errors.password = "Kata sandi harus mengandung huruf kecil.";
  else if (!/[A-Z]/.test(values.password)) errors.password = "Kata sandi harus mengandung huruf besar.";
  else if (!/[0-9]/.test(values.password)) errors.password = "Kata sandi harus mengandung angka.";

  if (!values.confirmPassword) errors.confirmPassword = "Ulangi kata sandi Anda.";
  else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Kata sandi dan ulangi kata sandi tidak sama.";
  }

  if (Object.keys(errors).length > 0) return { errors, parsed: null };
  return { errors, parsed: { username, password: values.password } };
}
