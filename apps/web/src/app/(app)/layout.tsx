"use client";

import Sidebar from "@/components/layouts/Sidebar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/localAuth";


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!getSession()) {
      router.replace('/auth/login');
    }
  }, [router]);

  return (
    <div className="flex h-screen bg-white text-gray-900 overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <button
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded bg-gray-100"
          >
            ☰
          </button>
          <div className="font-bold text-lg text-gray-900">NoteFlow ✦</div>
          <div />
        </header>

        <main className="flex-1 flex overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
