"use client";

import { FileText, Sparkles, Activity, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { getInsightsStats, getWeeklyActivity, getNotes } from "@/lib/api";

interface StatsData {
  totalNotes: number;
  aiUsage: number;
  aiSummariesCount: number;
  notesThisWeek: number;
  mostUsedTag: string | null;
  avgNotesPerDay: number;
}

interface WeeklyData {
  date: string;
  count: number;
}

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  summary?: string;
  tags?: Array<{ id: string; name: string }>;
}

export default function InsightsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        setLoading(true);
        const [statsData, weeklyData, notesData] = await Promise.all([
          getInsightsStats(token),
          getWeeklyActivity(token),
          getNotes(token, { sort: "recent" }),
        ]);
        setStats(statsData);
        setWeeklyData(weeklyData);
        setRecentNotes(notesData?.slice(0, 4) || []);
      } catch (err) {
        console.error("Error loading insights:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const statCards = [
    { label: "Total Notes", value: stats?.totalNotes || "0", icon: FileText, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
    { label: "AI Summaries Generated", value: stats?.aiSummariesCount || "0", icon: Sparkles, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
    { label: "Most Used Tag", value: stats?.mostUsedTag || "—", icon: Activity, color: "text-secondary", bg: "bg-secondary/10 border-secondary/20" },
    { label: "Notes This Week", value: stats?.notesThisWeek || "0", icon: Clock, color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20" },
  ];

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <header className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2">Productivity Insights</h1>
        <p className="text-gray-600 text-sm md:text-base">Track your workspace activity and AI usage.</p>
      </header>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading insights...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-10">
            {statCards.map((stat, idx) => (
              <div
                key={stat.label}
                className={`glass-card p-4 md:p-6 border ${stat.bg}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 md:p-3 rounded-xl bg-surface border border-surface-border">
                    <stat.icon size={20} className={stat.color} />
                  </div>
                </div>
                <h3 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-xs md:text-sm font-medium text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Weekly Activity Chart */}
            <div className="glass-card p-4 md:p-6 min-h-[300px] md:min-h-[400px] flex flex-col">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">Weekly Activity</h3>
              <div className="flex-1 border-b border-l border-surface-border flex items-end justify-between p-2 md:p-4 pt-6 md:pt-10 gap-1 md:gap-2 relative">
                {(weeklyData?.length > 0 ? weeklyData.map(d => d.count) : [40, 70, 45, 90, 60, 30, 80]).map((height: number, i: number) => (
                  <div key={i} className="w-full relative group flex flex-col items-center justify-end h-full">
                    <div
                      style={{ height: `${height}%` }}
                      className="w-full bg-primary/40 hover:bg-primary/60 border border-primary/50 rounded-t-sm transition-colors cursor-pointer relative"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white border border-gray-300 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-gray-900">
                        {height} actions
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 mt-2">
                      {["M", "T", "W", "T", "F", "S", "S"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Notes */}
            <div className="glass-card p-4 md:p-6 flex flex-col">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">Recent Notes</h3>
              <div className="flex flex-col gap-3 md:gap-4">
                {recentNotes.length === 0 ? (
                  <p className="text-gray-600 text-sm">No notes yet. Create your first note!</p>
                ) : (
                  recentNotes.map((note) => (
                    <div key={note.id} className="p-3 md:p-4 rounded-xl bg-surface border border-surface-border flex justify-between items-center group cursor-pointer hover:bg-surface-hover transition-colors">
                      <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors text-sm md:text-base line-clamp-1">
                          {note.title || "Untitled"}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {note.summary && (
                        <div className="flex items-center gap-1 text-xs md:text-sm font-mono text-secondary bg-secondary/10 px-2 py-1 rounded">
                          <Sparkles size={12} /> AI
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
