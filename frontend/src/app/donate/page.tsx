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

// Step indicator with sacred styling
function StepIndicator({ current }: { current: number }) {
  const steps = ["Amount", "Payment", "Proof", "Done"];
  return (
    <div className="flex items-center justify-center gap-1 text-sm py-6">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-1">
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wider uppercase transition-colors ${
              i === current
                ? "bg-gold/15 text-gold border border-gold/30"
                : i < current
                ? "text-gold/60"
                : "text-ink/25"
            }`}
          >
            {i < current ? "✓" : `${i + 1}.`} {step}
          </span>
          {i < steps.length - 1 && (
            <span className="text-ink/15 mx-1">—</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function DonatePage() {
  const router = useRouter();
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [dedication, setDedication] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const selectedAmount = isCustom
    ? Math.round(parseFloat(customAmount || "0") * 100)
    : amount;

  const handleContinue = () => {
    if (!selectedAmount || selectedAmount < 100) return;
    sessionStorage.setItem("donationAmount", String(selectedAmount));
    sessionStorage.setItem("donationDedication", dedication);
    router.push("/donate/payment-method");
  };

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <div className="bg-vermilion text-white py-10 px-6 relative overflow-hidden">
        {/* Subtle gold glow */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 100%, rgba(197,155,39,0.1) 0%, transparent 60%)",
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        <div className="relative max-w-2xl mx-auto">
          <Link
            href="/"
            className="text-gold/50 hover:text-gold text-sm mb-3 inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gold">
            Make a Donation
          </h1>
          <p className="text-white/55 mt-2 text-sm">
            Every contribution, no matter the size, makes a difference in sustaining our sacred traditions.
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="max-w-2xl mx-auto px-6">
        <StepIndicator current={0} />
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 pb-20">
        <div className="bg-white temple-arch p-8 md:p-10 gold-border ambient-glow relative overflow-hidden">
          {/* Subtle mandala watermark */}
          <div
            className="absolute top-0 right-0 w-40 h-40 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, var(--color-gold) 0%, transparent 70%)",
            }}
          />

          <h2 className="text-xl font-heading font-semibold text-vermilion mb-8 relative">
            Select Amount
          </h2>

          {/* Preset chips */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {presets.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setAmount(p.value);
                  setIsCustom(false);
                }}
                className={`py-3.5 px-4 rounded-lg font-semibold text-lg transition-all duration-200 border-2 ${
                  !isCustom && amount === p.value
                    ? "bg-gold text-vermilion-deep border-gold shadow-md scale-[1.02]"
                    : "bg-white text-vermilion border-outline-variant/50 hover:border-gold/60 hover:bg-gold/5"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <button
            onClick={() => setIsCustom(true)}
            className={`w-full py-3.5 px-4 rounded-lg font-medium transition-all duration-200 border-2 mb-5 ${
              isCustom
                ? "bg-gold/10 text-gold border-gold"
                : "bg-white text-ink-muted/60 border-outline-variant/30 hover:border-gold/50"
            }`}
          >
            Custom Amount
          </button>

          {isCustom && (
            <div className="mb-8">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-vermilion font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 text-2xl font-semibold rounded-lg border-2 border-outline-variant/50 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none tabular-nums transition-colors"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="gold-divider my-8" />

          {/* Dedication note */}
          <div className="mb-8">
            <label
              htmlFor="dedication"
              className="block text-sm font-medium text-ink-muted mb-2 tracking-wide"
            >
              Dedication Note{" "}
              <span className="text-ink/25">(optional)</span>
            </label>
            <textarea
              id="dedication"
              value={dedication}
              onChange={(e) => setDedication(e.target.value)}
              placeholder="In memory of... / On behalf of..."
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-outline-variant/30 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none resize-none text-sm transition-colors"
            />
            <p className="text-xs text-ink/25 mt-1.5">
              {dedication.length}/500 characters
            </p>
          </div>

          {/* Continue button */}
          <button
            onClick={handleContinue}
            disabled={!selectedAmount || selectedAmount < 100}
            className="w-full py-4 bg-vermilion hover:bg-vermilion-light disabled:bg-outline-variant/30 disabled:text-ink/25 text-white font-semibold rounded-lg text-lg transition-all duration-300 hover:shadow-md disabled:cursor-not-allowed"
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
