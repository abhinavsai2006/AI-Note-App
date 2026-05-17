"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, PieChart, Settings, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { getSession, logoutLocalAuth } from "@/lib/localAuth";
import { getStoredAvatar } from "@/lib/localProfile";

export default function Sidebar({ mobileOpen }: { mobileOpen?: boolean }) {
  const pathname = usePathname();
  // Avoid reading localStorage/session during initial render to keep server and
  // client HTML the same. Initialize with a stable fallback and hydrate
  // the real values on the client inside an effect.
  const [name, setName] = useState("Guest");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => {
      const session = getSession();
      setName(session?.name || "Guest");
      setAvatarUrl(getStoredAvatar());
    };

    // mark hydrated first so client render matches server initial markup
    setHydrated(true);
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const navItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: FileText, label: "Notes", href: "/notes" },
    { icon: PieChart, label: "Insights", href: "/insights" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const mobileVisible = !!mobileOpen;

  return (
    <div
      className={`h-screen bg-white border-r border-gray-200 flex flex-col flex-shrink-0 relative overflow-visible ${
        mobileVisible ? 'fixed inset-0 z-40 w-72 shadow-lg md:static md:shadow-none' : 'hidden md:flex'
      }`}
    >
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 font-serif font-bold text-2xl mb-12">
          <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white">
            ✦
          </div>
          <span className="text-gray-900">Note<span className="text-indigo-600">Flow</span></span>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href) ?? false;
            return (
              <Link key={item.label} href={item.href} title={item.label}>
                <div
                  aria-hidden={false}
                  className={`flex items-center gap-4 px-4 py-3 rounded transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <item.icon
                    size={20}
                    className={`${isActive ? 'text-indigo-600' : 'group-hover:text-indigo-600'}`}
                  />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center text-gray-500 text-sm font-semibold">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="User avatar" fill className="object-cover" unoptimized />
            ) : (
              // Only show the initial after hydration to avoid hydration mismatch
              hydrated ? name.charAt(0).toUpperCase() : null
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-500">Workspace account</p>
          </div>
        </div>
        <button 
          onClick={() => {
            logoutLocalAuth();
            window.location.href = '/auth/login';
          }}
          className="w-full flex items-center gap-4 px-4 py-3 rounded text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
