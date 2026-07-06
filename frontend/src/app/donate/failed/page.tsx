"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function FailedPage() {
  const [reasons, setReasons] = useState<string[]>([]);

  useEffect(() => {
    const donationId = sessionStorage.getItem("donationId");
    if (donationId) {
      api.getDonation(donationId).then((res) => {
        setReasons(res.data.verification?.reasons || ["Verification could not be completed."]);
      }).catch(() => {
        setReasons(["Unable to retrieve verification details."]);
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full text-center">
        <div className="text-6xl mb-6">⚠️</div>

        <h1 className="text-2xl font-heading font-bold text-maroon mb-4">
          Verification Unsuccessful
        </h1>

        <p className="text-ink/60 mb-8">
          We were unable to verify your payment. Please review the details below and try again.
        </p>

        {/* Reasons */}
        <div className="bg-white rounded-xl p-6 gold-border shadow-sm text-left mb-8">
          <h3 className="text-sm font-semibold text-ink/70 mb-3">Reason(s):</h3>
          <ul className="space-y-2">
            {reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink/70">
                <span className="text-error mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tips */}
        <div className="bg-saffron/5 rounded-xl p-6 text-left mb-8">
          <h3 className="text-sm font-semibold text-saffron mb-3">Tips for a successful submission:</h3>
          <ul className="space-y-1.5 text-sm text-ink/60">
            <li>• Take a clear, full-screen screenshot of the payment confirmation</li>
            <li>• Ensure the amount, date, and status are clearly visible</li>
            <li>• Do not crop, edit, or compress the screenshot</li>
            <li>• Submit the screenshot within 48 hours of payment</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/donate/proof"
            className="flex-1 py-3 bg-saffron text-white font-medium rounded-lg hover:bg-saffron/90 transition-colors text-center"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="flex-1 py-3 bg-ink/5 text-ink/70 font-medium rounded-lg hover:bg-ink/10 transition-colors text-center"
          >
            Return Home
          </Link>
        </div>

        <p className="text-xs text-ink/30 mt-6">
          If you continue to have issues, please contact us at info@srideviTemple.org
        </p>
      </div>
    </div>
  );
}
