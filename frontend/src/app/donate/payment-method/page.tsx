"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PaymentMethodPage() {
  const router = useRouter();

  const handleSelect = (method: string) => {
    sessionStorage.setItem("paymentMethod", method);
    router.push(method === "upi" ? "/donate/upi" : "/donate/bank-transfer");
  };

  return (
    <div className="min-h-screen bg-base">
      <div className="bg-maroon text-white py-8 px-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/donate" className="text-gold/70 hover:text-gold text-sm mb-2 inline-block">← Back to Amount</Link>
          <h1 className="text-3xl font-heading font-bold text-gold">Choose Payment Method</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-ink/40">
          <span className="text-ink/50">1. Amount ✓</span>
          <span>→</span><span className="text-saffron font-semibold">2. Payment</span>
          <span>→</span><span>3. Proof</span>
          <span>→</span><span>4. Done</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* UPI Card */}
          <button
            onClick={() => handleSelect("upi")}
            className="bg-white rounded-xl p-8 gold-border shadow-sm hover:shadow-lg hover:border-saffron/50 transition-all duration-200 text-left group"
          >
            <div className="text-4xl mb-4">📱</div>
            <h2 className="text-xl font-heading font-semibold text-maroon group-hover:text-saffron transition-colors">
              Pay via UPI
            </h2>
            <p className="text-sm text-ink/50 mt-2 leading-relaxed">
              Scan QR code or use UPI ID with any UPI app — GPay, PhonePe, Paytm, BHIM
            </p>
            <div className="mt-4 text-saffron text-sm font-medium">
              Select →
            </div>
          </button>

          {/* Bank Transfer Card */}
          <button
            onClick={() => handleSelect("bank_transfer")}
            className="bg-white rounded-xl p-8 gold-border shadow-sm hover:shadow-lg hover:border-saffron/50 transition-all duration-200 text-left group"
          >
            <div className="text-4xl mb-4">🏦</div>
            <h2 className="text-xl font-heading font-semibold text-maroon group-hover:text-saffron transition-colors">
              Direct Bank Transfer
            </h2>
            <p className="text-sm text-ink/50 mt-2 leading-relaxed">
              Transfer directly via NEFT, RTGS, or IMPS using our bank account details
            </p>
            <div className="mt-4 text-saffron text-sm font-medium">
              Select →
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
