"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { AuthShell, GuestLink } from "@/components/auth/AuthShell";
import { homeFor } from "@/components/layout/nav";
import { Button } from "@/components/ui/Button";
import { Field, describedBy, inputClass } from "@/components/ui/Form";
import { Icon, type IconName } from "@/components/ui/Icon";
import { normalizeNim, STAFF_EMAIL } from "@/lib/accounts";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLES: Array<{ value: Role; title: string; desc: string; icon: IconName }> = [
  {
    value: "mahasiswa",
    title: "Mahasiswa",
    desc: "Masuk dengan NIM dan kata sandi akun Anda.",
    icon: "graduation",
  },
  {
    value: "petugas",
    title: "Petugas Laboratorium",
    desc: "Masuk dengan akun petugas (email) yang dikelola admin.",
    icon: "shield",
  },
];

export function LoginView() {
  const { ready, session, loginPetugas, loginStudent } = useStore();
  const router = useRouter();
  const uid = useId();
  const [role, setRole] = useState<Role>("mahasiswa");
  const staffEmail = STAFF_EMAIL;
  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && session) router.replace(homeFor(session.role));
  }, [ready, session, router]);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("nim");
    if (value) {
      setRole("mahasiswa");
      setNim(normalizeNim(value).slice(0, 10));
    }
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");

    if (role === "petugas") {
      if (!staffEmail.trim()) return setError("Email petugas wajib diisi.");
      if (!password) return setError("Kata sandi wajib diisi.");
      setBusy(true);
      try {
        const result = await loginPetugas(staffEmail, password);
        if (result.ok) router.push(homeFor("petugas"));
        else setError(result.message);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!nim.trim()) return setError("NIM wajib diisi.");
    if (!password) return setError("Kata sandi wajib diisi.");
    setBusy(true);
    try {
      const result = await loginStudent(nim, password);
      if (result.ok) router.push(homeFor("mahasiswa"));
      else setError(result.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Masuk ke E-Lab</h1>
          <p className="mt-2 text-sm text-slate-600">Pilih peran Anda untuk melanjutkan.</p>
        </div>
        <GuestLink />
      </div>

      <form onSubmit={submit} noValidate className="mt-6">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-800">Masuk sebagai</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {ROLES.map((r) => (
              <label key={r.value} className="block cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={() => { setRole(r.value); setError(""); }}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "flex h-full flex-col gap-2 rounded-xl border bg-white p-4 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600",
                    role === r.value ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-slate-300 hover:border-slate-400",
                  )}
                >
                  <span className={cn("inline-flex size-9 items-center justify-center rounded-lg", role === r.value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600")}>
                    <Icon name={r.icon} className="size-5" />
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{r.title}</span>
                  <span className="text-xs leading-relaxed text-slate-600">{r.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {role === "mahasiswa" ? (
          <div className="mt-5 space-y-4">
            <Field id={`${uid}-nim`} label="NIM" required hint="Masukkan NIM yang digunakan saat mendaftar.">
              <input
                id={`${uid}-nim`}
                type="text"
                value={nim}
                autoCapitalize="characters"
                autoComplete="username"
                spellCheck={false}
                placeholder="NIM mahasiswa"
                onChange={(e) => { setNim(e.target.value.toUpperCase().replace(/\s/g, "")); if (error) setError(""); }}
                aria-describedby={describedBy(`${uid}-nim`, undefined, "hint")}
                className={cn(inputClass(false), "h-11 uppercase")}
              />
            </Field>
            <Field id={`${uid}-password`} label="Kata sandi" required>
              <input
                id={`${uid}-password`}
                type="password"
                value={password}
                maxLength={72}
                autoComplete="current-password"
                onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                className={cn(inputClass(false), "h-11")}
              />
            </Field>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <Field id={`${uid}-staff-email`} label="Email petugas" required hint="Akun petugas tunggal dikelola oleh admin.">
              <input
                id={`${uid}-staff-email`}
                type="email"
                value={staffEmail}
                autoComplete="email"
                readOnly
                aria-readonly="true"
                aria-describedby={describedBy(`${uid}-staff-email`, undefined, "hint")}
                className={cn(inputClass(false), "h-11")}
              />
            </Field>
            <Field id={`${uid}-staff-password`} label="Kata sandi" required>
              <input
                id={`${uid}-staff-password`}
                type="password"
                value={password}
                maxLength={72}
                autoComplete="current-password"
                onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                className={cn(inputClass(false), "h-11")}
              />
            </Field>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <Button type="submit" disabled={busy} className="mt-6 h-11 w-full text-[15px]">
          {busy ? "Memeriksa akun…" : role === "mahasiswa" ? "Masuk sebagai Mahasiswa" : "Masuk sebagai Petugas"}
          {!busy && <Icon name="arrowRight" className="size-4" />}
        </Button>
      </form>

      {role === "mahasiswa" && (
        <p className="mt-4 text-center text-sm text-slate-600">
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-semibold text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600">
            Daftar sebagai mahasiswa
          </Link>
        </p>
      )}

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <Icon name="info" className="mt-0.5 size-[18px] shrink-0 text-blue-600" />
        <p className="leading-relaxed">
          Autentikasi dan data inventaris/pengajuan disimpan di Supabase. Katalog barang aktif dapat
          dilihat tanpa akun melalui Guest.
        </p>
      </div>
    </AuthShell>
  );
}
