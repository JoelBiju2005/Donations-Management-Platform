"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function SuccessPage() {
  const [donation, setDonation] = useState<any>(null);
  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    const donationId = sessionStorage.getItem("donationId");
    if (donationId) {
      api.getDonation(donationId).then((res) => setDonation(res.data)).catch(() => {});
    }
    // Trigger success animation
    setTimeout(() => setAnimationDone(true), 800);
  }, []);

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full text-center">
        {/* Success animation - checkmark draw-in */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <svg className="w-24 h-24" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#3D7A4A" strokeWidth="3" opacity="0.2" />
            <circle
              cx="50" cy="50" r="45" fill="none" stroke="#3D7A4A" strokeWidth="3"
              strokeDasharray="283"
              strokeDashoffset={animationDone ? "0" : "283"}
              style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
            />
            <path
              d="M30 52 L45 65 L72 38"
              fill="none" stroke="#3D7A4A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="60"
              strokeDashoffset={animationDone ? "0" : "60"}
              style={{ transition: "stroke-dashoffset 0.4s ease-out 0.4s" }}
            />
          </svg>
        </div>

        <h1 className="text-3xl font-heading font-bold text-maroon mb-3">
          Thank You! 🙏
        </h1>
        <p className="text-ink/60 text-lg mb-8">
          Your donation has been verified and recorded successfully.
        </p>

        {/* Receipt card */}
        {donation && (
          <div className="bg-white rounded-xl p-8 gold-border shadow-sm text-left mb-8 print:shadow-none">
            <div className="text-center mb-6">
              <p className="text-xs text-ink/40 uppercase tracking-wider">Receipt Number</p>
              <p className="text-2xl font-heading font-bold text-maroon mt-1 tabular-nums">
                {donation.receipt?.receiptNumber}
              </p>
            </div>

            <div className="gold-divider mb-6" />

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink/50">Donor</span>
                <span className="font-medium">{donation.donor?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/50">Amount</span>
                <span className="font-semibold text-maroon text-lg tabular-nums">
                  ₹{(donation.amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/50">Payment Method</span>
                <span className="capitalize">{donation.paymentMethod?.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/50">Date</span>
                <span>{new Date(donation.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 no-print mb-4">
          {donation?.receipt?.pdfUrl && (
            <a
              href={donation.receipt.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-success text-white font-medium rounded-lg hover:bg-success/90 transition-colors text-center"
            >
              📄 Download PDF Receipt
            </a>
          )}
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 bg-maroon text-white font-medium rounded-lg hover:bg-maroon/90 transition-colors"
          >
            🖨️ Print View
          </button>
          <Link
            href="/"
            className="flex-1 py-3 bg-saffron text-white font-medium rounded-lg hover:bg-saffron/90 transition-colors text-center"
          >
            Return Home
          </Link>
        </div>

        <p className="text-xs text-ink/30 mt-6 no-print">
          A confirmation email with your PDF receipt has been sent to your email address.
        </p>
      </div>
    </div>
  );
}
