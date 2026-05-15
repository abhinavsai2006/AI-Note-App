"use client";

import Sidebar from "@/components/layouts/Sidebar";
import { useState } from "react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-surface-border/20">
          <button
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md bg-surface/20"
          >
            ☰
          </button>
          <div className="font-bold text-lg">NoteFlow ✦</div>
          <div />
        </header>

        <main className="flex-1 flex overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
