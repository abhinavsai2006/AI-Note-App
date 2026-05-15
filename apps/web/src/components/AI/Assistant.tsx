"use client";

import { useState } from "react";

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
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const content = data?.content ?? JSON.stringify(data?.raw ?? data ?? "No response");
      setMessages((s) => [...s, { role: "assistant", content }]);
    } catch (err: any) {
      setMessages((s) => [...s, { role: "assistant", content: `Error: ${err?.message || err}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        aria-label="Open AI Assistant"
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-6 z-50 bg-primary text-white p-3 rounded-full shadow-xl hover:scale-105 transition-transform"
      >
        ✦
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          <div className="relative w-full max-w-2xl md:rounded-2xl bg-surface border border-surface-border p-4 md:p-6 glass-card z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">AI Assistant</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/60 hover:text-white p-1 rounded"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="max-h-[55vh] overflow-auto mb-4 space-y-3 px-2">
              {messages.length === 0 && (
                <div className="text-white/60">Ask the assistant to summarize notes, generate ideas, or help write content.</div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-white/5 self-end' : 'bg-white/3'}`}>
                  <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your prompt..."
                className="input-glass flex-1"
                onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              />
              <button
                onClick={send}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
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
