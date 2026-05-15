import { FileText, Sparkles, Activity, Clock } from "lucide-react";

const STATS = [
  { label: "Total Notes", value: "24", icon: FileText, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  { label: "AI Summaries Generated", value: "12", icon: Sparkles, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  { label: "Tokens Used", value: "14.2k", icon: Activity, color: "text-secondary", bg: "bg-secondary/10 border-secondary/20" },
  { label: "Hours Saved", value: "4.5", icon: Clock, color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20" },
];

export default function InsightsPage() {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-serif font-bold text-white mb-2">Productivity Insights</h1>
        <p className="text-white/60">Track your workspace activity and AI usage.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {STATS.map((stat, idx) => (
          <div
            key={stat.label}
            className={`glass-card p-6 border ${stat.bg}`}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-surface border border-surface-border">
                <stat.icon size={24} className={stat.color} />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-sm font-medium text-white/50">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 min-h-[400px] flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6">Weekly Activity</h3>
          <div className="flex-1 border-b border-l border-surface-border flex items-end justify-between p-4 pt-10 gap-2 relative">
            {/* Simple Bar Chart Mockup */}
            {[40, 70, 45, 90, 60, 30, 80].map((height, i) => (
              <div key={i} className="w-full relative group flex flex-col items-center justify-end h-full">
                <div
                  style={{ height: `${height}%` }}
                  className="w-full bg-primary/40 hover:bg-primary/60 border border-primary/50 rounded-t-sm transition-colors cursor-pointer relative"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface border border-surface-border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-white">
                    {height} actions
                  </div>
                </div>
                <span className="text-xs text-white/40 mt-2">
                  {["M", "T", "W", "T", "F", "S", "S"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6">Recent AI Summaries</h3>
          <div className="flex flex-col gap-4">
            {[
              { note: "Product Requirements", date: "Today, 10:30 AM", tokens: 450 },
              { note: "Q3 Marketing Strategy", date: "Yesterday, 2:15 PM", tokens: 820 },
              { note: "Investor Update", date: "Mon, 9:00 AM", tokens: 1200 },
              { note: "Design System Specs", date: "Last Week", tokens: 340 }
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-surface border border-surface-border flex justify-between items-center group cursor-pointer hover:bg-surface-hover transition-colors">
                <div>
                  <h4 className="font-bold text-white group-hover:text-primary transition-colors">{item.note}</h4>
                  <p className="text-xs text-white/50">{item.date}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono text-secondary bg-secondary/10 px-2 py-1 rounded">{item.tokens} tok</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
