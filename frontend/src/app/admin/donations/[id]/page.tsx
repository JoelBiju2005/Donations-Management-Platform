"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function DonationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [donation, setDonation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [showAction, setShowAction] = useState<string | null>(null);

  useEffect(() => {
    api.getDonation(id as string).then((res) => setDonation(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (status: string) => {
    if (!reason.trim()) return;
    setActionLoading(true);
    try {
      await api.updateDonationStatus(id as string, status, reason);
      // Refresh data
      const res = await api.getDonation(id as string);
      setDonation(res.data);
      setShowAction(null);
      setReason("");
    } catch {}
    setActionLoading(false);
  };

  if (loading) return <div className="space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>;
  if (!donation) return <p className="text-ink/50">Donation not found.</p>;

  const d = donation;
  const riskScore = d.fraudAnalysis?.riskScore || 0;
  const ocrConfidence = d.ocr?.confidence || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-ink/40 hover:text-ink text-sm">← Back</button>
        <h1 className="text-2xl font-heading font-bold text-maroon">Payment Review</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Screenshot viewer */}
        <div className="bg-white rounded-xl gold-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gold/10">
            <h2 className="font-heading font-semibold text-maroon">Payment Screenshot</h2>
          </div>
          <div className="p-6">
            {d.screenshotUrl ? (
              <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${d.screenshotUrl}`}
                alt="Payment screenshot" className="w-full rounded-lg shadow-sm cursor-zoom-in" />
            ) : (
              <div className="h-64 bg-ink/5 rounded-lg flex items-center justify-center text-ink/30">No screenshot</div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          {/* Donor info */}
          <div className="bg-white rounded-xl p-6 gold-border shadow-sm">
            <h3 className="font-semibold text-maroon mb-3">Donor Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink/50">Name</span><span className="font-medium">{d.donor?.name}</span></div>
              <div className="flex justify-between"><span className="text-ink/50">Email</span><span>{d.donor?.email}</span></div>
              <div className="flex justify-between"><span className="text-ink/50">Phone</span><span>{d.donor?.phone}</span></div>
              <div className="flex justify-between"><span className="text-ink/50">Amount</span><span className="font-bold text-maroon text-lg tabular-nums">₹{(d.amount / 100).toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between"><span className="text-ink/50">Method</span><span className="capitalize">{d.paymentMethod?.replace("_", " ")}</span></div>
              {d.dedicationNote && <div><span className="text-ink/50">Dedication:</span> <span className="italic">&ldquo;{d.dedicationNote}&rdquo;</span></div>}
            </div>
          </div>

          {/* Confidence gauges */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 gold-border shadow-sm text-center">
              <p className="text-xs text-ink/50 mb-2">OCR Confidence</p>
              <div className="relative w-16 h-16 mx-auto">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#f0ebe0" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none"
                    stroke={ocrConfidence >= 60 ? "#3D7A4A" : "#A63D40"}
                    strokeWidth="3" strokeDasharray={`${ocrConfidence * 0.94} 94`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">{Math.round(ocrConfidence)}%</span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 gold-border shadow-sm text-center">
              <p className="text-xs text-ink/50 mb-2">Fraud Risk</p>
              <div className="relative w-16 h-16 mx-auto">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#f0ebe0" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none"
                    stroke={riskScore < 30 ? "#3D7A4A" : riskScore < 70 ? "#B8860B" : "#A63D40"}
                    strokeWidth="3" strokeDasharray={`${riskScore * 0.94} 94`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">{riskScore}%</span>
              </div>
            </div>
          </div>

          {/* Extracted fields */}
          <div className="bg-white rounded-xl p-6 gold-border shadow-sm">
            <h3 className="font-semibold text-maroon mb-3">Extracted Fields</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(d.extractedFields || {}).map(([key, value]: [string, any]) => (
                value && <div key={key} className="flex justify-between">
                  <span className="text-ink/50 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  <span className="font-mono text-xs">{key === "amount" ? `₹${(value / 100).toFixed(2)}` : String(value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verification reasons */}
          {d.verification?.reasons?.length > 0 && (
            <div className="bg-white rounded-xl p-6 gold-border shadow-sm">
              <h3 className="font-semibold text-maroon mb-3">Verification Notes</h3>
              <ul className="space-y-1 text-sm text-ink/60">
                {d.verification.reasons.map((r: string, i: number) => <li key={i}>• {r}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Admin actions */}
      {["pending_admin_review", "pending_verification"].includes(d.status) && (
        <div className="bg-white rounded-xl p-6 gold-border shadow-sm">
          <h3 className="font-semibold text-maroon mb-4">Admin Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowAction("successful")} className="px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90">✓ Approve</button>
            <button onClick={() => setShowAction("rejected")} className="px-4 py-2 bg-error text-white rounded-lg text-sm font-medium hover:bg-error/90">✕ Reject</button>
            <button onClick={() => setShowAction("marked_unsuccessful")} className="px-4 py-2 bg-ink/20 text-ink rounded-lg text-sm font-medium hover:bg-ink/30">Mark Unsuccessful</button>
          </div>

          {showAction && (
            <div className="mt-4 p-4 bg-ink/5 rounded-lg">
              <label className="block text-sm font-medium mb-2">Reason/Note (required)</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gold/20 text-sm mb-3" rows={3} placeholder="Enter reason..." />
              <div className="flex gap-2">
                <button onClick={() => handleAction(showAction)} disabled={actionLoading || !reason.trim()}
                  className="px-4 py-2 bg-maroon text-white rounded-lg text-sm disabled:opacity-50">
                  {actionLoading ? "Processing..." : "Confirm"}
                </button>
                <button onClick={() => { setShowAction(null); setReason(""); }}
                  className="px-4 py-2 bg-ink/5 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
