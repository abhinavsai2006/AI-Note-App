"use client";

import { FileText, Sparkles, Activity, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getNotes } from "@/lib/api";
import { getSession } from "@/lib/localAuth";

type InsightTag = {
  id: string;
  name: string;
};

type InsightNote = {
  id: string;
  title: string;
  updatedAt: string;
  summary?: unknown;
  tags?: InsightTag[];
};

export default function InsightsPage() {
  const [notes, setNotes] = useState<InsightNote[]>([]);

  useEffect(() => {
    const sync = async () => {
      const session = getSession();
      if (!session?.token) {
        setNotes([]);
        return;
      }

      try {
        const serverNotes = await getNotes(session.token);
        setNotes(serverNotes as InsightNote[]);
      } catch (error) {
        console.error('Error syncing notes:', error instanceof Error ? error.message : String(error));
        setNotes([]);
      }
    };

    sync();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);

    const notesThisWeek = notes.filter((note) => new Date(note.updatedAt) >= weekStart).length;
    const aiUsage = notes.filter((note) => Boolean(note.summary)).length;
    const tagCounts = new Map<string, number>();

    notes.forEach((note) => {
      (note.tags ?? []).forEach((tag) => {
        tagCounts.set(tag.name, (tagCounts.get(tag.name) || 0) + 1);
      });
    });

    const mostUsedTag = Array.from(tagCounts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
    const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - index));
      const start = new Date(day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(day);
      end.setHours(23, 59, 59, 999);
      return notes.filter((note) => {
        const updatedAt = new Date(note.updatedAt);
        return updatedAt >= start && updatedAt <= end;
      }).length;
    });

    return {
      totalNotes: notes.length,
      aiUsage,
      aiSummariesCount: aiUsage,
      notesThisWeek,
      mostUsedTag,
      avgNotesPerDay: notes.length ? Number((notes.length / 7).toFixed(1)) : 0,
      weeklyActivity,
    };
  }, [notes]);

  const statCards = [
    { label: "Total Notes", value: stats.totalNotes || "0", icon: FileText, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    { label: "AI Summaries Generated", value: stats.aiSummariesCount || "0", icon: Sparkles, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
    { label: "Most Used Tag", value: stats.mostUsedTag || "—", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
    { label: "Notes This Week", value: stats.notesThisWeek || "0", icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  ];

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <header className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2">Productivity Insights</h1>
        <p className="text-gray-600 text-sm md:text-base">Track your workspace activity and AI usage.</p>
      </header>

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
        <div className="glass-card p-4 md:p-6 min-h-[300px] md:min-h-[400px] flex flex-col">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">Weekly Activity</h3>
          <div className="flex-1 border-b border-l border-surface-border flex items-end justify-between p-4 gap-2">
            {stats.weeklyActivity.map((count, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full max-w-10 bg-indigo-100 border border-indigo-200 rounded-t-lg flex items-end justify-center" style={{ height: `${Math.max(16, count * 20)}px` }}>
                  <span className="text-xs font-semibold text-indigo-700 pb-1">{count}</span>
                </div>
                <span className="text-[10px] text-gray-500">{index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-4 md:p-6 flex flex-col">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">Recent Notes</h3>
          {notes.length === 0 ? (
            <p className="text-gray-600 text-sm">No notes yet. Create your first note to see insights here.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {notes.slice(0, 4).map((note) => (
                <div key={note.id} className="p-3 rounded-lg border border-gray-200 bg-white">
                  <p className="font-medium text-gray-900 text-sm truncate">{note.title}</p>
                  <p className="text-xs text-gray-500">Updated {new Date(note.updatedAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
