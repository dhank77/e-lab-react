"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/Toast";
import { normalizeUsername, STAFF_EMAILS, type RegisterValues } from "./accounts";
import * as inv from "./inventory";
import type { ItemFormValues, RequestFormValues, Result } from "./inventory";
import { createClient } from "./supabase/client";
import type { AppData, BorrowRequest, Item, Session } from "./types";

const EMPTY: AppData = { version: 1, items: [], requests: [] };

type AuthResult =
  | { ok: true; message: string }
  | { ok: false; message: string; field?: "username" | "password" | "confirmPassword" };

const num = (v: unknown, fallback = 0) => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
};

function mapItem(row: Record<string, unknown>): Item {
  const total = num(row.total);
  const damaged = Math.min(num(row.damaged), total);
  const borrowed = Math.min(num(row.borrowed), Math.max(0, total - damaged));
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    category: String(row.category ?? "Lainnya"),
    lab: row.lab ? String(row.lab) : undefined,
    description: String(row.description ?? ""),
    total,
    damaged,
    borrowed,
    isActive: row.is_active !== false,
  };
}

function mapRequest(row: Record<string, unknown>): BorrowRequest {
  const toDate = (v: unknown) =>
    typeof v === "string" ? v.slice(0, 10) : undefined;
  const toTs = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    id: String(row.id),
    studentId: String(row.student_id ?? ""),
    studentName: String(row.student_name_snapshot ?? ""),
    itemId: String(row.item_id ?? ""),
    itemName: String(row.item_name_snapshot ?? ""),
    quantity: num(row.quantity),
    borrowDate: toDate(row.borrow_date) ?? "",
    dueDate: toDate(row.due_date) ?? "",
    purpose: String(row.purpose ?? ""),
    status: String(row.status ?? "Menunggu") as BorrowRequest["status"],
    createdAt: toTs(row.created_at),
    decidedAt: toDate(row.decided_at),
    rejectReason: (row.reject_reason as string | null) ?? undefined,
    handedOverAt: toDate(row.handed_over_at),
    returnedAt: toDate(row.returned_at),
    returnedGood: row.returned_good == null ? undefined : num(row.returned_good),
    returnedDamaged:
      row.returned_damaged == null ? undefined : num(row.returned_damaged),
    returnNote: (row.return_note as string | null) ?? undefined,
  };
}

// Hash the username into a stable synthetic email so arbitrary username values stay valid
// Supabase Auth identifiers without exposing the username itself.
async function studentAuthEmail(username: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalizeUsername(username)),
  );
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `s-${hex}@students.elab.local`;
}

// Compatibility for accounts created before username aliases were hashed.
function legacyStudentAuthEmail(username: string): string {
  return `${normalizeUsername(username).toLowerCase()}@students.elab.local`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

type StoreValue = {
  ready: boolean;
  session: Session | null;
  items: Item[];
  requests: BorrowRequest[];
  loginPetugas: (email: string, password: string) => Promise<AuthResult>;
  loginStudent: (username: string, password: string) => Promise<AuthResult>;
  registerStudent: (values: RegisterValues) => Promise<AuthResult>;
  logout: () => Promise<void>;
  resetData: () => void;
  addItem: (values: ItemFormValues) => Promise<boolean>;
  updateItem: (id: string, values: ItemFormValues) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  archiveItem: (id: string) => Promise<boolean>;
  markDamaged: (id: string, units: number) => Promise<boolean>;
  markRepaired: (id: string, units: number) => Promise<boolean>;
  submitRequest: (values: RequestFormValues) => Promise<boolean>;
  cancelRequest: (id: string) => Promise<boolean>;
  approveRequest: (id: string) => Promise<boolean>;
  rejectRequest: (id: string, reason: string) => Promise<boolean>;
  handoverRequest: (id: string) => Promise<boolean>;
  returnRequest: (id: string, damagedUnits: number, note: string) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
};

const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore harus dipakai di dalam StoreProvider");
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const { notify } = useToast();
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AppData>(EMPTY);
  const [session, setSession] = useState<Session | null>(null);
  const dataRef = useRef<AppData>(EMPTY);
  const sessionRef = useRef<Session | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const setStateData = useCallback((next: AppData) => {
    dataRef.current = next;
    setData(next);
  }, []);

  const fetchProfileSession = useCallback(
    async (userId: string): Promise<Session | null> => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, nim, username, role")
        .eq("id", userId)
        .maybeSingle();
      if (!profile) return null;
      return {
        role: profile.role as Session["role"],
        name: String(profile.name ?? profile.username ?? ""),
        userId: String(profile.id),
        username: String(profile.username ?? ""),
      };
    },
    [supabase],
  );

  const fetchAll = useCallback(
    async (sess: Session | null) => {
      // Public: only active inventory (RLS enforces). Petugas: all items.
      let itemsQuery = supabase
        .from("inventory_items")
        .select("*")
        .order("name", { ascending: true });
      if (!sess || sess.role !== "petugas") {
        itemsQuery = itemsQuery.eq("is_active", true);
      }
      const { data: itemRows, error: itemErr } = await itemsQuery;
      if (itemErr) {
        notify(`Gagal memuat inventaris: ${itemErr.message}`, "error");
      }

      let reqRows: Record<string, unknown>[] = [];
      if (sess) {
        const { data: rows, error: reqErr } = await supabase
          .from("borrow_requests")
          .select("*")
          .order("created_at", { ascending: false });
        if (reqErr) {
          notify(`Gagal memuat pengajuan: ${reqErr.message}`, "error");
        } else {
          reqRows = (rows ?? []) as Record<string, unknown>[];
        }
      }

      setStateData({
        version: 1,
        items: ((itemRows ?? []) as Record<string, unknown>[]).map(mapItem),
        requests: reqRows.map(mapRequest),
      });
    },
    [supabase, notify, setStateData],
  );

  const refresh = useCallback(async () => {
    await fetchAll(sessionRef.current);
  }, [fetchAll]);

  // Auth bootstrap + subscription
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      let sess: Session | null = null;
      if (authSession?.user) {
        sess = await fetchProfileSession(authSession.user.id);
        if (!sess) await supabase.auth.signOut();
      }
      if (!mounted) return;
      sessionRef.current = sess;
      setSession(sess);
      await fetchAll(sess);
      if (mounted) setReady(true);
    };
    void init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, authSession) => {
      if (!mounted) return;
      let sess: Session | null = null;
      if (authSession?.user) {
        sess = await fetchProfileSession(authSession.user.id);
        if (!sess) await supabase.auth.signOut();
      }
      sessionRef.current = sess;
      setSession(sess);
      await fetchAll(sess);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, fetchProfileSession, fetchAll]);

  // Realtime refresh on changes
  useEffect(() => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const ch = supabase
      .channel("e-lab-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_items" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "borrow_requests" }, () => void refresh())
      .subscribe();
    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, refresh]);

  const need = useCallback((): Session | null => {
    if (!sessionRef.current) notify("Sesi berakhir. Silakan masuk kembali.", "error");
    return sessionRef.current;
  }, [notify]);

  const wrap = useCallback(
    async (fn: () => Promise<{ ok: boolean; message: string }>): Promise<boolean> => {
      try {
        const r = await fn();
        if (r.ok) {
          notify(r.message, "success");
          await refresh();
          return true;
        }
        notify(r.message, "error");
        return false;
      } catch (e) {
        notify(e instanceof Error ? e.message : "Terjadi kesalahan.", "error");
        return false;
      }
    },
    [notify, refresh],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      session,
      items: data.items,
      requests: data.requests,

      loginPetugas: async (email, password): Promise<AuthResult> => {
        const e = email.trim().toLowerCase();
        if (!STAFF_EMAILS.includes(e)) {
          return { ok: false, message: "Gunakan email petugas yang ditetapkan admin." };
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
          return { ok: false, message: "Email petugas tidak valid." };
        }
        if (!password) return { ok: false, message: "Kata sandi wajib diisi.", field: "password" };
        const { data: res, error } = await supabase.auth.signInWithPassword({ email: e, password });
        if (error || !res.user) return { ok: false, message: "Email atau kata sandi petugas salah." };
        const prof = await fetchProfileSession(res.user.id);
        if (!prof || prof.role !== "petugas") {
          await supabase.auth.signOut();
          return { ok: false, message: "Akun ini bukan akun petugas. Hubungi admin." };
        }
        return { ok: true, message: `Selamat datang, ${prof.name}.` };
      },

      loginStudent: async (username, password): Promise<AuthResult> => {
        const u = normalizeUsername(username);
        if (!u) return { ok: false, message: "Username wajib diisi.", field: "username" };
        if (!password) return { ok: false, message: "Kata sandi wajib diisi.", field: "password" };
        let { data: res, error } = await supabase.auth.signInWithPassword({
          email: await studentAuthEmail(u),
          password,
        });
        if (error?.code === "invalid_credentials") {
          const legacyEmail = legacyStudentAuthEmail(u);
          if (legacyEmail !== await studentAuthEmail(u)) {
            const fallback = await supabase.auth.signInWithPassword({ email: legacyEmail, password });
            res = fallback.data;
            error = fallback.error;
          }
        }
        if (error || !res.user) {
          return { ok: false, message: "Username atau kata sandi salah, atau akun belum terdaftar." };
        }
        const prof = await fetchProfileSession(res.user.id);
        if (!prof || prof.role !== "mahasiswa") {
          await supabase.auth.signOut();
          return { ok: false, message: "Akun ini tidak terdaftar sebagai mahasiswa." };
        }
        return { ok: true, message: `Selamat datang, ${prof.name ?? prof.username ?? u}.` };
      },

      registerStudent: async (values): Promise<AuthResult> => {
        const { validateRegistration } = await import("./accounts");
        const { errors, parsed } = validateRegistration(values);
        const firstError = Object.entries(errors)[0] as [keyof RegisterValues, string] | undefined;
        if (!parsed) {
          return { ok: false, message: firstError?.[1] ?? "Data pendaftaran belum valid.", field: firstError?.[0] as "username"|"password"|"confirmPassword" };
        }
        const email = await studentAuthEmail(parsed.username);
        const { data: res, error } = await supabase.auth.signUp({
          email,
          password: parsed.password,
          options: { data: { username: parsed.username, name: parsed.username } },
        });
        if (error) {
          const lower = error.message.toLowerCase();
          if (/rate.?limit|too many/i.test(lower)) {
            return { ok: false, message: "Terlalu banyak percobaan pendaftaran dalam waktu singkat. Coba lagi dalam beberapa menit atau hubungi admin untuk menambah batas pendaftaran di Supabase Dashboard." };
          }
          const msg = /already|registered|exists|duplicate|unique/i.test(error.message)
            ? "Username ini sudah terdaftar. Silakan masuk atau gunakan username lain."
            : /invalid/i.test(error.message) && /email/i.test(error.message)
              ? "Pendaftaran gagal karena format email internal ditolak. Periksa konfigurasi Auth Supabase (izinkan pendaftaran email) lalu coba lagi."
              : `Pendaftaran gagal: ${error.message}`;
          return { ok: false, message: msg, field: /already|registered|exists|duplicate|unique/i.test(error.message) ? "username" : undefined };
        }
        // Some projects may require email confirmation; profile may be created by trigger or client fallback.
        if (res.user) {
          // Fallback profile creation for cases where metadata/trigger did not populate it.
          // The DB trigger (security definer) already creates the profile; this upsert is best-effort
          // and must not fail registration when there is no active session (RLS blocks client insert).
          try {
            await supabase.from("profiles").upsert(
              { id: res.user.id, name: parsed.username, nim: null, username: parsed.username, role: "mahasiswa" },
              { onConflict: "id" },
            );
          } catch {
            // Profil sudah tercipta oleh trigger atau diblokir RLS; pendaftaran tetap berhasil.
          }
          // Keep flow explicit: if Supabase auto-created a session, sign out so user logs in manually.
          if (res.session) await supabase.auth.signOut();
        }
        return { ok: true, message: `Akun dengan username ${parsed.username} berhasil dibuat. Silakan masuk.` };
      },

      logout: async () => {
        await supabase.auth.signOut();
        sessionRef.current = null;
        setSession(null);
        await fetchAll(null);
      },

      resetData: () => {
        notify("Pengaturan ulang data lokal tidak tersedia. Kelola data melalui Supabase.", "error");
      },

      addItem: (v) =>
        wrap(async () => {
          const s = need(); if (!s || s.role !== "petugas") return { ok: false, message: "Akses ditolak." };
          const { parsed } = inv.validateItem(v, dataRef.current.items);
          if (!parsed) return { ok: false, message: "Data barang belum valid. Periksa kembali isian formulir." };
          const { error } = await supabase.from("inventory_items").insert({
            name: parsed.name, category: parsed.category, description: parsed.description,
            total: parsed.total, damaged: parsed.damaged, borrowed: 0, is_active: true,
          });
          if (error) return { ok: false, message: `Gagal menambah barang: ${error.message}` };
          return { ok: true, message: `Barang "${parsed.name}" berhasil ditambahkan.` };
        }),

      updateItem: (id, v) =>
        wrap(async () => {
          const s = need(); if (!s || s.role !== "petugas") return { ok: false, message: "Akses ditolak." };
          const current = dataRef.current.items.find((i) => i.id === id);
          if (!current) return { ok: false, message: "Barang tidak ditemukan. Mungkin sudah dihapus." };
          const { parsed } = inv.validateItem(v, dataRef.current.items, current);
          if (!parsed) return { ok: false, message: "Data barang belum valid. Periksa kembali isian formulir." };
          const { error } = await supabase.from("inventory_items").update({
            name: parsed.name, category: parsed.category, description: parsed.description,
            total: parsed.total, damaged: parsed.damaged,
          }).eq("id", id);
          if (error) return { ok: false, message: `Gagal memperbarui barang: ${error.message}` };
          await supabase.from("borrow_requests").update({ item_name_snapshot: parsed.name }).eq("item_id", id);
          return { ok: true, message: `Barang "${parsed.name}" berhasil diperbarui.` };
        }),

      deleteItem: (id) =>
        wrap(async () => {
          const s = need(); if (!s || s.role !== "petugas") return { ok: false, message: "Akses ditolak." };
          const item = dataRef.current.items.find((i) => i.id === id);
          if (!item) return { ok: false, message: "Barang tidak ditemukan. Mungkin sudah dihapus." };
          if (item.borrowed > 0) {
            return { ok: false, message: `"${item.name}" tidak dapat dihapus karena ${item.borrowed} unit masih dipinjam. Catat pengembaliannya terlebih dahulu.` };
          }
          // Jika pernah direferensikan riwayat: arsipkan (is_active=false) untuk mempertahankan riwayat.
          const { count } = await supabase.from("borrow_requests").select("id", { count: "exact", head: true }).eq("item_id", id);
          if ((count ?? 0) > 0) {
            const today = todayIso();
            await supabase.from("borrow_requests")
              .update({ status: "Ditolak", decided_at: today, reject_reason: "Barang diarsipkan dari inventaris." })
              .eq("item_id", id).in("status", ["Menunggu", "Disetujui"]);
            const { error } = await supabase.from("inventory_items").update({ is_active: false }).eq("id", id);
            if (error) return { ok: false, message: `Gagal mengarsipkan barang: ${error.message}` };
            return { ok: true, message: `Barang "${item.name}" diarsipkan agar riwayat tetap terjaga.` };
          }
          const { error } = await supabase.from("inventory_items").delete().eq("id", id);
          if (error) return { ok: false, message: `Gagal menghapus barang: ${error.message}` };
          return { ok: true, message: `Barang "${item.name}" berhasil dihapus.` };
        }),

      archiveItem: (id) =>
        wrap(async () => {
          const s = need(); if (!s || s.role !== "petugas") return { ok: false, message: "Akses ditolak." };
          const item = dataRef.current.items.find((i) => i.id === id);
          if (!item) return { ok: false, message: "Barang tidak ditemukan." };
          const today = todayIso();
          await supabase.from("borrow_requests")
            .update({ status: "Ditolak", decided_at: today, reject_reason: "Barang diarsipkan dari inventaris." })
            .eq("item_id", id).in("status", ["Menunggu", "Disetujui"]);
          const { error } = await supabase.from("inventory_items").update({ is_active: false }).eq("id", id);
          if (error) return { ok: false, message: `Gagal mengarsipkan: ${error.message}` };
          return { ok: true, message: `Barang "${item.name}" diarsipkan.` };
        }),

      markDamaged: (id, units) =>
        wrap(async () => {
          const s = need(); if (!s || s.role !== "petugas") return { ok: false, message: "Akses ditolak." };
          const item = dataRef.current.items.find((i) => i.id === id);
          if (!item) return { ok: false, message: "Barang tidak ditemukan." };
          if (!Number.isInteger(units) || units < 1) return { ok: false, message: "Jumlah unit harus berupa bilangan bulat minimal 1." };
          const available = inv.getAvailable(item);
          if (units > available) return { ok: false, message: `Hanya ${available} unit tersedia yang dapat dicatat rusak.` };
          const { error } = await supabase.from("inventory_items").update({ damaged: item.damaged + units }).eq("id", id);
          if (error) return { ok: false, message: `Gagal mencatat kerusakan: ${error.message}` };
          return { ok: true, message: `${units} unit "${item.name}" dicatat rusak.` };
        }),

      markRepaired: (id, units) =>
        wrap(async () => {
          const s = need(); if (!s || s.role !== "petugas") return { ok: false, message: "Akses ditolak." };
          const item = dataRef.current.items.find((i) => i.id === id);
          if (!item) return { ok: false, message: "Barang tidak ditemukan." };
          if (!Number.isInteger(units) || units < 1) return { ok: false, message: "Jumlah unit harus berupa bilangan bulat minimal 1." };
          if (units > item.damaged) return { ok: false, message: `Hanya ${item.damaged} unit rusak yang dapat dicatat telah diperbaiki.` };
          const { error } = await supabase.from("inventory_items").update({ damaged: item.damaged - units }).eq("id", id);
          if (error) return { ok: false, message: `Gagal mencatat perbaikan: ${error.message}` };
          return { ok: true, message: `${units} unit "${item.name}" dicatat telah diperbaiki dan kembali tersedia.` };
        }),

      submitRequest: (v) =>
        wrap(async () => {
          const s = need(); if (!s || s.role !== "mahasiswa") return { ok: false, message: "Akses ditolak." };
          const today = todayIso();
          const { parsed } = inv.validateRequest(v, dataRef.current.items.filter((i) => i.isActive !== false), today);
          if (!parsed) return { ok: false, message: "Pengajuan belum valid. Periksa kembali isian formulir." };
          const { error } = await supabase.from("borrow_requests").insert({
            student_id: s.userId,
            student_name_snapshot: s.name,
            item_id: parsed.item.id,
            item_name_snapshot: parsed.item.name,
            quantity: parsed.quantity,
            borrow_date: v.borrowDate,
            due_date: v.dueDate,
            purpose: parsed.purpose,
            status: "Menunggu",
          });
          if (error) return { ok: false, message: `Gagal mengirim pengajuan: ${error.message}` };
          return { ok: true, message: "Pengajuan terkirim. Menunggu pemeriksaan petugas laboratorium." };
        }),

      cancelRequest: (id) =>
        wrap(async () => {
          const s = need(); if (!s) return { ok: false, message: "Akses ditolak." };
          const today = todayIso();
          const { data: updated, error } = await supabase
            .from("borrow_requests")
            .update({ status: "Dibatalkan", decided_at: today })
            .eq("id", id)
            .eq("student_id", s.userId)
            .eq("status", "Menunggu")
            .select("id")
            .maybeSingle();
          if (error) return { ok: false, message: `Gagal membatalkan: ${error.message}` };
          if (!updated) return { ok: false, message: "Hanya pengajuan berstatus Menunggu milik Anda yang dapat dibatalkan." };
          return { ok: true, message: "Pengajuan berhasil dibatalkan." };
        }),

      approveRequest: (id) =>
        wrap(async () => {
          const s = need(); if (!s || s.role !== "petugas") return { ok: false, message: "Akses ditolak." };
          const { data: req, error } = await supabase.rpc("approve_request", { p_request_id: id }).single();
          if (error) return { ok: false, message: error.message || "Gagal menyetujui pengajuan." };
          return { ok: true, message: `Pengajuan ${(req as any)?.student_name_snapshot ?? ""} disetujui. Catat penyerahan saat barang diambil.`.trim() };
        }),

      rejectRequest: (id, reason) =>
        wrap(async () => {
          const s = need(); if (!s || s.role !== "petugas") return { ok: false, message: "Akses ditolak." };
          const { data: req, error } = await supabase.rpc("reject_request", { p_request_id: id, p_reason: reason || null }).single();
          if (error) return { ok: false, message: error.message || "Gagal menolak pengajuan." };
          return { ok: true, message: `Pengajuan ${(req as any)?.student_name_snapshot ?? ""} ditolak.`.trim() };
        }),

      handoverRequest: (id) =>
        wrap(async () => {
          const s = need(); if (!s || s.role !== "petugas") return { ok: false, message: "Akses ditolak." };
          const { data: req, error } = await supabase.rpc("handover_request", { p_request_id: id }).single();
          if (error) return { ok: false, message: error.message || "Gagal mencatat penyerahan." };
          const r = req as any;
          return { ok: true, message: `Penyerahan dicatat. ${r?.quantity ?? ""} unit "${r?.item_name_snapshot ?? ""}" kini dipinjam ${r?.student_name_snapshot ?? ""}.`.trim() };
        }),

      returnRequest: (id, damagedUnits, note) =>
        wrap(async () => {
          const s = need(); if (!s || s.role !== "petugas") return { ok: false, message: "Akses ditolak." };
          const { data: req, error } = await supabase.rpc("return_request", {
            p_request_id: id, p_damaged_units: damagedUnits, p_note: note || null,
          }).single();
          if (error) return { ok: false, message: error.message || "Gagal mencatat pengembalian." };
          const r = req as any;
          const good = (r?.quantity ?? 0) - damagedUnits;
          const message = damagedUnits > 0
            ? `Pengembalian dicatat: ${good} unit kembali tersedia, ${damagedUnits} unit dicatat rusak.`
            : `Pengembalian dicatat: ${r?.quantity ?? 0} unit kembali ke stok tersedia.`;
          return { ok: true, message };
        }),

      deleteAccount: () =>
        wrap(async () => {
          const s = need(); if (!s || s.role !== "mahasiswa") return { ok: false, message: "Akses ditolak." };
          const res = await fetch("/api/account/delete", { method: "POST" });
          const json = await res.json().catch(() => ({ ok: false, error: "Gagal menghapus akun." }));
          if (!res.ok || !json.ok) {
            return { ok: false, message: json.error ?? "Gagal menghapus akun." };
          }
          await supabase.auth.signOut();
          sessionRef.current = null;
          setSession(null);
          await fetchAll(null);
          return { ok: true, message: json.message ?? "Akun berhasil dihapus." };
        }),
    }),
    [ready, session, data, supabase, fetchProfileSession, fetchAll, need, wrap, notify],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
