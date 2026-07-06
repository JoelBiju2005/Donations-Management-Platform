"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  // Credentials State
  const [credEmail, setCredEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [credError, setCredError] = useState("");
  const [credSuccess, setCredSuccess] = useState("");
  const [credSaving, setCredSaving] = useState(false);

  useEffect(() => {
    api.getSettings().then((res) => {
      setSettings(res.data);
      // Initialize credential email with current admin email
      api.getMe().then((meRes) => setCredEmail(meRes.data.email)).catch(() => {});
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("qrCode", file);

    setUploadingQr(true);
    try {
      const res = await api.uploadQrCode(formData);
      updateField("upiQrCodeUrl", res.data.upiQrCodeUrl);
    } catch (err: any) {
      alert(err.message || "Failed to upload QR Code");
    } finally {
      setUploadingQr(false);
    }
  };

  const handleCredentialUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredError("");
    setCredSuccess("");
    setCredSaving(true);

    try {
      const payload: any = {
        email: credEmail,
        oldPassword,
      };
      if (newPassword) {
        payload.newPassword = newPassword;
      }

      const res = await api.changeCredentials(payload);
      setCredSuccess(res.message || "Credentials updated successfully. Logging out...");
      
      // Clear credentials and redirect to login after a brief delay
      setTimeout(() => {
        localStorage.removeItem("accessToken");
        api.setAccessToken(null);
        router.push("/admin/login");
      }, 2500);
    } catch (err: any) {
      setCredError(err.message || "Failed to update credentials.");
    } finally {
      setCredSaving(false);
    }
  };

  const updateField = (path: string, value: any) => {
    const keys = path.split(".");
    const updated = { ...settings };
    let current = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setSettings(updated);
  };

  if (!settings) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 max-w-3xl pb-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-maroon">Temple Settings</h1>
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2 bg-saffron text-white rounded-lg font-medium hover:bg-saffron/90 disabled:opacity-50 transition-colors">
          {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Temple Info */}
      <section className="bg-white rounded-xl p-6 gold-border shadow-sm space-y-4">
        <h2 className="font-heading font-semibold text-maroon">Temple Information</h2>
        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1">Temple Name</label>
          <input type="text" value={settings.templeName || ""} onChange={(e) => updateField("templeName", e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gold/20 focus:border-saffron outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1">About Text</label>
          <textarea value={settings.aboutText || ""} onChange={(e) => updateField("aboutText", e.target.value)} rows={4}
            className="w-full px-4 py-2.5 rounded-lg border border-gold/20 focus:border-saffron outline-none resize-none" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">Phone</label>
            <input type="text" value={settings.phone || ""} onChange={(e) => updateField("phone", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gold/20 focus:border-saffron outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">Email</label>
            <input type="email" value={settings.email || ""} onChange={(e) => updateField("email", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gold/20 focus:border-saffron outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1">Address</label>
          <input type="text" value={settings.address || ""} onChange={(e) => updateField("address", e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gold/20 focus:border-saffron outline-none" />
        </div>
      </section>

      {/* Bank Details */}
      <section className="bg-white rounded-xl p-6 gold-border shadow-sm space-y-4">
        <h2 className="font-heading font-semibold text-maroon">Bank Details</h2>
        {["accountHolderName", "bankName", "accountNumber", "ifscCode", "branch"].map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-ink/70 mb-1 capitalize">{field.replace(/([A-Z])/g, " $1")}</label>
            <input type="text" value={settings.bankDetails?.[field] || ""} onChange={(e) => updateField(`bankDetails.${field}`, e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gold/20 focus:border-saffron outline-none" />
          </div>
        ))}
      </section>

      {/* UPI & QR Code */}
      <section className="bg-white rounded-xl p-6 gold-border shadow-sm space-y-4">
        <h2 className="font-heading font-semibold text-maroon">UPI & QR Code Settings</h2>
        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1">UPI ID</label>
          <input type="text" value={settings.upiId || ""} onChange={(e) => updateField("upiId", e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gold/20 focus:border-saffron outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink/70 mb-2">Donation QR Code</label>
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-surface-warm p-4 rounded-xl gold-border">
            {settings.upiQrCodeUrl ? (
              <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${settings.upiQrCodeUrl}`} alt="UPI QR Code" className="w-36 h-36 object-contain rounded-lg border border-gold/10 bg-white" />
            ) : (
              <div className="w-36 h-36 border border-dashed border-gold/30 rounded-lg flex items-center justify-center text-xs text-ink/30 bg-white">No QR Image</div>
            )}
            <div className="space-y-2 text-center sm:text-left">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingQr}
                className="px-4 py-2 bg-maroon text-white rounded-lg text-sm hover:bg-maroon/90 disabled:opacity-50 transition-colors"
              >
                {uploadingQr ? "Uploading..." : "Upload New QR Image"}
              </button>
              <p className="text-xs text-ink/40">Supported formats: PNG, JPEG. Max size: 8MB.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg"
                className="hidden"
                onChange={handleQrUpload}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Verification Config */}
      <section className="bg-white rounded-xl p-6 gold-border shadow-sm space-y-4">
        <h2 className="font-heading font-semibold text-maroon">Verification Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">OCR Confidence Threshold (%)</label>
            <input type="number" min="0" max="100" value={settings.verificationConfig?.ocrConfidenceThreshold || 60}
              onChange={(e) => updateField("verificationConfig.ocrConfidenceThreshold", Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-lg border border-gold/20 focus:border-saffron outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">Fraud Risk Threshold (%)</label>
            <input type="number" min="0" max="100" value={settings.verificationConfig?.fraudRiskThreshold || 70}
              onChange={(e) => updateField("verificationConfig.fraudRiskThreshold", Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-lg border border-gold/20 focus:border-saffron outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">Max Screenshot Age (hours)</label>
            <input type="number" value={settings.verificationConfig?.timestampMaxAgeHours || 48}
              onChange={(e) => updateField("verificationConfig.timestampMaxAgeHours", Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-lg border border-gold/20 focus:border-saffron outline-none" />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input type="checkbox" id="autoApprove" checked={settings.verificationConfig?.autoApproveEnabled ?? true}
              onChange={(e) => updateField("verificationConfig.autoApproveEnabled", e.target.checked)}
              className="w-4 h-4 accent-saffron" />
            <label htmlFor="autoApprove" className="text-sm font-medium text-ink/70">Enable Auto-Approval</label>
          </div>
        </div>
      </section>

      {/* Admin Credentials Rotation */}
      <section className="bg-white rounded-xl p-6 gold-border shadow-sm space-y-4">
        <h2 className="font-heading font-semibold text-maroon">Change Admin Credentials</h2>
        <p className="text-xs text-ink/50">Modify the administrator email and login password. Requires verifying your old password.</p>
        
        <form onSubmit={handleCredentialUpdate} className="space-y-4">
          {credError && <div className="bg-error/10 text-error p-3 rounded-lg text-sm">{credError}</div>}
          {credSuccess && <div className="bg-success/10 text-success p-3 rounded-lg text-sm">{credSuccess}</div>}
          
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">Admin Email Address</label>
            <input
              type="email"
              value={credEmail}
              onChange={(e) => setCredEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gold/20 focus:border-saffron outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">Old Password *</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                placeholder="Required for any changes"
                className="w-full px-4 py-2.5 rounded-lg border border-gold/20 focus:border-saffron outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">New Password (optional)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                minLength={8}
                className="w-full px-4 py-2.5 rounded-lg border border-gold/20 focus:border-saffron outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={credSaving || !oldPassword}
            className="px-6 py-2 bg-maroon text-white rounded-lg font-medium hover:bg-maroon/90 disabled:opacity-50 transition-colors"
          >
            {credSaving ? "Updating Credentials..." : "Update Credentials"}
          </button>
        </form>
      </section>
    </div>
  );
}
