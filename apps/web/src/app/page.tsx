import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 relative overflow-hidden">
      {/* Background aurora effect is applied in globals.css */}

      <div className="z-10 text-center max-w-3xl transition-opacity duration-75">
        <h1 className="text-6xl md:text-8xl font-serif font-bold mb-6 tracking-tight">
          Note<span className="text-primary">Flow</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          A production-grade, collaborative AI-powered notes workspace.
          Experience the next generation of thought organization.
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/auth/login">
            <button className="btn-primary flex items-center gap-2 text-lg">
              Get Started <ArrowRight size={20} />
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="btn-secondary text-lg">
              View Dashboard
            </button>
          </Link>
        </div>
      </div>

      {/* Decorative 3D elements will go here */}
    </main>
  );
}
