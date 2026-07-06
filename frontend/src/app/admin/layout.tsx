"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/donations", label: "Donations", icon: "💰" },
  { href: "/admin/reports", label: "Reports", icon: "📋" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: "📜" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth guard
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/admin/login"); return; }
    api.setAccessToken(token);
    api.getMe().then((res) => setAdmin(res.data)).catch(() => {
      localStorage.removeItem("accessToken");
      router.push("/admin/login");
    });
  }, [router]);

  const handleLogout = async () => {
    try { await api.logout(); } catch {}
    localStorage.removeItem("accessToken");
    api.setAccessToken(null);
    router.push("/admin/login");
  };

  // Don't render layout for login page
  if (pathname === "/admin/login") return <>{children}</>;
  if (!admin) return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-base flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-vermilion-deep text-white transform transition-transform duration-200 lg:translate-x-0 lg:static ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-6">
          <h1 className="text-xl font-heading font-bold text-gold">Daanam Admin</h1>
          <p className="text-white/40 text-xs mt-1">{admin.email}</p>
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-white/15 text-gold font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-white/50 hover:text-white text-sm rounded-lg hover:bg-white/5 transition-colors"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gold/10 px-6 py-3 flex items-center justify-between no-print">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2" aria-label="Open sidebar">
            <span className="text-xl">☰</span>
          </button>
          <div className="text-sm text-ink/50">
            {navItems.find((n) => pathname.startsWith(n.href))?.label || "Admin"}
          </div>
          <Link href="/" className="text-xs text-ink/30 hover:text-saffron transition-colors">
            View Website →
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
