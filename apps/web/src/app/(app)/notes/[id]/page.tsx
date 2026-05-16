"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { ArrowLeft, Sparkles, CheckSquare, Clock, Link2, Copy } from "lucide-react";
import Link from "next/link";

const TipTapEditor = dynamic(() => import("@/components/editor/TipTapEditor"), {
  ssr: false,
  loading: () => (
    <div className="bg-white border border-gray-300 p-6 text-sm text-gray-600">Loading editor...</div>
  ),
});

export default function NoteEditorPage() {
  const [title, setTitle] = useState("Untitled Note");
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const contentRef = useRef("");
  const [aiResult, setAiResult] = useState<{ summary: string, action_items: string[], suggested_title: string } | null>(null);

  const handleContentChange = useCallback((html: string) => {
    contentRef.current = html;
  }, []);

  const handleGenerateAI = () => {
    setIsGenerating(true);
    // Simulate streaming AI generation
    setTimeout(() => {
      setIsGenerating(false);
      setAiResult({
        summary: "This note outlines the architectural planning and MVP features for NoteFlow. It covers the transition to Next.js 14, the implementation of a 3D glassmorphic UI, and the integration of Anthropic's Claude for summarization.",
        action_items: [
          "Finalize database schema",
          "Deploy Docker containers",
          "Implement WebSocket auto-save"
        ],
        suggested_title: "NoteFlow MVP Architecture & Planning"
      });
    }, 2500);
  };

  const handleShare = async () => {
    setIsSharing(true);
    setShareMessage(null);

    try {
      const shareId = `note-${Date.now()}`;
      const shareUrl = new URL(`${window.location.origin}/shared/${shareId}`);
      shareUrl.searchParams.set("title", title);
      shareUrl.searchParams.set("content", contentRef.current || "");
      shareUrl.searchParams.set("author", "You");
      shareUrl.searchParams.set("createdAt", new Date().toISOString());

      await navigator.clipboard.writeText(shareUrl.toString());
      setShareMessage("Share link copied to clipboard.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create share link.";
      setShareMessage(message);
    } finally {
      setIsSharing(false);
    }
  };

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
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent border-none text-2xl font-bold focus:outline-none focus:ring-0 text-gray-900 w-full max-w-md placeholder:text-gray-400"
              placeholder="Note Title"
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Clock size={14} /> Saved just now
            </span>
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

        <div className="flex-1 overflow-hidden">
          <div className="h-full w-full max-w-4xl mx-auto p-8">
            <TipTapEditor onChange={handleContentChange} />
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
                      {aiResult.action_items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <input type="checkbox" className="mt-1 rounded border-surface-border bg-background text-primary focus:ring-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
      </div>
    </div>
  );
}
