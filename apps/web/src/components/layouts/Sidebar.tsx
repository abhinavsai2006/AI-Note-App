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
      className={`h-screen bg-white border-r border-gray-200 flex flex-col flex-shrink-0 relative overflow-visible ${
        mobileVisible ? 'fixed inset-0 z-40 w-72 shadow-lg md:static md:shadow-none' : 'hidden md:flex'
      }`}
      style={{ width: isCollapsed ? 72 : 260 }}
    >
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute right-3 top-6 bg-gray-100 border border-gray-300 p-1 rounded text-gray-600 hover:bg-gray-200 z-20"
      >
        <Menu size={16} />
      </button>

      {mobileVisible && (
        <button
          onClick={() => onClose?.()}
          aria-label="Close sidebar"
          className="absolute left-[calc(100%+8px)] top-6 bg-transparent text-gray-600 p-1 rounded md:hidden"
        >
          ✕
        </button>
      )}

      <div className="p-6 pb-2">
        <div className={`flex items-center gap-3 font-serif font-bold text-2xl mb-12 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white">
            ✦
          </div>
          {!isCollapsed && <span className="text-gray-900">Note<span className="text-indigo-600">Flow</span></span>}
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
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
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-gray-200">
        <button className={`w-full flex items-center gap-4 px-4 py-3 rounded text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
          <LogOut size={20} />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}
