"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function VerifyingPage() {
  const router = useRouter();
  const [status, setStatus] = useState("pending_verification");
  const [dots, setDots] = useState("");

  // Poll for verification status
  useEffect(() => {
    const donationId = sessionStorage.getItem("donationId");
    if (!donationId) { router.push("/donate"); return; }

    const poll = setInterval(async () => {
      try {
        const res = await api.getDonationStatus(donationId);
        setStatus(res.data.status);

        if (res.data.status === "successful") {
          clearInterval(poll);
          router.push("/donate/success");
        } else if (res.data.status === "rejected") {
          clearInterval(poll);
          router.push("/donate/failed");
        } else if (res.data.status === "pending_admin_review") {
          clearInterval(poll);
          // Stay on this page with a "under review" message
        }
      } catch { /* Keep polling */ }
    }, 3000);

    return () => clearInterval(poll);
  }, [router]);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (status === "pending_admin_review") {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-6">🔍</div>
          <h1 className="text-2xl font-heading font-bold text-maroon mb-4">Payment Under Review</h1>
          <p className="text-ink/60 leading-relaxed mb-6">
            Your payment has been received and is currently being reviewed by our team.
            You will receive an email notification once the review is complete.
          </p>
          <p className="text-sm text-ink/40">Expected turnaround: within 24 hours</p>
          <div className="mt-8">
            <a href="/" className="text-saffron hover:text-saffron/80 font-medium">Return to Home</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        {/* Animated verification indicator */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-gold/20" />
          <div className="absolute inset-0 rounded-full border-4 border-saffron border-t-transparent animate-spin" />
          <div className="absolute inset-3 rounded-full bg-saffron/10 flex items-center justify-center">
            <span className="text-2xl">🔍</span>
          </div>
        </div>

        <h1 className="text-2xl font-heading font-bold text-maroon mb-4">
          Verifying Your Payment{dots}
        </h1>

        {/* Skeleton progress stages */}
        <div className="space-y-3 text-left max-w-xs mx-auto mb-8">
          {["Reading payment screenshot", "Extracting transaction details", "Verifying amount", "Running security checks", "Confirming payment"].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                i < 2 ? "bg-success/20 text-success" : "bg-ink/5 text-ink/20"
              }`}>
                {i < 2 ? "✓" : "○"}
              </div>
              <span className={`text-sm ${i < 2 ? "text-ink/70" : "text-ink/30"}`}>{step}</span>
            </div>
          ))}
        </div>

        <p className="text-ink/40 text-sm">This usually takes 10-30 seconds. Please don&apos;t close this page.</p>
      </div>
    </div>
  );
}
