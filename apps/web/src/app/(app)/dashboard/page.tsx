"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Search, FileText, Bell, AlertCircle } from "lucide-react";
import { getSession, logoutLocalAuth } from "@/lib/localAuth";
import { getNotes, getPreviewText } from "@/lib/api";
import { getStoredAvatar } from "@/lib/localProfile";

type DashboardTag = {
  id: string;
  name: string;
};

type DashboardNote = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  tags?: DashboardTag[];
};

export default function DashboardPage() {
  const [name, setName] = useState(() => getSession()?.name || "Guest");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => getStoredAvatar());
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sync = async () => {
      try {
        setError(null);
        const session = getSession();
        setName(session?.name || "Guest");
        setAvatarUrl(getStoredAvatar());
        
        if (!session?.token) return;
        const serverNotes = await getNotes(session.token);
        setNotes(serverNotes as DashboardNote[]);
      } catch (err) {
        console.error('Error syncing notes:', err);
        const message = err instanceof Error ? err.message : '';
        if (message.includes('401') || message.includes('Unauthorized')) {
          logoutLocalAuth();
          window.location.replace('/auth/login');
          return;
        }
        setError('Failed to load notes');
      }
    };

    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const recentNotes = notes.slice(0, 3);

  return (
    <div className="flex-1 relative w-full pt-8 px-8 overflow-y-auto">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Good morning, {name}.</h1>
          <p className="text-gray-600 text-lg">Here&apos;s what&apos;s happening with your notes.</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search notes... (Cmd+K)" 
              className="input-glass pl-10 w-64 text-sm"
            />
          </div>
          <button className="p-2 rounded-full bg-surface border border-surface-border hover:bg-surface-hover transition-colors">
            <Bell size={20} className="text-gray-600" />
          </button>
          <button className="relative w-10 h-10 rounded-full overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-primary/50 transition-all bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 font-semibold" aria-label="Avatar">
            {avatarUrl ? <Image src={avatarUrl} alt="Avatar" fill className="object-cover" unoptimized /> : name.charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      {error && (
        <div className="flex gap-3 items-start rounded-lg border border-amber-300 bg-amber-50 p-4 mb-6 text-amber-800">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div className="text-sm">{error}</div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          Recent Notes
        </h2>
        <Link href="/notes/new">
          <button className="btn-primary flex items-center gap-2 px-4 py-2">
            <Plus size={18} /> New Note
          </button>
        </Link>
      </div>

      {recentNotes.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-400 mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No notes yet</h3>
          <p className="text-gray-600 mb-6">Create your first note to start your workspace.</p>
          <Link href="/notes/new">
            <button className="btn-primary flex items-center gap-2 px-4 py-2 mx-auto">
              <Plus size={18} /> New Note
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-12">
          {recentNotes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`} className="glass-card p-5 hover:border-indigo-300 transition-colors">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">Updated {new Date(note.updatedAt).toLocaleDateString()}</p>
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{note.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-3 mb-4">{getPreviewText(note.content, 150)}</p>
              <div className="flex flex-wrap gap-2">
                {(note.tags ?? []).slice(0, 2).map((tag) => (
                  <span key={tag.id} className="text-xs px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700">{tag.name}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
