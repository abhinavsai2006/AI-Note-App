"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Search, FileText, Bell } from "lucide-react";
import { getSession } from "@/lib/localAuth";
import { getNotes } from "@/lib/api";
import { getStoredAvatar } from "@/lib/localProfile";
import { getLocalNotes, type LocalNote } from "@/lib/localNotes";

export default function DashboardPage() {
  const [name, setName] = useState("Guest");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState<LocalNote[]>([]);

  useEffect(() => {
    const sync = async () => {
      const session = getSession();
      setName(session?.name || "Guest");
      setAvatarUrl(getStoredAvatar());
      if (session?.token) {
        try {
          const serverNotes = await getNotes(session.token);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped = (serverNotes as unknown as Array<Record<string, unknown>>).map((n) => ({
            id: String(n['id']),
            title: String(n['title'] ?? ''),
            content: String(n['content'] ?? ''),
            tags: ((n['tags'] || []) as Array<Record<string, unknown>>).map((t) => ({ id: String(t['id']), name: String(t['name']) })),
            isArchived: Boolean(n['isArchived']),
            isPublic: Boolean(n['isPublic']),
            shareId: n['shareId'] ? String(n['shareId']) : null,
            createdAt: String(n['createdAt'] ?? ''),
            updatedAt: String(n['updatedAt'] ?? ''),
          }));
          setNotes(mapped);
          return;
        } catch {
          // fallback to local
        }
      }
      setNotes(getLocalNotes());
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
              <p className="text-sm text-gray-600 line-clamp-3 mb-4">{note.content || "No content yet."}</p>
              <div className="flex flex-wrap gap-2">
                {note.tags.slice(0, 2).map((tag) => (
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
