"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    successful: "bg-success/10 text-success",
    rejected: "bg-error/10 text-error",
    pending_admin_review: "bg-warning/10 text-warning",
    pending_verification: "bg-ink/10 text-ink/60",
    marked_unsuccessful: "bg-error/5 text-error/70",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${styles[status] || "bg-ink/5"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

const dateFilters = [
  { label: "Today", days: 0 },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 15 Days", days: 15 },
  { label: "Last Month", days: 30 },
  { label: "Last 3 Months", days: 90 },
  { label: "This Year", days: 365 },
];

export default function DonationsPage() {
  const [donations, setDonations] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(365);
  const [page, setPage] = useState(1);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateFilter);

      const params: Record<string, string> = {
        page: String(page),
        limit: "20",
        startDate: startDate.toISOString(),
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.listDonations(params);
      setDonations(res.data.donations);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchDonations(); }, [page, statusFilter, dateFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchDonations(); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleExport = async (format: string) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateFilter);
      const blob = await api.exportCsv({
        startDate: startDate.toISOString(),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `donations-export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-heading font-bold text-maroon">Donation History</h1>
        <button
          onClick={() => handleExport("csv")}
          className="px-4 py-2 bg-maroon text-white text-sm rounded-lg hover:bg-maroon/90 transition-colors"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 gold-border shadow-sm space-y-4">
        {/* Search */}
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, receipt #, transaction ID, or amount..."
          className="w-full px-4 py-2.5 rounded-lg border border-gold/20 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none text-sm"
        />

        <div className="flex flex-wrap gap-2">
          {/* Date filters */}
          {dateFilters.map((df) => (
            <button
              key={df.days}
              onClick={() => { setDateFilter(df.days || 1); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                dateFilter === (df.days || 1) ? "bg-saffron text-white" : "bg-ink/5 text-ink/50 hover:bg-ink/10"
              }`}
            >
              {df.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Status filters */}
          {["", "successful", "rejected", "pending_admin_review", "marked_unsuccessful"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-maroon text-white" : "bg-ink/5 text-ink/50 hover:bg-ink/10"
              }`}
            >
              {s ? s.replace(/_/g, " ") : "All Statuses"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl gold-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
          </div>
        ) : donations.length === 0 ? (
          <div className="p-12 text-center text-ink/30">No donations found matching your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-maroon/5 text-left">
                  <th className="px-4 py-3 font-medium text-ink/60">Date</th>
                  <th className="px-4 py-3 font-medium text-ink/60">Donor</th>
                  <th className="px-4 py-3 font-medium text-ink/60">Amount</th>
                  <th className="px-4 py-3 font-medium text-ink/60">Method</th>
                  <th className="px-4 py-3 font-medium text-ink/60">Status</th>
                  <th className="px-4 py-3 font-medium text-ink/60">Receipt</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/5">
                {donations.map((d: any) => (
                  <tr key={d._id} className="hover:bg-saffron/5 transition-colors">
                    <td className="px-4 py-3 text-ink/60 tabular-nums whitespace-nowrap">
                      {new Date(d.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{d.donor?.name}</div>
                      <div className="text-xs text-ink/40">{d.donor?.email}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      ₹{(d.amount / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-ink/60 capitalize">{d.paymentMethod?.replace("_", " ")}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-3 text-ink/40 text-xs font-mono">{d.receipt?.receiptNumber || "—"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/donations/${d._id}`} className="text-saffron hover:text-saffron/80 text-xs font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink/40">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-ink/5 text-sm disabled:opacity-30">← Prev</button>
            <button onClick={() => setPage(Math.min(pagination.pages, page + 1))} disabled={page === pagination.pages}
              className="px-3 py-1.5 rounded-lg bg-ink/5 text-sm disabled:opacity-30">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
