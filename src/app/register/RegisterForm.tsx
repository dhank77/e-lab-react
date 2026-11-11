"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "@/app/auth/actions";
import { Alert } from "@/components/Alert";
import { SubmitButton } from "@/components/SubmitButton";

export function RegisterForm() {
  const [state, action] = useActionState(register, undefined);

  if (state?.success) {
    return (
      <div className="space-y-4">
        <Alert type="success">{state.success}</Alert>
        <Link href="/login" className="btn-primary w-full">Ke halaman login</Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state?.error && <Alert type="error">{state.error}</Alert>}
      <div>
        <label className="label" htmlFor="full_name">Nama lengkap</label>
        <input id="full_name" name="full_name" required className="input" autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="nim">NIM <span className="text-slate-400">(opsional)</span></label>
        <input id="nim" name="nim" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="input" autoComplete="email" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" minLength={6} required className="input" autoComplete="new-password" />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Ulangi password</label>
          <input id="confirm" name="confirm" type="password" minLength={6} required className="input" autoComplete="new-password" />
        </div>
      </div>
      <SubmitButton pendingText="Mendaftar...">Daftar</SubmitButton>
      <p className="text-center text-sm text-slate-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">Masuk</Link>
      </p>
    </form>
  );
}
