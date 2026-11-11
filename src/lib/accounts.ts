import type { StudentAccount } from "./types";

const ACCOUNTS_KEY = "labpinjam:v1:student-accounts";
const NIM_RE = /^D\d{1,9}$/;

export type RegisterValues = {
  name: string;
  nim: string;
  password: string;
  confirmPassword: string;
};

export type RegisterErrors = Partial<Record<keyof RegisterValues, string>>;

export type AuthResult =
  | { ok: true; account: StudentAccount; message: string }
  | { ok: false; message: string; field?: keyof RegisterValues };

export function normalizeNim(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidNim(value: string): boolean {
  return NIM_RE.test(normalizeNim(value));
}

export function validateRegistration(values: RegisterValues): {
  errors: RegisterErrors;
  parsed: { name: string; nim: string; password: string } | null;
} {
  const errors: RegisterErrors = {};
  const name = values.name.trim().replace(/\s+/g, " ");
  const nim = normalizeNim(values.nim);

  if (!name) errors.name = "Nama lengkap wajib diisi.";
  else if (name.length < 3) errors.name = "Nama lengkap minimal 3 karakter.";
  else if (name.length > 50) errors.name = "Nama lengkap maksimal 50 karakter.";

  if (!nim) errors.nim = "NIM wajib diisi.";
  else if (!NIM_RE.test(nim)) {
    errors.nim = "NIM harus diawali huruf D dan diikuti 1–9 angka, misalnya D121211001 atau D08.";
  }

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

function loadAccounts(): StudentAccount[] {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a): a is StudentAccount =>
        !!a &&
        typeof a.nim === "string" &&
        isValidNim(a.nim) &&
        typeof a.name === "string" &&
        typeof a.passwordHash === "string" &&
        typeof a.salt === "string" &&
        typeof a.createdAt === "string",
    );
  } catch {
    return [];
  }
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Peramban tidak mendukung pengamanan kata sandi.");
  }
  const bytes = new TextEncoder().encode(`e-lab:${salt}:${password}`);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return toHex(new Uint8Array(digest));
}

function makeSalt(): string {
  if (!globalThis.crypto?.getRandomValues) throw new Error("Peramban tidak mendukung pembuatan akun.");
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export async function createStudentAccount(values: RegisterValues): Promise<AuthResult> {
  const { errors, parsed } = validateRegistration(values);
  const firstError = Object.entries(errors)[0] as [keyof RegisterValues, string] | undefined;
  if (!parsed) {
    return {
      ok: false,
      message: firstError?.[1] ?? "Data pendaftaran belum valid.",
      field: firstError?.[0],
    };
  }

  const accounts = loadAccounts();
  if (accounts.some((a) => normalizeNim(a.nim) === parsed.nim)) {
    return { ok: false, field: "nim", message: "NIM ini sudah terdaftar. Silakan masuk atau gunakan NIM lain." };
  }

  try {
    const salt = makeSalt();
    const account: StudentAccount = {
      nim: parsed.nim,
      name: parsed.name,
      salt,
      passwordHash: await hashPassword(parsed.password, salt),
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
    return { ok: true, account, message: `Akun dengan NIM ${account.nim} berhasil dibuat. Silakan masuk.` };
  } catch {
    return {
      ok: false,
      message: "Akun tidak dapat disimpan. Pastikan penyimpanan peramban aktif dan coba lagi.",
    };
  }
}

export async function authenticateStudent(nimInput: string, password: string): Promise<AuthResult> {
  const nim = normalizeNim(nimInput);
  if (!NIM_RE.test(nim)) {
    return { ok: false, field: "nim", message: "Masukkan NIM dengan format D diikuti 1–9 angka." };
  }
  if (!password) return { ok: false, field: "password", message: "Kata sandi wajib diisi." };

  const account = loadAccounts().find((a) => normalizeNim(a.nim) === nim);
  if (!account) return { ok: false, message: "NIM atau kata sandi salah, atau akun belum terdaftar." };

  try {
    const hash = await hashPassword(password, account.salt);
    if (hash !== account.passwordHash) {
      return { ok: false, message: "NIM atau kata sandi salah." };
    }
    return { ok: true, account, message: `Selamat datang, ${account.name}.` };
  } catch {
    return { ok: false, message: "Login tidak dapat diproses di peramban ini." };
  }
}
