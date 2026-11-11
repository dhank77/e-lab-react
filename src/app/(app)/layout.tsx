import { Navbar } from "@/components/Navbar";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireUser();
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar name={profile?.full_name || user.email || "User"} isAdmin={profile?.role === "admin"} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
