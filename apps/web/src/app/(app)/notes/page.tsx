"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, FileText, Sparkles, Archive } from "lucide-react";
import { getLocalNotes, type LocalNote } from "@/lib/localNotes";
import { getSession } from "@/lib/localAuth";
import { getNotes, getPreviewText } from "@/lib/api";

type Tag = {
  id: string;
  name: string;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [showArchived, setShowArchived] = useState(false);
  const [sort, setSort] = useState<"recent" | "oldest">("recent");

  useEffect(() => {
    const sync = async () => {
      const session = getSession();
      if (session?.token) {
        try {
          const serverNotes = await getNotes(session.token);
          // transform server notes to LocalNote shape when possible
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
            summary: String(n['summary'] ?? ''),
            actionItems: (n['actionItems'] || []) as string[],
            suggestedTitle: n['suggestedTitle'] ? String(n['suggestedTitle']) : null,
          }));
          setNotes(mapped);
          return;
        } catch {
          /* fallback to local */
        }
      }
      setNotes(getLocalNotes());
    };
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    const uniqueTags = new Map<string, Tag>();
    notes.forEach((note) => note.tags.forEach((tag) => uniqueTags.set(tag.id, tag)));
    setTags(Array.from(uniqueTags.values()));
  }, [notes]);

  const filteredNotes = [...notes]
    .filter((note) => (showArchived ? true : !note.isArchived))
    .filter((note) => (selectedTag ? note.tags.some((tag) => tag.id === selectedTag) : true))
    .filter((note) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return `${note.title} ${note.content}`.toLowerCase().includes(query);
    })
    .sort((left, right) => {
      const leftTime = new Date(left.updatedAt).getTime();
      const rightTime = new Date(right.updatedAt).getTime();
      return sort === "recent" ? rightTime - leftTime : leftTime - rightTime;
    });

  return (
    <div className="flex w-full h-full flex-col md:flex-row">
      {/* Sidebar Filter Panel - Hidden on mobile */}
      <div className="w-64 border-r border-surface-border bg-surface/50 p-6 flex flex-col gap-8 hidden md:flex">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Sort</h3>
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
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Filters</h3>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
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
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Tags</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setSelectedTag("")}
              className={`text-left px-2 py-1 rounded text-sm transition-colors ${
                selectedTag === ""
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
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
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:text-gray-900"
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
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">All Notes</h1>
            <p className="text-gray-600 text-sm mt-1">Manage your notes and insights</p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-600 transition-colors" size={18} />
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

        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-400 mb-4">
              <FileText size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No notes found</h3>
            <p className="text-gray-600 mb-6">Create your first note to get started.</p>
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
                className="transition-transform duration-75 hover:-translate-y-1"
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
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{note.title || "Untitled"}</h3>
                    <p className="text-gray-600 text-sm mb-6 flex-1 line-clamp-3">{getPreviewText(note.content, 150)}</p>

                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-surface-border/50">
                      <div className="flex gap-2 overflow-hidden flex-wrap">
                        {note.tags?.slice(0, 2).map((tag: Tag) => (
                          <span key={tag.id} className="text-xs px-2 py-1 rounded bg-gray-100 border border-gray-300 text-gray-700">
                            {tag.name}
                          </span>
                        ))}
                        {note.tags?.length > 2 && <span className="text-xs px-2 py-1 text-gray-600">+{note.tags.length - 2}</span>}
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
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
