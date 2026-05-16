import Link from "next/link";
import { Plus, Search, FileText, Bell, Sparkles } from "lucide-react";

const MOCK_NOTES = [
  { id: "1", title: "Product Requirements", excerpt: "Define the core features for NoteFlow MVP...", tags: ["Engineering", "Planning"], ai: true, date: "2 hours ago" },
  { id: "2", title: "Q3 Marketing Strategy", excerpt: "Focus on social media presence and content...", tags: ["Marketing"], ai: false, date: "1 day ago" },
  { id: "3", title: "Investor Update", excerpt: "Metrics and growth highlights for the last month...", tags: ["Updates"], ai: true, date: "3 days ago" },
];

export default function DashboardPage() {
  return (
    <div className="flex-1 relative w-full pt-8 px-8 overflow-y-auto">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Good morning, Alex.</h1>
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary cursor-pointer ring-2 ring-transparent hover:ring-primary/50 transition-all"></div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {MOCK_NOTES.map((note, idx) => (
          <div
            key={note.id}
            className="transition-transform duration-75 hover:-translate-y-1"
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <Link href={`/notes/${note.id}`} className="block h-full">
              <div className="bg-surface border border-surface-border shadow-glass rounded-2xl transition-all duration-75 p-6 h-full flex flex-col cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 rounded-lg bg-surface border border-surface-border text-primary group-hover:bg-primary/20 transition-colors">
                    <FileText size={20} />
                  </div>
                  {note.ai && (
                    <span className="flex items-center gap-1 text-xs font-medium bg-primary/20 text-primary px-2 py-1 rounded-full border border-primary/30">
                      <Sparkles size={12} /> AI ✦
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{note.title}</h3>
                <p className="text-gray-600 text-sm mb-6 flex-1 line-clamp-2">{note.excerpt}</p>

                <div className="flex justify-between items-center mt-auto pt-4 border-t border-surface-border/50">
                  <div className="flex gap-2">
                    {note.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-1 rounded bg-gray-100 border border-gray-300 text-gray-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">{note.date}</span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
