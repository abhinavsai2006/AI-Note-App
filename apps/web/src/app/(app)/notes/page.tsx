"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, FileText, Sparkles, Archive } from "lucide-react";
import { getNotes, getTags } from "@/lib/api";

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [showArchived, setShowArchived] = useState(false);
  const [sort, setSort] = useState<"recent" | "oldest">("recent");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        setLoading(true);
        const [notesData, tagsData] = await Promise.all([
          getNotes(token, { search: searchQuery, tag: selectedTag, sort, archive: showArchived }),
          getTags(token),
        ]);
        setNotes(notesData || []);
        setTags(tagsData || []);
      } catch (err) {
        console.error("Error loading notes:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token, searchQuery, selectedTag, sort, showArchived]);

  const filteredNotes = notes;

  return (
    <div className="flex w-full h-full flex-col md:flex-row">
      {/* Sidebar Filter Panel - Hidden on mobile */}
      <div className="w-64 border-r border-surface-border bg-surface/50 p-6 flex flex-col gap-8 hidden md:flex">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Sort</h3>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "recent" | "oldest")}
            className="input-glass w-full text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Filters</h3>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-white/70 hover:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-surface-border bg-transparent text-primary"
              />
              Archived
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Tags</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setSelectedTag("")}
              className={`text-left px-2 py-1 rounded text-sm transition-colors ${
                selectedTag === ""
                  ? "bg-primary/20 text-primary"
                  : "text-white/70 hover:text-white"
              }`}
            >
              All Tags
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.id)}
                className={`text-left px-2 py-1 rounded text-sm transition-colors ${
                  selectedTag === tag.id
                    ? "bg-primary/20 text-primary"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white">All Notes</h1>
            <p className="text-white/60 text-sm mt-1">Manage your notes and insights</p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-glass pl-10 w-full md:w-64 text-sm"
              />
            </div>
            <Link href="/notes/new" className="flex-1 md:flex-initial">
              <button className="btn-primary flex items-center justify-center gap-2 px-4 py-2 text-sm w-full md:w-auto">
                <Plus size={16} /> New Note
              </button>
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-surface border border-surface-border flex items-center justify-center text-white/30 mb-4 animate-pulse">
              <FileText size={32} />
            </div>
            <p className="text-white/60">Loading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-surface border border-surface-border flex items-center justify-center text-white/30 mb-4">
              <FileText size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No notes found</h3>
            <p className="text-white/50 mb-6">Try adjusting your search or filters.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTag("");
                setShowArchived(false);
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20">
            {filteredNotes.map((note, idx) => (
              <div
                key={note.id}
                className="transition-transform duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <Link href={`/notes/${note.id}`} className="block h-full">
                  <div className="glass-card p-6 h-full flex flex-col cursor-pointer group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 rounded-lg bg-surface border border-surface-border text-primary group-hover:bg-primary/20 transition-colors">
                        <FileText size={20} />
                      </div>
                      {note.summary && (
                        <span className="flex items-center gap-1 text-xs font-medium bg-primary/20 text-primary px-2 py-1 rounded-full border border-primary/30">
                          <Sparkles size={12} /> AI ✦
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{note.title || "Untitled"}</h3>
                    <p className="text-white/50 text-sm mb-6 flex-1 line-clamp-3">{note.content || "No content..."}</p>

                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-surface-border/50">
                      <div className="flex gap-2 overflow-hidden flex-wrap">
                        {note.tags?.slice(0, 2).map((tag: any) => (
                          <span key={tag.id} className="text-xs px-2 py-1 rounded bg-surface border border-surface-border text-white/70">
                            {tag.name}
                          </span>
                        ))}
                        {note.tags?.length > 2 && <span className="text-xs px-2 py-1 text-white/50">+{note.tags.length - 2}</span>}
                      </div>
                      <span className="text-xs text-white/40 flex-shrink-0 ml-2">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {note.isArchived && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400">
                        <Archive size={12} /> Archived
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
