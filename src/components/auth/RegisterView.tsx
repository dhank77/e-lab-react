"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { AuthShell, GuestLink } from "@/components/auth/AuthShell";
import { Button, buttonClass } from "@/components/ui/Button";
import { Field, describedBy, inputClass } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { validateRegistration, type RegisterErrors, type RegisterValues } from "@/lib/accounts";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const ORDER: Array<keyof RegisterValues> = ["name", "nim", "password", "confirmPassword"];

export function RegisterView() {
  const { registerStudent } = useStore();
  const uid = useId();
  const id = (key: keyof RegisterValues) => `${uid}-${key}`;
  const [values, setValues] = useState<RegisterValues>({
    name: "",
    nim: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [busy, setBusy] = useState(false);
  const [registered, setRegistered] = useState<{ name: string; nim: string } | null>(null);

  const set = (key: keyof RegisterValues, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const validation = validateRegistration(values);
    setErrors(validation.errors);
    const first = ORDER.find((key) => validation.errors[key]);
    if (first) {
      document.getElementById(id(first))?.focus();
      return;
    }

    setBusy(true);
    try {
      const result = await registerStudent(values);
      if (result.ok) {
        setRegistered({ name: result.account.name, nim: result.account.nim });
      } else {
        if (result.field) {
          setErrors((current) => ({ ...current, [result.field as keyof RegisterValues]: result.message }));
          document.getElementById(id(result.field))?.focus();
        } else {
          setErrors({ name: result.message });
        }
      }
    } finally {
      setBusy(false);
    }
  };

  if (registered) {
    return (
      <AuthShell>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Icon name="check" className="size-7" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Akun berhasil dibuat</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Akun untuk <strong className="text-slate-900">{registered.name}</strong> dengan NIM{" "}
            <strong className="text-slate-900">{registered.nim}</strong> telah terdaftar. Silakan masuk untuk
            mengajukan peminjaman.
          </p>
          <Link
            href={`/?nim=${encodeURIComponent(registered.nim)}`}
            className={buttonClass("primary", "md", "mt-6 h-11 w-full")}
          >
            Masuk dengan NIM ini
            <Icon name="arrowRight" className="size-4" />
          </Link>
          <Link
            href="/katalog"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            Lihat katalog sebagai Guest
          </Link>
        </div>
      </AuthShell>
    );
  }

  const fieldProps = (key: keyof RegisterValues, hint?: string) => ({
    id: id(key),
    "aria-invalid": errors[key] ? (true as const) : undefined,
    "aria-describedby": describedBy(id(key), errors[key], errors[key] ? undefined : hint),
  });

  return (
    <AuthShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Daftar Akun Mahasiswa</h1>
          <p className="mt-2 text-sm text-slate-600">Buat akun sebelum masuk dan mengajukan peminjaman.</p>
        </div>
        <GuestLink />
      </div>

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <Field id={id("name")} label="Nama lengkap" required error={errors.name}>
          <input
            {...fieldProps("name")}
            type="text"
            value={values.name}
            maxLength={50}
            autoComplete="name"
            placeholder="Nama sesuai data mahasiswa"
            onChange={(e) => set("name", e.target.value)}
            className={cn(inputClass(!!errors.name), "h-11")}
          />
        </Field>

        <Field
          id={id("nim")}
          label="NIM"
          required
          error={errors.nim}
          hint="Wajib diawali huruf D dan diikuti 1–9 angka. Contoh: D121211001 atau D08."
        >
          <input
            {...fieldProps("nim", "hint")}
            type="text"
            value={values.nim}
            maxLength={10}
            autoCapitalize="characters"
            autoComplete="username"
            spellCheck={false}
            placeholder="D121211001"
            onChange={(e) => set("nim", e.target.value.toUpperCase().replace(/\s/g, ""))}
            className={cn(inputClass(!!errors.nim), "h-11 uppercase")}
          />
        </Field>

        <Field
          id={id("password")}
          label="Kata sandi"
          required
          error={errors.password}
          hint="Minimal 6 karakter."
        >
          <input
            {...fieldProps("password", "hint")}
            type="password"
            value={values.password}
            maxLength={72}
            autoComplete="new-password"
            onChange={(e) => set("password", e.target.value)}
            className={cn(inputClass(!!errors.password), "h-11")}
          />
        </Field>

        <Field id={id("confirmPassword")} label="Ulangi kata sandi" required error={errors.confirmPassword}>
          <input
            {...fieldProps("confirmPassword")}
            type="password"
            value={values.confirmPassword}
            maxLength={72}
            autoComplete="new-password"
            onChange={(e) => set("confirmPassword", e.target.value)}
            className={cn(inputClass(!!errors.confirmPassword), "h-11")}
          />
        </Field>

        <Button type="submit" disabled={busy} className="mt-2 h-11 w-full text-[15px]">
          {busy ? "Membuat akun…" : "Buat Akun"}
          {!busy && <Icon name="arrowRight" className="size-4" />}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Sudah punya akun?{" "}
        <Link href="/" className="font-semibold text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600">
          Masuk di sini
        </Link>
      </p>
      <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">
        Akun disimpan secara lokal di peramban ini untuk keperluan prototipe.
      </p>
    </AuthShell>
  );
}
