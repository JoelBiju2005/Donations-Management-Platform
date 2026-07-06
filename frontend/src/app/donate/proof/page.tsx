"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";

export default function ProofPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    if (!/^[a-zA-Z\s.]+$/.test(name.trim())) errs.name = "Name can only contain letters, spaces, and periods";
    if (!/^\+?[1-9]\d{6,14}$/.test(phone.replace(/\s/g, ""))) errs.phone = "Please enter a valid phone number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Please enter a valid email address";
    if (!file) errs.file = "Payment screenshot is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    // Client-side validation
    const allowed = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowed.includes(selectedFile.type)) {
      setErrors((e) => ({ ...e, file: "Only PNG and JPEG images are allowed" }));
      return;
    }
    if (selectedFile.size > 8 * 1024 * 1024) {
      setErrors((e) => ({ ...e, file: "File must be smaller than 8MB" }));
      return;
    }
    setFile(selectedFile);
    setErrors((e) => { const { file: _, ...rest } = e; return rest; });

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }, [handleFileSelect]);

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      const amount = parseInt(sessionStorage.getItem("donationAmount") || "0");
      const method = sessionStorage.getItem("paymentMethod") || "upi";
      const dedication = sessionStorage.getItem("donationDedication") || "";

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("phone", phone.replace(/\s/g, ""));
      formData.append("email", email.trim().toLowerCase());
      formData.append("amount", String(amount));
      formData.append("paymentMethod", method);
      formData.append("currency", "INR");
      if (dedication) formData.append("dedicationNote", dedication);
      formData.append("screenshot", file!);
      formData.append("idempotencyKey", `${Date.now()}-${Math.random().toString(36).slice(2)}`);

      const result = await api.submitDonation(formData);
      sessionStorage.setItem("donationId", result.data.donationId);
      router.push("/donate/verifying");
    } catch (error: any) {
      setErrors({ submit: error.message || "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base">
      <div className="bg-maroon text-white py-8 px-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/donate/payment-method" className="text-gold/70 hover:text-gold text-sm mb-2 inline-block">← Back</Link>
          <h1 className="text-3xl font-heading font-bold text-gold">Upload Payment Proof</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-ink/40">
          <span>1. Amount ✓</span><span>→</span><span>2. Payment ✓</span>
          <span>→</span><span className="text-saffron font-semibold">3. Proof</span>
          <span>→</span><span>4. Done</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-xl p-8 gold-border shadow-sm space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink/70 mb-1.5">Full Name *</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" maxLength={100}
              className="w-full px-4 py-3 rounded-lg border border-gold/20 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none" />
            {errors.name && <p className="text-error text-xs mt-1" role="alert" aria-live="polite">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-ink/70 mb-1.5">Phone Number *</label>
            <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210"
              className="w-full px-4 py-3 rounded-lg border border-gold/20 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none" />
            {errors.phone && <p className="text-error text-xs mt-1" role="alert" aria-live="polite">{errors.phone}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink/70 mb-1.5">Email Address *</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg border border-gold/20 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none" />
            {errors.email && <p className="text-error text-xs mt-1" role="alert" aria-live="polite">{errors.email}</p>}
          </div>

          <div className="gold-divider" />

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">Payment Screenshot *</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                dragOver ? "border-saffron bg-saffron/5" : "border-gold/30 hover:border-saffron/50 hover:bg-saffron/5"
              }`}
            >
              {preview ? (
                <div className="space-y-3">
                  <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-sm" />
                  <p className="text-sm text-ink/50">{file?.name} ({(file!.size / 1024 / 1024).toFixed(1)} MB)</p>
                  <p className="text-xs text-saffron">Click or drag to replace</p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-3">📸</div>
                  <p className="text-ink/60 font-medium">Drag & drop your screenshot here</p>
                  <p className="text-ink/40 text-sm mt-1">or click to browse • PNG/JPEG, max 8MB</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
            {errors.file && <p className="text-error text-xs mt-1" role="alert" aria-live="polite">{errors.file}</p>}
          </div>

          {errors.submit && (
            <div className="bg-error/10 text-error rounded-lg p-4 text-sm" role="alert" aria-live="assertive">{errors.submit}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 bg-saffron hover:bg-saffron/90 disabled:bg-ink/10 disabled:text-ink/30 text-white font-semibold rounded-lg text-lg transition-all duration-200 disabled:cursor-not-allowed"
          >
            {submitting ? "Uploading & Verifying..." : "Submit for Verification"}
          </button>
        </div>
      </div>
    </div>
  );
}
