"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// ─── Lotus Divider SVG ───────────────────────────────────────
function LotusDivider() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="gold-divider flex-1 max-w-24" />
      <svg className="mx-4 w-10 h-10 text-gold" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M50 15 C45 30, 25 40, 15 55 C25 50, 40 55, 50 70 C60 55, 75 50, 85 55 C75 40, 55 30, 50 15Z" fill="currentColor" opacity="0.3"/>
        <path d="M50 25 C47 35, 35 42, 28 52 C35 48, 44 52, 50 62 C56 52, 65 48, 72 52 C65 42, 53 35, 50 25Z" fill="currentColor" opacity="0.5"/>
        <path d="M50 35 C48 42, 42 46, 38 52 C42 50, 47 52, 50 58 C53 52, 58 50, 62 52 C58 46, 52 42, 50 35Z" fill="currentColor" opacity="0.8"/>
      </svg>
      <div className="gold-divider flex-1 max-w-24" />
    </div>
  );
}

// ─── Hero Section ────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden bg-maroon text-white py-24 md:py-32 lg:py-40">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(201,162,39,0.3) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(244,161,0,0.2) 0%, transparent 50%)`,
        }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-gold mb-6 leading-tight">
          Daanam Digital
        </h1>
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed font-heading">
          Where devotion meets divine grace. Your sacred offerings preserve heritage,
          feed the community, and keep the eternal flame burning.
        </p>
        <Link
          href="/donate"
          className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron/90 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          🙏 Offer Seva Now
        </Link>
      </div>
    </section>
  );
}

// ─── About Section ───────────────────────────────────────────
function AboutSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6 text-maroon">About Daanam</h2>
        <div className="gold-divider max-w-20 mx-auto mb-8" />
        <p className="text-lg leading-relaxed text-ink/75 max-w-3xl mx-auto font-heading italic">
          &ldquo;Daanam&rdquo; represents the sacred duty of selfless giving. This digital platform facilitates 
          seamless, secure, and direct offerings to sustain our temple traditions, feed the needy (Annadanam), 
          and support holy ceremonies with full digital verification.
        </p>
      </div>
    </section>
  );
}

// ─── Donation Purpose Cards ──────────────────────────────────
const purposes = [
  { icon: "🏛️", title: "Temple Maintenance", description: "Preserve and maintain the sacred temple structure for generations to come." },
  { icon: "🙏", title: "Annadanam (Food Seva)", description: "Feed hundreds of devotees daily through our free meal program." },
  { icon: "🪔", title: "Festival Celebrations", description: "Support grand celebrations of traditional festivals that unite our community." },
  { icon: "🤝", title: "Community Programs", description: "Fund educational initiatives, health camps, and cultural programs." },
];

function PurposeSection() {
  return (
    <section className="py-20 px-6 bg-surface-warm">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
          Purpose of Donations
        </h2>
        <p className="text-center text-ink/60 mb-12 max-w-2xl mx-auto">
          Every contribution directly supports these sacred causes
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {purposes.map((p, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 gold-border shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="text-4xl mb-4">{p.icon}</div>
              <h3 className="text-xl font-heading font-semibold mb-2 text-maroon">{p.title}</h3>
              <p className="text-sm text-ink/60 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Impact Counter ──────────────────────────────────────────
function ImpactCounter() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.getPublicStats().then((res) => setStats(res.data)).catch(() => {});
  }, []);

  const formatAmount = (paise: number) => {
    const rupees = paise / 100;
    if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
    if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
    return `₹${rupees.toLocaleString("en-IN")}`;
  };

  return (
    <section className="py-16 px-6 bg-maroon text-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-center text-gold mb-10">
          Transparency & Impact
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl md:text-4xl font-bold text-saffron tabular-nums mb-2">
              {stats ? formatAmount(stats.yearlyDonationsTotal) : <span className="skeleton inline-block w-24 h-10" />}
            </div>
            <div className="text-white/70 text-sm">Raised This Year</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-saffron tabular-nums mb-2">
              {stats ? stats.yearlyDonationsCount.toLocaleString() : <span className="skeleton inline-block w-16 h-10" />}
            </div>
            <div className="text-white/70 text-sm">Donations Received</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-saffron tabular-nums mb-2">
              {stats ? stats.totalUniqueDonors.toLocaleString() : <span className="skeleton inline-block w-16 h-10" />}
            </div>
            <div className="text-white/70 text-sm">Generous Donors</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Contact Section ─────────────────────────────────────────
function ContactSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-12">Visit Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-maroon mb-1">📍 Address</h3>
              <p className="text-ink/70">123 Temple Street, Sacred City, State 560001</p>
            </div>
            <div>
              <h3 className="font-semibold text-maroon mb-1">📞 Phone</h3>
              <p className="text-ink/70">+91 98765 43210</p>
            </div>
            <div>
              <h3 className="font-semibold text-maroon mb-1">✉️ Email</h3>
              <p className="text-ink/70">info@srideviTemple.org</p>
            </div>
            <div>
              <h3 className="font-semibold text-maroon mb-1">🕐 Temple Timings</h3>
              <p className="text-ink/70">6:00 AM – 12:00 PM, 4:00 PM – 9:00 PM</p>
            </div>
          </div>
          <div className="bg-surface-warm rounded-xl p-4 gold-border min-h-64 flex items-center justify-center">
            <p className="text-ink/40 text-sm">Map will load here when configured in admin settings</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-maroon/95 text-white/70 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-heading text-xl text-gold font-semibold mb-4">Daanam Digital</h3>
            <p className="text-sm leading-relaxed">
              Sustaining sacred traditions and facilitating divine offerings with transparent digital verification.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-gold transition-colors">Home</Link></li>
              <li><Link href="/donate" className="hover:text-gold transition-colors">Donate</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Contact Support</h4>
            <ul className="space-y-2 text-sm">
              <li>+91 98765 43210</li>
              <li>support@daanam-digital.org</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} Daanam Trust. All rights reserved.</p>
          <Link href="/admin/login" className="text-white/40 hover:text-gold transition-colors">
            Admin Login
          </Link>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function HomePage() {
  return (
    <main>
      <Hero />
      <LotusDivider />
      <AboutSection />
      <PurposeSection />
      <ImpactCounter />
      <LotusDivider />
      <ContactSection />
      <Footer />
    </main>
  );
}
