"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function UpiPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getPublicSettings().then((res) => setSettings(res.data)).catch(() => {});
  }, []);

  const copyUpiId = async () => {
    if (!settings?.upiId) return;
    try {
      await navigator.clipboard.writeText(settings.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* Fallback handled by visible ID */ }
  };

  return (
    <div className="min-h-screen bg-base">
      <div className="bg-maroon text-white py-8 px-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/donate/payment-method" className="text-gold/70 hover:text-gold text-sm mb-2 inline-block">← Back to Payment Method</Link>
          <h1 className="text-3xl font-heading font-bold text-gold">Pay via UPI</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-20 mt-8">
        <div className="bg-white rounded-xl p-8 gold-border shadow-sm text-center">
          {/* QR Code */}
          <div className="bg-surface-warm rounded-lg p-8 mb-6 inline-block">
            {settings?.upiQrCodeUrl ? (
              <img src={settings.upiQrCodeUrl} alt="UPI QR Code" className="w-64 h-64 object-contain" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-ink/30 text-sm">
                <div className="text-center">
                  <div className="text-6xl mb-4">📱</div>
                  <p>QR Code will appear here</p>
                  <p className="text-xs mt-1">Configure in Admin Settings</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-ink/60 text-sm mb-4">Scan the QR code with any UPI app</p>

          {/* UPI ID with copy */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <code className="bg-surface-warm px-4 py-2 rounded-lg text-maroon font-mono font-semibold">
              {settings?.upiId || "loading..."}
            </code>
            <button
              onClick={copyUpiId}
              className="px-4 py-2 bg-saffron/10 text-saffron rounded-lg text-sm font-medium hover:bg-saffron/20 transition-colors"
              aria-label="Copy UPI ID"
            >
              {copied ? "✓ Copied!" : "Copy"}
            </button>
          </div>

          <div className="gold-divider my-8" />

          <button
            onClick={() => router.push("/donate/proof")}
            className="w-full py-4 bg-saffron hover:bg-saffron/90 text-white font-semibold rounded-lg text-lg transition-all duration-200"
          >
            Payment Done ✓
          </button>

          <p className="text-xs text-ink/40 mt-4">
            After completing the payment, click above to upload your payment screenshot for verification.
          </p>
        </div>
      </div>
    </div>
  );
}
