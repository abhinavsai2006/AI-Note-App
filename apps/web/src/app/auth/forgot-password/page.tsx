'use client';

import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden bg-background text-foreground">
      <div className="glass-card w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 text-primary mb-4 border border-primary/30 shadow-[inset_0_0_15px_rgba(124,58,237,0.2)]">
            ✦
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600 text-sm">Password reset is not automated yet. We can still capture your email for a future reset flow.</p>
        </div>

        <form className="flex flex-col gap-4">
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input
              type="email"
              placeholder="Email address"
              className="input-glass w-full pl-10"
              required
            />
          </div>

          <button type="button" className="btn-primary w-full flex justify-center items-center gap-2">
            Send reset link <ArrowRight size={18} />
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Remembered it? <Link href="/auth/login" className="text-primary hover:underline">Back to login</Link>
        </p>
      </div>
    </main>
  );
}
