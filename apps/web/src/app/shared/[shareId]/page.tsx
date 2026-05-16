"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getSharedNote } from "@/lib/api";
import { FileText, Share2 } from "lucide-react";
import { getSharedLocalNote } from "@/lib/localNotes";

interface SharedNote {
  id: string;
  title: string;
  content: string;
  user: { name: string };
  tags: Array<{ id: string; name: string }>;
  createdAt: string;
  updatedAt?: string;
  summary?: string;
}

export default function SharedNotePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shareId = params.shareId as string;
  const [note, setNote] = useState<SharedNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!shareId) return;
      const inlineTitle = searchParams.get("title") || "";
      const inlineContent = searchParams.get("content") || "";

      const localNote = getSharedLocalNote(shareId);
      if (localNote) {
        setNote({
          id: localNote.id,
          title: localNote.title,
          content: localNote.content,
          user: { name: searchParams.get("author") || "Anonymous" },
          tags: localNote.tags,
          createdAt: localNote.createdAt,
          updatedAt: localNote.updatedAt,
          summary: localNote.summary ?? undefined,
        });
        setLoading(false);
        return;
      }

      if (inlineTitle || inlineContent) {
        setNote({
          id: shareId,
          title: inlineTitle || "Untitled Note",
          content: inlineContent || "",
          user: { name: searchParams.get("author") || "Anonymous" },
          tags: [],
          createdAt: searchParams.get("createdAt") || new Date().toISOString(),
          summary: undefined,
        });
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getSharedNote(shareId);
        setNote(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load note";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [searchParams, shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-400 mb-4 mx-auto animate-pulse">
            <FileText size={32} />
          </div>
          <p className="text-gray-600">Loading note...</p>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-400 mb-4 mx-auto">
            <FileText size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Note not found</h1>
          <p className="text-gray-600 mb-6">{error || "This shared note could not be found."}</p>
          <a href="/" className="btn-primary inline-block">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-8 pb-20">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {/* Header */}
        <header className="mb-12 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gray-100 border border-gray-300 text-indigo-600">
                <FileText size={24} />
              </div>
              <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                <Share2 size={14} />
                <span className="text-xs font-medium">Shared Note</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
              {note.title || "Untitled Note"}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>{note.user?.name || "Anonymous"}</span>
              <span>•</span>
              <span>
                {new Date(note.createdAt || note.updatedAt || "").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <article className="glass-card p-6 md:p-8 mb-8">
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-surface-border">
              {note.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-3 py-1 rounded-full bg-white border border-gray-300 text-gray-700"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="prose max-w-none mb-8">
            <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
              {note.content}
            </div>
          </div>

          {note.summary && (
            <div className="mt-8 p-4 md:p-6 rounded-lg bg-primary/10 border border-primary/30">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">AI Summary</h3>
              <p className="text-gray-700">{note.summary}</p>
            </div>
          )}
        </article>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>This is a shared note. <a href="/" className="text-primary hover:text-primary/80 transition-colors">Create your own workspace</a></p>
        </div>
      </div>
    </div>
  );
}
