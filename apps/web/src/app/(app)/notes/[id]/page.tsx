"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Sparkles, CheckSquare, Clock, Link2, Copy, Archive, Trash2, Loader } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { callAI, createSharedNote, generateAISummary } from "@/lib/api";
import { deleteLocalNote, getLocalNote, setNoteArchived, shareLocalNote, updateLocalNote } from "@/lib/localNotes";
import { getSession } from "@/lib/localAuth";

const TipTapEditor = dynamic(() => import("@/components/editor/TipTapEditor"), {
  ssr: false,
  loading: () => (
    <div className="bg-white border border-gray-300 p-6 text-sm text-gray-600">Loading editor...</div>
  ),
});

// Debounce utility
const debounce = <Args extends readonly unknown[]>(func: (...args: Args) => void, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params?.id as string;
  const [title, setTitle] = useState("Untitled Note");
  const [content, setContent] = useState("");
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrlState, setShareUrlState] = useState<string | null>(null);
  const [isArchived, setIsArchived] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const contentRef = useRef("");
  const debouncedSaveRef = useRef<((nextTitle: string, nextContent: string) => void) | null>(null);
  const [aiResult, setAiResult] = useState<{ summary: string; action_items: string[]; suggested_title: string } | null>(null);

  useEffect(() => {
    if (!noteId || noteId === "new") {
      setNotFound(true);
      return;
    }

    const note = getLocalNote(noteId);
    if (!note) {
      setNotFound(true);
      return;
    }

    setNotFound(false);
    setTitle(note.title);
    setContent(note.content);
    contentRef.current = note.content;
    setIsArchived(note.isArchived);
    setAiResult(
      note.summary
        ? {
            summary: note.summary,
            action_items: note.actionItems ?? [],
            suggested_title: note.suggestedTitle ?? note.title,
          }
        : null
    );
  }, [noteId]);

  const persistNote = useCallback(
    (nextTitle: string, nextContent: string) => {
      if (!noteId || noteId === "new" || notFound) return;
      updateLocalNote(noteId, {
        title: nextTitle,
        content: nextContent,
        isArchived,
      });
      setSaveStatus('saved');
    },
    [isArchived, noteId, notFound]
  );

  // Initialize debounced save function
  useEffect(() => {
    debouncedSaveRef.current = debounce((nextTitle: string, nextContent: string) => {
      setSaveStatus('saving');
      persistNote(nextTitle, nextContent);
    }, 1500); // Save after 1.5 seconds of inactivity
  }, [persistNote]);

  const handleContentChange = useCallback((html: string) => {
    contentRef.current = html;
    setContent(html);
    setSaveStatus('unsaved');
    debouncedSaveRef.current?.(title, html);
  }, [title]);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const session = getSession();

      // If user is authenticated, prefer server-side DB-backed summary generation
      if (session?.token && noteId && noteId !== "new" && !notFound) {
        const record = await generateAISummary(session.token, noteId);

        // record from server: { id, noteId, summary, actionItems, suggestedTitle, ... }
        const summary = record?.summary ?? "";
        const actionItems = Array.isArray(record?.actionItems) ? record.actionItems.map((i: unknown) => String(i)) : [];
        const suggestedTitle = record?.suggestedTitle ?? title;

        setAiResult({ summary, action_items: actionItems, suggested_title: suggestedTitle });
        setTitle(suggestedTitle);
        updateLocalNote(noteId, {
          title: suggestedTitle,
          content: contentRef.current || content,
          summary,
          actionItems,
          suggestedTitle,
        });
      } else {
        const response = await callAI(
          `Create a concise summary, action items, and a suggested title for this note. Return JSON with summary, action_items, and suggested_title.\n\nTitle: ${title}\nUser: ${session?.name || "NoteFlow user"}\nContent: ${contentRef.current || content}`
        );

        const summary = typeof response?.summary === "string" ? response.summary : response?.content || "No summary generated.";
        const actionItems = Array.isArray(response?.action_items)
          ? response.action_items.map((item: unknown) => String(item))
          : [];
        const suggestedTitle = typeof response?.suggested_title === "string" ? response.suggested_title : title;

        setAiResult({ summary, action_items: actionItems, suggested_title: suggestedTitle });
        setTitle(suggestedTitle);
        if (noteId && noteId !== "new" && !notFound) {
          updateLocalNote(noteId, {
            title: suggestedTitle,
            content: contentRef.current || content,
            summary,
            actionItems,
            suggestedTitle,
          });
        }
      }
    } catch {
      setAiResult({
        summary: "AI generation is temporarily unavailable.",
        action_items: [],
        suggested_title: title,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    setShareMessage(null);
    setShareUrlState(null);

    try {
      if (!noteId || noteId === "new") {
        throw new Error("Save the note before sharing it.");
      }

      // If authenticated, prefer DB-backed note share via notes/:id/share
      try {
        const session = getSession();
        if (session?.token && noteId && noteId !== "new") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const resp = await (await import("@/lib/api")).shareNote(session.token, noteId as string);
          if (resp?.shareUrl) {
            setShareUrlState(resp.shareUrl);
            setShareMessage("Share link ready.");
            return;
          }
        }

        const payload = {
          title: title || "Untitled",
          content: contentRef.current || content,
          author: getSession()?.name || undefined,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resp = await createSharedNote(payload as any);
        if (resp?.shareUrl) {
          setShareUrlState(resp.shareUrl);
          setShareMessage("Share link ready.");
          return;
        }
      } catch {
        // server unavailable or returned error — fall back to local share
      }

      const result = shareLocalNote(noteId);
      if (!result) {
        throw new Error("Unable to create share link.");
      }

      setShareUrlState(result.shareUrl);
      setShareMessage("Share link ready.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create share link.";
      setShareMessage(message);
    } finally {
      setIsSharing(false);
    }
  };

  const handleArchiveToggle = () => {
    if (!noteId || noteId === "new") return;
    const updated = setNoteArchived(noteId, !isArchived);
    setIsArchived(!isArchived);
    if (updated) {
      setShareMessage(updated.isArchived ? "Note archived." : "Note restored.");
    }
  };

  const handleDelete = () => {
    if (!noteId || noteId === "new") return;
    deleteLocalNote(noteId);
    router.push("/notes");
  };

  if (notFound) {
    return (
      <div className="flex w-full h-full items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Note not found</h1>
          <p className="text-gray-600 mb-6">Create a new note or return to the notes list.</p>
          <div className="flex justify-center gap-3">
            <Link href="/notes" className="btn-secondary">Back to Notes</Link>
            <Link href="/notes/new" className="btn-primary">New Note</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full relative">
      {/* Main Editor Area */}
      <div className={`flex-1 flex flex-col transition-all duration-75 ${isAiPanelOpen ? 'pr-80' : ''}`}>
        <header className="flex justify-between items-center px-8 py-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <input 
              type="text" 
              value={title}
              onChange={(e) => {
                const newTitle = e.target.value;
                setTitle(newTitle);
                setSaveStatus('unsaved');
                debouncedSaveRef.current?.(newTitle, contentRef.current || content);
              }}
              className="bg-transparent border-none text-2xl font-bold focus:outline-none focus:ring-0 text-gray-900 w-full max-w-md placeholder:text-gray-400"
              placeholder="Note Title"
            />
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-sm flex items-center gap-1 transition-colors ${
              saveStatus === 'saving' ? 'text-yellow-600' :
              saveStatus === 'unsaved' ? 'text-red-600' :
              'text-green-600'
            }`}>
              {saveStatus === 'saving' && <Loader size={14} className="animate-spin" />}
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'unsaved' && '●'}
              {saveStatus === 'unsaved' && 'Unsaved changes'}
              {saveStatus === 'saved' && <Clock size={14} />}
              {saveStatus === 'saved' && 'All changes saved'}
            </span>
            <button
              onClick={handleArchiveToggle}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 transition-all duration-75"
            >
              <Archive size={18} /> {isArchived ? "Restore" : "Archive"}
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition-all duration-75"
            >
              <Trash2 size={18} /> Delete
            </button>
            <button 
              onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-75 ${isAiPanelOpen ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-indigo-600'}`}
            >
              <Sparkles size={18} /> AI Assistant
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="btn-primary flex items-center gap-2 disabled:opacity-60"
            >
              <Link2 size={18} /> {isSharing ? "Sharing..." : "Share"}
            </button>
          </div>
        </header>

        {shareMessage && (
          <div className="px-8 pt-4">
            <div className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-700">
              <Copy size={14} /> {shareMessage}
            </div>
          </div>
        )}

        {shareUrlState && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShareUrlState(null)} />
            <div className="bg-white rounded-lg shadow-lg p-6 z-10 w-full max-w-lg">
              <h3 className="text-lg font-bold mb-3">Share Link</h3>
              <p className="text-sm text-gray-600 mb-4">Anyone with this link can view the note.</p>
              <div className="flex items-center gap-2 mb-4">
                <input readOnly value={shareUrlState} className="flex-1 p-2 border border-gray-200 rounded" />
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareUrlState);
                      setShareMessage("Share link copied to clipboard.");
                    } catch {
                      setShareMessage("Unable to copy to clipboard.");
                    }
                  }}
                  className="btn-primary px-3 py-2"
                >
                  Copy
                </button>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setShareUrlState(null)} className="px-3 py-2 rounded bg-gray-100">Close</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <div className="h-full w-full max-w-4xl mx-auto p-8">
            <TipTapEditor key={noteId} content={content} onChange={handleContentChange} />
          </div>
        </div>
      </div>

      {/* AI Panel */}
      <div
        className={`w-80 h-full absolute right-0 top-0 bg-white border-l border-gray-300 shadow-sm flex flex-col z-20 transition-transform duration-75 ${
          isAiPanelOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
            <div className="p-6 border-b border-gray-300 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2 text-indigo-600">
                <Sparkles size={20} /> AI Insights
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {!aiResult && !isGenerating && (
                <div className="text-center mt-10">
                  <p className="text-gray-600 text-sm mb-6">Generate an intelligent summary, extract action items, and get title suggestions.</p>
                  <button onClick={handleGenerateAI} className="btn-primary w-full flex justify-center items-center gap-2">
                    <Sparkles size={18} /> Generate Insights
                  </button>
                </div>
              )}

              {isGenerating && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-indigo-600">
                  <Sparkles size={32} className="opacity-50 animate-spin" />
                  <p className="text-sm animate-pulse">Analyzing note...</p>
                </div>
              )}

              {aiResult && !isGenerating && (
                <div className="flex flex-col gap-6">
                  <div className="bg-gray-50 border border-gray-300 p-4 rounded-lg shadow-sm">
                    <h4 className="text-xs font-bold uppercase text-gray-600 mb-2 tracking-wider">Suggested Title</h4>
                    <button 
                      onClick={() => setTitle(aiResult.suggested_title)}
                      className="text-left font-medium text-indigo-600 hover:underline"
                    >
                      {aiResult.suggested_title}
                    </button>
                  </div>

                  <div className="bg-gray-50 border border-gray-300 p-4 rounded-lg shadow-sm">
                    <h4 className="text-xs font-bold uppercase text-gray-600 mb-2 tracking-wider">Summary</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {aiResult.summary}
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-300 p-4 rounded-lg shadow-sm">
                    <h4 className="text-xs font-bold uppercase text-gray-600 mb-3 tracking-wider flex items-center gap-2">
                      <CheckSquare size={14} /> Action Items
                    </h4>
                    <ul className="flex flex-col gap-2">
                      {aiResult.action_items.length === 0 ? (
                        <li className="text-sm text-gray-500">No action items generated.</li>
                      ) : (
                        aiResult.action_items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <input type="checkbox" className="mt-1 rounded border-surface-border bg-background text-primary focus:ring-primary" />
                          <span>{item}</span>
                        </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
      </div>
    </div>
  );
}
