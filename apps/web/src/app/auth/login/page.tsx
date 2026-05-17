"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Mail, Lock } from "lucide-react";
import { login } from "@/lib/api";
import { getSession, saveSession } from "@/lib/localAuth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getSession()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await login(normalizedEmail, password);
      saveSession({
        token: response.accessToken || response.token,
        refreshToken: response.refreshToken,
        email: response.user?.email || normalizedEmail,
        name: response.user?.name || "",
        createdAt: new Date().toISOString(),
      });
      router.replace("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to sign in.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden bg-background text-foreground">
      <div className="glass-card w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 text-primary mb-4 border border-primary/30 shadow-[inset_0_0_15px_rgba(124,58,237,0.2)]">
            ✦
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600 text-sm">Enter your credentials to access your workspace.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="email" 
              placeholder="Email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-glass w-full pl-10"
              required
            />
          </div>
          
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-glass w-full pl-10"
              required
            />
          </div>

          <div className="flex justify-between items-center text-sm mt-2 mb-4">
            <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
              <input type="checkbox" className="rounded border-surface-border bg-background text-primary focus:ring-primary" />
              Remember me
            </label>
            <Link href="/auth/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center items-center gap-2 disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"} <ArrowRight size={18} />
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don&apos;t have an account? <Link href="/auth/signup" className="text-primary hover:underline">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
