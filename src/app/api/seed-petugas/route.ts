import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const STAFF_SEEDS: Array<{ email: string; name: string; password: string }> = [
  { email: "hherawatii083@gmail.com", name: "Petugas Laboratorium", password: "admin123" },
  { email: "admin123@elab.local", name: "Admin123", password: "admin123" },
];

export async function POST() {
  const admin = createAdminClient();
  const results: Array<{ email: string; ok: boolean; error?: string }> = [];

  for (const seed of STAFF_SEEDS) {
    let userId: string | null = null;

    // Cari user auth yang sudah ada berdasarkan email.
    const { data: users } = await admin.auth.admin.listUsers();
    const existing = users?.users.find((u) => (u.email ?? "").toLowerCase() === seed.email.toLowerCase());

    if (existing) {
      userId = existing.id;
      // Update kata sandi (dan email jika berubah).
      const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
        email: seed.email,
        password: seed.password,
        user_metadata: { name: seed.name },
      });
      if (updErr) {
        results.push({ email: seed.email, ok: false, error: updErr.message });
        continue;
      }
    } else {
      // Buat user baru (sudah terverifikasi email).
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: seed.email,
        password: seed.password,
        email_confirm: true,
        user_metadata: { name: seed.name },
      });
      if (createErr || !created?.user) {
        results.push({ email: seed.email, ok: false, error: createErr?.message ?? "Gagal membuat user" });
        continue;
      }
      userId = created.user.id;
    }

    // Buat/perbarui profil petugas.
    if (userId) {
      const { error: profErr } = await admin
        .from("profiles")
        .upsert(
          { id: userId, name: seed.name, nim: null, role: "petugas" },
          { onConflict: "id" },
        );
      if (profErr) {
        results.push({ email: seed.email, ok: false, error: profErr.message });
        continue;
      }
    }

    results.push({ email: seed.email, ok: true });
  }

  const allOk = results.every((r) => r.ok);
  return NextResponse.json({ ok: allOk, results }, { status: allOk ? 200 : 400 });
}
