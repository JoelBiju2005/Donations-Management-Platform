"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const presets = [
  { label: "₹101", value: 10100 },
  { label: "₹501", value: 50100 },
  { label: "₹1,001", value: 100100 },
  { label: "₹2,100", value: 210000 },
];

export default function DonatePage() {
  const router = useRouter();
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [dedication, setDedication] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const selectedAmount = isCustom ? Math.round(parseFloat(customAmount || "0") * 100) : amount;

  const handleContinue = () => {
    if (!selectedAmount || selectedAmount < 100) return;
    // Store in sessionStorage for the next step
    sessionStorage.setItem("donationAmount", String(selectedAmount));
    sessionStorage.setItem("donationDedication", dedication);
    router.push("/donate/payment-method");
  };

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <div className="bg-maroon text-white py-8 px-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="text-gold/70 hover:text-gold text-sm mb-2 inline-block">← Back to Home</Link>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gold">Make a Donation</h1>
          <p className="text-white/70 mt-2">Every contribution, no matter the size, makes a difference.</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="max-w-2xl mx-auto px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-ink/40">
          <span className="text-saffron font-semibold">1. Amount</span>
          <span>→</span><span>2. Payment</span>
          <span>→</span><span>3. Proof</span>
          <span>→</span><span>4. Done</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-xl p-8 gold-border shadow-sm">
          <h2 className="text-xl font-heading font-semibold text-maroon mb-6">Select Amount</h2>

          {/* Preset chips */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {presets.map((p) => (
              <button
                key={p.value}
                onClick={() => { setAmount(p.value); setIsCustom(false); }}
                className={`py-3 px-4 rounded-lg font-semibold text-lg transition-all duration-150 border-2 ${
                  !isCustom && amount === p.value
                    ? "bg-saffron text-white border-saffron shadow-md"
                    : "bg-white text-maroon border-gold/30 hover:border-saffron/50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <button
            onClick={() => setIsCustom(true)}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-150 border-2 mb-4 ${
              isCustom
                ? "bg-saffron/10 text-saffron border-saffron"
                : "bg-white text-ink/50 border-gold/20 hover:border-saffron/40"
            }`}
          >
            Custom Amount
          </button>

          {isCustom && (
            <div className="mb-6">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-maroon font-bold">₹</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 text-2xl font-semibold rounded-lg border-2 border-gold/30 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none tabular-nums"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="gold-divider my-6" />

          {/* Dedication note */}
          <div className="mb-8">
            <label htmlFor="dedication" className="block text-sm font-medium text-ink/60 mb-2">
              Dedication Note <span className="text-ink/30">(optional)</span>
            </label>
            <textarea
              id="dedication"
              value={dedication}
              onChange={(e) => setDedication(e.target.value)}
              placeholder="In memory of... / On behalf of..."
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gold/20 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none resize-none text-sm"
            />
            <p className="text-xs text-ink/30 mt-1">{dedication.length}/500 characters</p>
          </div>

          {/* Continue button */}
          <button
            onClick={handleContinue}
            disabled={!selectedAmount || selectedAmount < 100}
            className="w-full py-4 bg-saffron hover:bg-saffron/90 disabled:bg-ink/10 disabled:text-ink/30 text-white font-semibold rounded-lg text-lg transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed"
          >
            {selectedAmount && selectedAmount >= 100
              ? `Continue with ₹${(selectedAmount / 100).toLocaleString("en-IN")}`
              : "Select an amount to continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
