"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.listAuditLogs({ page: String(page), limit: "50" })
      .then((res) => { setLogs(res.data.logs); setPagination(res.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-maroon">Audit Logs</h1>
      <p className="text-sm text-ink/50">Read-only trail of all system and admin actions.</p>

      <div className="bg-white rounded-xl gold-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(10)].map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-ink/30">No audit logs yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-maroon/5 text-left">
                  <th className="px-4 py-3 font-medium text-ink/60">Timestamp</th>
                  <th className="px-4 py-3 font-medium text-ink/60">Actor</th>
                  <th className="px-4 py-3 font-medium text-ink/60">Action</th>
                  <th className="px-4 py-3 font-medium text-ink/60">Target</th>
                  <th className="px-4 py-3 font-medium text-ink/60">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/5">
                {logs.map((log: any) => (
                  <tr key={log._id} className="hover:bg-saffron/5">
                    <td className="px-4 py-3 text-ink/60 text-xs tabular-nums whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">{log.actorEmail || log.actor}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-ink/5 rounded text-xs font-mono">{log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-ink/60 text-xs">
                      {log.targetType}{log.targetId ? ` #${log.targetId.slice(-6)}` : ""}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink/40 max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata).slice(0, 100) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-ink/40">Page {page} of {pagination.pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg bg-ink/5 text-sm disabled:opacity-30">← Prev</button>
            <button onClick={() => setPage(Math.min(pagination.pages, page + 1))} disabled={page === pagination.pages} className="px-3 py-1.5 rounded-lg bg-ink/5 text-sm disabled:opacity-30">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
