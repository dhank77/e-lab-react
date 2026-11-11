"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/auth/actions";
import { Alert } from "@/components/Alert";
import { SubmitButton } from "@/components/SubmitButton";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-4">
      {notice && <Alert type="error">{notice}</Alert>}
      {state?.error && <Alert type="error">{state.error}</Alert>}
      <input type="hidden" name="next" value={next ?? "/dashboard"} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" placeholder="nama@kampus.ac.id" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      <SubmitButton pendingText="Masuk...">Masuk</SubmitButton>
      <p className="text-center text-sm text-slate-500">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-indigo-600 hover:underline">Daftar</Link>
      </p>
    </form>
  );
}
