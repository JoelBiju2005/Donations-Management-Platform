"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!startDate || !endDate) return;
    setGenerating(true);
    try {
      const blob = await api.generateStatement(startDate, endDate);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `statement-${startDate}-to-${endDate}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-maroon">Report Generator</h1>

      <div className="bg-white rounded-xl p-8 gold-border shadow-sm max-w-2xl">
        <h2 className="font-heading font-semibold text-maroon mb-6">Generate Donation Statement</h2>
        <p className="text-sm text-ink/50 mb-6">
          Generate a professional PDF statement of all successful donations in a date range.
          The report includes donor names, receipt numbers, transaction IDs, and a grand total.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gold/20 focus:border-saffron outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gold/20 focus:border-saffron outline-none" />
          </div>
        </div>

        <button onClick={handleGenerate} disabled={!startDate || !endDate || generating}
          className="px-6 py-3 bg-maroon text-white rounded-lg font-medium hover:bg-maroon/90 disabled:opacity-50 transition-colors">
          {generating ? "Generating..." : "📄 Generate PDF Statement"}
        </button>
      </div>
    </div>
  );
}
