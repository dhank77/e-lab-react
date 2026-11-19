import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Sesi tidak ditemukan." }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: "Supabase env belum diatur" }, { status: 500 });
  }

  // Resolve user from access token using anon client.
  const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) {
    return NextResponse.json(
      { ok: false, error: "Sesi tidak valid atau telah kadaluarsa." },
      { status: 401 },
    );
  }

  const userId = authData.user.id;

  // Verifikasi role mahasiswa melalui profil (pakai admin client, RLS dilewati).
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();
  if (!profile || profile.role !== "mahasiswa") {
    return NextResponse.json(
      { ok: false, error: "Hanya akun mahasiswa yang dapat dihapus." },
      { status: 403 },
    );
  }

  // Hapus semua pengajuan peminjaman milik mahasiswa ini (FK on delete restrict).
  const { error: delReqErr } = await admin.from("borrow_requests").delete().eq("student_id", userId);
  if (delReqErr) {
    return NextResponse.json(
      { ok: false, error: `Gagal menghapus riwayat pengajuan: ${delReqErr.message}` },
      { status: 500 },
    );
  }

  // Hapus profil.
  const { error: delProfErr } = await admin.from("profiles").delete().eq("id", userId);
  if (delProfErr) {
    return NextResponse.json(
      { ok: false, error: `Gagal menghapus profil: ${delProfErr.message}` },
      { status: 500 },
    );
  }

  // Hapus akun auth (memerlukan service role).
  const { error: delAuthErr } = await admin.auth.admin.deleteUser(userId);
  if (delAuthErr) {
    return NextResponse.json(
      { ok: false, error: `Gagal menghapus akun auth: ${delAuthErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, message: "Akun berhasil dihapus." });
}
