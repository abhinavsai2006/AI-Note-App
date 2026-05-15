"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, PieChart, Settings, LogOut, Menu } from "lucide-react";
import { useState } from "react";

export default function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: FileText, label: "Notes", href: "/notes" },
    { icon: PieChart, label: "Insights", href: "/insights" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const mobileVisible = !!mobileOpen;

  return (
    <div
      className={`h-screen bg-surface border-r border-surface-border flex flex-col flex-shrink-0 relative transition-[width] duration-300 overflow-visible ${
        mobileVisible ? 'fixed inset-0 z-40 w-72 shadow-lg md:static md:shadow-none' : 'hidden md:flex'
      }`}
      style={{ width: isCollapsed ? 72 : 260 }}
    >
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute right-3 top-6 bg-surface border border-surface-border p-1 rounded-full text-white/70 hover:text-white hover:bg-surface-hover z-20"
      >
        <Menu size={16} />
      </button>

      {mobileVisible && (
        <button
          onClick={() => onClose?.()}
          aria-label="Close sidebar"
          className="absolute left-[calc(100%+8px)] top-6 bg-transparent text-white/70 p-1 rounded-full md:hidden"
        >
          ✕
        </button>
      )}

      <div className="p-6 pb-2">
        <div className={`flex items-center gap-3 font-serif font-bold text-2xl mb-12 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center flex-shrink-0">
            ✦
          </div>
          {!isCollapsed && <span>Note<span className="text-primary">Flow</span></span>}
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.label} href={item.href} title={item.label}>
                <div
                  aria-hidden={false}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-primary/20 text-primary border border-primary/30 shadow-[inset_0_0_15px_rgba(124,58,237,0.1)]'
                      : 'text-white/60 hover:bg-surface-hover hover:text-white border border-transparent'
                  }`}
                >
                  <item.icon
                    size={20}
                    className={`${isCollapsed ? 'text-white' : isActive ? 'text-primary' : 'group-hover:text-primary'} transition-colors`}
                  />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-surface-border/50">
        <button className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
          <LogOut size={20} />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}
