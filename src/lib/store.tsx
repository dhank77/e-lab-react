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
import { useToast } from "@/components/ui/Toast";
import {
  authenticateStudent,
  createStudentAccount,
  isValidNim,
  type AuthResult,
  type RegisterValues,
} from "./accounts";
import { todayStr } from "./date";
import * as inv from "./inventory";
import type { ItemFormValues, RequestFormValues, Result } from "./inventory";
import { createSeedData } from "./seed";
import type { AppData, BorrowRequest, Item, Session } from "./types";
import { slugify } from "./utils";

const DATA_KEY = "labpinjam:v1:data";
const SESSION_KEY = "labpinjam:v1:session";

const EMPTY: AppData = { version: 1, items: [], requests: [] };

const num = (v: unknown, fallback = 0) =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : fallback;

function sanitize(raw: unknown): AppData | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Partial<AppData>;
  if (!Array.isArray(obj.items) || !Array.isArray(obj.requests)) return null;
  const items: Item[] = obj.items
    .filter((i): i is Item => !!i && typeof i.id === "string" && typeof i.name === "string")
    .map((i) => {
      const total = num(i.total);
      const damaged = Math.min(num(i.damaged), total);
      const borrowed = Math.min(num(i.borrowed), total - damaged);
      return {
        id: i.id,
        name: i.name,
        category: typeof i.category === "string" ? i.category : "Lainnya",
        description: typeof i.description === "string" ? i.description : "",
        total,
        damaged,
        borrowed,
      };
    });
  const requests = obj.requests.filter(
    (r): r is BorrowRequest => !!r && typeof r.id === "string" && typeof r.itemId === "string",
  );
  return { version: 1, items, requests };
}

function loadData(): AppData {
  try {
    const text = window.localStorage.getItem(DATA_KEY);
    if (text) {
      const parsed = sanitize(JSON.parse(text));
      if (parsed) return parsed;
    }
  } catch {
    /* data rusak: gunakan data awal */
  }
  const seed = createSeedData(todayStr());
  try {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(seed));
  } catch {
    /* penyimpanan tidak tersedia */
  }
  return seed;
}

function loadSession(): Session | null {
  try {
    const text = window.localStorage.getItem(SESSION_KEY);
    if (!text) return null;
    const s = JSON.parse(text) as Partial<Session>;
    if (
      (s.role === "mahasiswa" || s.role === "petugas") &&
      typeof s.name === "string" &&
      typeof s.userId === "string"
    ) {
      // Sesi mahasiswa lama tanpa NIM tidak lagi berlaku: mahasiswa harus punya akun.
      if (s.role === "mahasiswa") {
        if (typeof s.nim !== "string" || !isValidNim(s.nim)) return null;
        return { role: s.role, name: s.name, userId: s.userId, nim: s.nim.toUpperCase() };
      }
      return { role: s.role, name: s.name, userId: s.userId };
    }
  } catch {
    /* abaikan */
  }
  return null;
}

type StoreValue = {
  ready: boolean;
  session: Session | null;
  items: Item[];
  requests: BorrowRequest[];
  loginPetugas: (name: string) => Session;
  loginStudent: (nim: string, password: string) => Promise<AuthResult>;
  registerStudent: (values: RegisterValues) => Promise<AuthResult>;
  logout: () => void;
  resetData: () => void;
  addItem: (values: ItemFormValues) => boolean;
  updateItem: (id: string, values: ItemFormValues) => boolean;
  deleteItem: (id: string) => boolean;
  markDamaged: (id: string, units: number) => boolean;
  markRepaired: (id: string, units: number) => boolean;
  submitRequest: (values: RequestFormValues) => boolean;
  cancelRequest: (id: string) => boolean;
  approveRequest: (id: string) => boolean;
  rejectRequest: (id: string, reason: string) => boolean;
  handoverRequest: (id: string) => boolean;
  returnRequest: (id: string, damagedUnits: number, note: string) => boolean;
};

const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore harus dipakai di dalam StoreProvider");
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { notify } = useToast();
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AppData>(EMPTY);
  const [session, setSession] = useState<Session | null>(null);
  const dataRef = useRef<AppData>(EMPTY);

  // Baca localStorage hanya di browser, setelah hydration.
  useEffect(() => {
    const loaded = loadData();
    dataRef.current = loaded;
    setData(loaded);
    setSession(loadSession());
    setReady(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === DATA_KEY) {
        const next = loadData();
        dataRef.current = next;
        setData(next);
      } else if (e.key === SESSION_KEY) {
        setSession(loadSession());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback(
    (next: AppData) => {
      dataRef.current = next;
      setData(next);
      try {
        window.localStorage.setItem(DATA_KEY, JSON.stringify(next));
      } catch {
        notify("Perubahan tidak dapat disimpan di peramban (penyimpanan penuh atau dinonaktifkan).", "error");
      }
    },
    [notify],
  );

  const run = useCallback(
    (fn: (d: AppData) => Result): boolean => {
      const result = fn(dataRef.current);
      if (result.ok) {
        commit(result.data);
        notify(result.message, "success");
        return true;
      }
      notify(result.message, "error");
      return false;
    },
    [commit, notify],
  );

  const value = useMemo<StoreValue>(() => {
    const need = (): Session | null => {
      if (!session) notify("Sesi berakhir. Silakan masuk kembali.", "error");
      return session;
    };
    return {
      ready,
      session,
      items: data.items,
      requests: data.requests,
      loginPetugas: (name) => {
        const clean = name.trim().replace(/\s+/g, " ");
        const next: Session = {
          role: "petugas",
          name: clean,
          userId: `petugas-${slugify(clean) || "petugas"}`,
        };
        setSession(next);
        try {
          window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
        } catch {
          /* abaikan */
        }
        return next;
      },
      loginStudent: async (nim, password) => {
        const result = await authenticateStudent(nim, password);
        if (result.ok) {
          const next: Session = {
            role: "mahasiswa",
            name: result.account.name,
            userId: result.account.nim.toLowerCase(),
            nim: result.account.nim,
          };
          setSession(next);
          try {
            window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
          } catch {
            /* abaikan */
          }
        }
        return result;
      },
      registerStudent: async (values) => {
        const result = await createStudentAccount(values);
        if (result.ok) notify(result.message, "success");
        return result;
      },
      logout: () => {
        setSession(null);
        try {
          window.localStorage.removeItem(SESSION_KEY);
        } catch {
          /* abaikan */
        }
      },
      resetData: () => {
        commit(createSeedData(todayStr()));
        notify("Data berhasil diatur ulang ke kondisi awal.", "success");
      },
      addItem: (v) => run((d) => inv.addItem(d, v)),
      updateItem: (id, v) => run((d) => inv.updateItem(d, id, v)),
      deleteItem: (id) => run((d) => inv.deleteItem(d, id, todayStr())),
      markDamaged: (id, n) => run((d) => inv.markDamaged(d, id, n)),
      markRepaired: (id, n) => run((d) => inv.markRepaired(d, id, n)),
      submitRequest: (v) => {
        const s = need();
        return s ? run((d) => inv.submitRequest(d, s, v, todayStr())) : false;
      },
      cancelRequest: (id) => {
        const s = need();
        return s ? run((d) => inv.cancelRequest(d, id, s.userId, todayStr())) : false;
      },
      approveRequest: (id) => run((d) => inv.approveRequest(d, id, todayStr())),
      rejectRequest: (id, reason) => run((d) => inv.rejectRequest(d, id, reason, todayStr())),
      handoverRequest: (id) => run((d) => inv.handoverRequest(d, id, todayStr())),
      returnRequest: (id, damaged, note) =>
        run((d) => inv.returnRequest(d, id, damaged, note, todayStr())),
    };
  }, [ready, session, data, commit, run, notify]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
