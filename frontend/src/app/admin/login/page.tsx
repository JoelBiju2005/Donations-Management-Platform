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
    <div className="min-h-screen bg-base flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-maroon">Admin Login</h1>
          <p className="text-ink/50 mt-2">Temple Donation Management</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 gold-border shadow-md space-y-5">
          {error && (
            <div className="bg-error/10 text-error rounded-lg p-3 text-sm" role="alert">{error}</div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink/70 mb-1.5">Email</label>
            <input
              id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email" placeholder="admin@temple.local"
              className="w-full px-4 py-3 rounded-lg border border-gold/20 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink/70 mb-1.5">Password</label>
            <input
              id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete="current-password" placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg border border-gold/20 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-maroon hover:bg-maroon/90 disabled:bg-ink/10 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-ink/30 mt-6">
          <a href="/" className="hover:text-saffron transition-colors">← Back to Temple Website</a>
        </p>
      </div>
    </div>
  );
}
