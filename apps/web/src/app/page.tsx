import Link from "next/link";
import { ArrowRight, Sparkles, LayoutGrid, ShieldCheck, MessagesSquare, PenSquare, Layers3 } from "lucide-react";

const features = [
  {
    icon: PenSquare,
    title: "Smart writing workspace",
    description: "Draft, refine, and organize notes in a clean editor built for fast thinking.",
  },
  {
    icon: Sparkles,
    title: "AI-powered summaries",
    description: "Generate summaries, action items, and suggested titles from any note.",
  },
  {
    icon: LayoutGrid,
    title: "Structured note library",
    description: "Filter, sort, archive, and revisit work with a card-based notes system.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    description: "Keep your profile, avatar, and workspace data tied to your own session.",
  },
];

const highlights = [
  { label: "Notes organized", value: "120+" },
  { label: "AI summaries", value: "24/7" },
  { label: "Workspace views", value: "3" },
];

const workflow = [
  "Capture ideas instantly",
  "Run AI summaries and action items",
  "Share polished notes with one click",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-indigo-50/30 to-slate-50 text-gray-900">
      <section className="relative flex min-h-[calc(100vh-8.5rem)] items-start overflow-hidden pt-0 lg:pt-2">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-200/40 blur-3xl" />
          <div className="absolute top-24 right-10 h-64 w-64 rounded-full bg-violet-200/40 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-6 py-0 lg:px-8 lg:py-0">
          <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 px-5 py-3 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3 font-serif text-xl font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">✦</span>
              Note<span className="text-indigo-600">Flow</span>
            </div>
            <div className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
              <span>Workspace</span>
              <span>AI Insights</span>
              <span>Sharing</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="hidden rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:inline-flex">
                Sign In
              </Link>
              <Link href="/auth/signup" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700">
                Get Started <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="grid items-center gap-12 py-1 lg:grid-cols-2 lg:py-4">
            <div className="max-w-2xl">
              <h1 className="font-serif text-5xl font-bold tracking-tight text-gray-950 md:text-6xl lg:text-7xl">
                Notes that feel <span className="text-indigo-600">beautiful</span>, organized, and intelligent.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600 md:text-xl">
                NoteFlow combines a polished workspace, AI note insights, and clean sharing tools into one professional home for ideas.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/20 transition-transform hover:-translate-y-0.5 hover:bg-indigo-700">
                  Start free <ArrowRight size={18} />
                </Link>
                <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-800 shadow-sm transition-colors hover:bg-gray-50">
                  Open dashboard
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-4">
                {highlights.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                    <div className="text-2xl font-bold text-gray-950">{item.value}</div>
                    <div className="mt-1 text-sm text-gray-600">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-8 h-28 w-28 rounded-3xl bg-indigo-500/10 blur-2xl" />
              <div className="absolute -right-4 bottom-10 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-2xl shadow-indigo-900/5 backdrop-blur">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white shadow-lg">
                    <Sparkles className="mb-4" size={22} />
                    <p className="text-sm font-medium opacity-90">AI summary</p>
                    <p className="mt-2 text-xl font-semibold leading-7">Turn long notes into action-ready outcomes.</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-slate-50 p-5">
                    <MessagesSquare className="mb-4 text-indigo-600" size={22} />
                    <p className="text-sm font-medium text-gray-500">Collaboration</p>
                    <p className="mt-2 text-xl font-semibold leading-7 text-gray-900">Share polished ideas with clear context.</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <Layers3 className="mb-4 text-violet-600" size={22} />
                    <p className="text-sm font-medium text-gray-500">Workspace</p>
                    <p className="mt-2 text-xl font-semibold leading-7 text-gray-900">Organize work with cards, filters, and insights.</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-slate-950 p-5 text-white">
                    <LayoutGrid className="mb-4 text-cyan-300" size={22} />
                    <p className="text-sm font-medium text-slate-300">Landing-ready</p>
                    <p className="mt-2 text-xl font-semibold leading-7">A clean visual system that feels premium from the first click.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <article key={feature.title} className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <feature.icon size={22} />
              </div>
              <h3 className="text-xl font-semibold text-gray-950">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-600">{feature.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-950">A smoother note workflow</h2>
            <p className="mt-3 max-w-2xl text-gray-600">
              Designed to keep the experience focused: create a note, refine it with AI, organize it into cards, and share it without leaving the workspace.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {workflow.map((item, index) => (
                <div key={item} className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
                  <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white shadow-xl shadow-indigo-900/10">
            <h2 className="text-2xl font-bold">Ready to upgrade your workspace?</h2>
            <p className="mt-3 text-white/90">
              Start with a professional landing page, then move straight into an organized note experience.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-indigo-700 transition-colors hover:bg-indigo-50">
                Create account
              </Link>
              <Link href="/auth/login" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-5 py-3 font-semibold text-white transition-colors hover:bg-white/10">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
