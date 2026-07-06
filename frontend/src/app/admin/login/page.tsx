"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await api.login(email, password);
      api.setAccessToken(result.data.accessToken);
      localStorage.setItem("accessToken", result.data.accessToken);
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-vermilion flex items-center justify-center px-6 relative overflow-hidden">
      {/* Sacred background patterns */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 30% 20%, rgba(197,155,39,0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(197,155,39,0.06) 0%, transparent 50%)
          `,
        }}
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(197,155,39,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(197,155,39,1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="w-full max-w-md relative">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-gold/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-gold/80 text-xs font-medium tracking-widest uppercase">
              Admin Portal
            </span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-gold">
            Daanam Admin
          </h1>
          <p className="text-white/40 mt-2 text-sm">
            Temple Donation Management System
          </p>
        </div>

        {/* Login card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/95 backdrop-blur-sm temple-arch p-8 md:p-10 ambient-glow-strong space-y-6"
        >
          {error && (
            <div
              className="bg-error/8 border border-error/20 text-error rounded-lg p-3.5 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-ink-muted mb-2 tracking-wider uppercase"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@example.com"
              className="w-full px-4 py-3 rounded-lg bg-surface-warm border border-outline-variant/30 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none text-sm transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-ink-muted mb-2 tracking-wider uppercase"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg bg-surface-warm border border-outline-variant/30 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none text-sm transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-vermilion hover:bg-vermilion-light disabled:bg-outline-variant/30 disabled:text-ink/25 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-md text-sm tracking-wide"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-white/25 mt-8">
          <a
            href="/"
            className="hover:text-gold/60 transition-colors duration-200"
          >
            ← Back to Daanam Website
          </a>
        </p>
      </div>
    </div>
  );
}
