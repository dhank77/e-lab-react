"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; success?: string } | undefined;

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) return { error: "Email dan password wajib diisi." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Email atau password salah."
          : error.message === "Email not confirmed"
            ? "Email belum dikonfirmasi. Cek kotak masuk Anda."
            : error.message,
    };
  }

  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function register(_: FormState, formData: FormData): Promise<FormState> {
  const full_name = String(formData.get("full_name") ?? "").trim();
  const nim = String(formData.get("nim") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!full_name || !email || !password) return { error: "Nama, email, dan password wajib diisi." };
  if (password.length < 6) return { error: "Password minimal 6 karakter." };
  if (password !== confirm) return { error: "Konfirmasi password tidak sama." };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, nim: nim || null },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return { error: error.message };

  // Jika konfirmasi email dimatikan di Supabase, user langsung punya sesi.
  if (data.session) redirect("/dashboard");

  return { success: "Registrasi berhasil! Cek email Anda untuk konfirmasi, lalu login." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
