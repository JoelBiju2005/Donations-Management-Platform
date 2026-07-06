"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

function StatCard({ label, amount, count, color = "text-maroon" }: { label: string; amount: number; count: number; color?: string }) {
  return (
    <div className="bg-white rounded-xl p-6 gold-border shadow-sm">
      <p className="text-sm text-ink/50">{label}</p>
      <p className={`text-2xl font-bold tabular-nums mt-1 ${color}`}>
        ₹{(amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
      </p>
      <p className="text-xs text-ink/40 mt-1">{count} donation{count !== 1 ? "s" : ""}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    successful: "bg-success/10 text-success",
    rejected: "bg-error/10 text-error",
    pending_admin_review: "bg-warning/10 text-warning",
    pending_verification: "bg-ink/10 text-ink/60",
    marked_unsuccessful: "bg-error/5 text-error/70",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-ink/5 text-ink/50"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.getDashboardStats();
        setStats(res.data);
      } catch {}
      setLoading(false);
    };

    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-80 rounded-xl" />
          <div className="skeleton h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!stats) return <p className="text-ink/50">Failed to load dashboard.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-maroon">Dashboard Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today" amount={stats.totals.today.amount} count={stats.totals.today.count} color="text-saffron" />
        <StatCard label="This Week" amount={stats.totals.week.amount} count={stats.totals.week.count} />
        <StatCard label="This Month" amount={stats.totals.month.amount} count={stats.totals.month.count} />
        <StatCard label="This Year" amount={stats.totals.year.amount} count={stats.totals.year.count} color="text-success" />
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(stats.statusCounts || {}).map(([status, count]) => (
          <div key={status} className="bg-white rounded-lg p-4 gold-border text-center">
            <StatusBadge status={status} />
            <p className="text-xl font-bold mt-2 tabular-nums">{count as number}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent donations */}
        <div className="bg-white rounded-xl gold-border shadow-sm">
          <div className="px-6 py-4 border-b border-gold/10">
            <h2 className="font-heading font-semibold text-maroon">Recent Donations</h2>
          </div>
          <div className="divide-y divide-gold/5">
            {stats.recentDonations?.map((d: any) => (
              <div key={d._id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{d.donor?.name}</p>
                  <p className="text-xs text-ink/40">{new Date(d.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">₹{(d.amount / 100).toLocaleString("en-IN")}</p>
                  <StatusBadge status={d.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly trend (simplified — full Recharts integration) */}
        <div className="bg-white rounded-xl gold-border shadow-sm">
          <div className="px-6 py-4 border-b border-gold/10">
            <h2 className="font-heading font-semibold text-maroon">Monthly Trend</h2>
          </div>
          <div className="p-6">
            {stats.monthlyTrend?.length > 0 ? (
              <div className="space-y-2">
                {stats.monthlyTrend.map((m: any) => {
                  const maxAmount = Math.max(...stats.monthlyTrend.map((t: any) => t.total));
                  const width = maxAmount > 0 ? (m.total / maxAmount) * 100 : 0;
                  return (
                    <div key={m.month} className="flex items-center gap-3">
                      <span className="text-xs text-ink/40 w-16 tabular-nums">{m.month}</span>
                      <div className="flex-1 bg-ink/5 rounded-full h-6 overflow-hidden">
                        <div className="bg-saffron/80 h-full rounded-full transition-all duration-500" style={{ width: `${width}%` }} />
                      </div>
                      <span className="text-xs font-medium tabular-nums w-20 text-right">
                        ₹{(m.total / 100).toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-ink/30 text-sm text-center py-8">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 gold-border shadow-sm text-center">
          <p className="text-sm text-ink/50">Average Donation</p>
          <p className="text-2xl font-bold text-maroon tabular-nums mt-1">
            ₹{(stats.averageDonation / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 gold-border shadow-sm text-center">
          <p className="text-sm text-ink/50">Largest This Month</p>
          <p className="text-2xl font-bold text-saffron tabular-nums mt-1">
            ₹{stats.largestThisMonth ? (stats.largestThisMonth.amount / 100).toLocaleString("en-IN") : "0"}
          </p>
          {stats.largestThisMonth?.donorName && (
            <p className="text-xs text-ink/40 mt-1">{stats.largestThisMonth.donorName}</p>
          )}
        </div>
        <div className="bg-white rounded-xl p-6 gold-border shadow-sm text-center">
          <p className="text-sm text-ink/50">All-Time Total</p>
          <p className="text-2xl font-bold text-success tabular-nums mt-1">
            ₹{(stats.totals.all.amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-ink/40 mt-1">{stats.totals.all.count} donations</p>
        </div>
      </div>
    </div>
  );
}
