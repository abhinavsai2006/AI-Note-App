"use client";

import { useState } from "react";
import { callAI } from "@/lib/api";

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);

  async function send() {
    if (!prompt.trim()) return;
    const userMsg = { role: "user", content: prompt };
    setMessages((s) => [...s, userMsg]);
    setPrompt("");
    setLoading(true);
    try {
      const data = await callAI(prompt);
      const content = data?.content ?? JSON.stringify(data?.raw ?? data ?? "No response");
      setMessages((s: Array<{role: string; content: string}>) => [...s, { role: "assistant", content }]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setMessages((s: Array<{role: string; content: string}>) => [...s, { role: "assistant", content: `Error: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        aria-label="Open AI Assistant"
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-6 z-50 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
      >
        ✦
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-black/20" onClick={() => setOpen(false)} />

          <div className="relative w-full max-w-2xl md:rounded-lg bg-white border border-gray-300 p-4 md:p-6 shadow-lg z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="max-h-[55vh] overflow-auto mb-4 space-y-3 px-2 border-t border-gray-200 pt-4">
              {messages.length === 0 && (
                <div className="text-gray-500">Ask the assistant to summarize notes, generate ideas, or help write content.</div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`p-3 rounded ${m.role === 'user' ? 'bg-indigo-50 ml-8 text-gray-900' : 'bg-gray-100 mr-8 text-gray-900'}`}>
                  <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 border-t border-gray-200 pt-4">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your prompt..."
                className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-900"
                onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              />
              <button
                onClick={send}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded shadow-sm"
              >
                {loading ? 'Thinking…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
