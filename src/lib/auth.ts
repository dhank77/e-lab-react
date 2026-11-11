import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Ambil user + profil yang sedang login; redirect ke /login jika belum. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return { supabase, user, profile };
}

export async function requireAdmin() {
  const ctx = await requireUser();
  if (ctx.profile?.role !== "admin") redirect("/dashboard");
  return ctx;
}
