"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function BankTransferPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showAccount, setShowAccount] = useState(false);

  useEffect(() => {
    api.getPublicSettings().then((res) => setSettings(res.data)).catch(() => {});
  }, []);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch { /* Fallback handled by visible text */ }
  };

  const bank = settings?.bankDetails;

  return (
    <div className="min-h-screen bg-base">
      <div className="bg-maroon text-white py-8 px-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/donate/payment-method" className="text-gold/70 hover:text-gold text-sm mb-2 inline-block">← Back to Payment Method</Link>
          <h1 className="text-3xl font-heading font-bold text-gold">Bank Transfer Details</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-20 mt-8">
        <div className="bg-white rounded-xl overflow-hidden gold-border shadow-sm">
          {/* Card header */}
          <div className="bg-maroon/5 px-8 py-4 border-b border-gold/10">
            <h2 className="font-heading font-semibold text-maroon">Bank Account Details</h2>
          </div>

          <div className="p-8 space-y-5">
            {/* Account Holder */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-ink/40 uppercase tracking-wide">Account Holder</p>
                <p className="font-semibold mt-1">{bank?.accountHolderName || "..."}</p>
              </div>
            </div>

            {/* Bank Name */}
            <div>
              <p className="text-xs text-ink/40 uppercase tracking-wide">Bank Name</p>
              <p className="font-semibold mt-1">{bank?.bankName || "..."}</p>
            </div>

            {/* Account Number (masked with reveal) */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-ink/40 uppercase tracking-wide">Account Number</p>
                <p className="font-mono font-semibold mt-1 tabular-nums">
                  {showAccount
                    ? (bank?.accountNumber || "...")
                    : (bank?.accountNumber || "●●●●●●●●●●●●")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAccount(!showAccount)}
                  className="px-3 py-1.5 text-xs bg-ink/5 rounded-lg hover:bg-ink/10 transition-colors"
                >
                  {showAccount ? "Hide" : "Reveal"}
                </button>
                <button
                  onClick={() => copyToClipboard(bank?.accountNumber || "", "account")}
                  className="px-3 py-1.5 text-xs bg-saffron/10 text-saffron rounded-lg hover:bg-saffron/20 transition-colors"
                >
                  {copiedField === "account" ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* IFSC Code */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-ink/40 uppercase tracking-wide">IFSC Code</p>
                <p className="font-mono font-semibold mt-1">{bank?.ifscCode || "..."}</p>
              </div>
              <button
                onClick={() => copyToClipboard(bank?.ifscCode || "", "ifsc")}
                className="px-3 py-1.5 text-xs bg-saffron/10 text-saffron rounded-lg hover:bg-saffron/20 transition-colors"
              >
                {copiedField === "ifsc" ? "✓ Copied!" : "Copy"}
              </button>
            </div>

            {/* Branch */}
            <div>
              <p className="text-xs text-ink/40 uppercase tracking-wide">Branch</p>
              <p className="font-semibold mt-1">{bank?.branch || "..."}</p>
            </div>
          </div>

          <div className="px-8 pb-8">
            <div className="gold-divider mb-6" />
            <button
              onClick={() => router.push("/donate/proof")}
              className="w-full py-4 bg-saffron hover:bg-saffron/90 text-white font-semibold rounded-lg text-lg transition-all duration-200"
            >
              Payment Done ✓
            </button>
            <p className="text-xs text-ink/40 mt-4 text-center">
              After completing the transfer, click above to upload your payment screenshot.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
