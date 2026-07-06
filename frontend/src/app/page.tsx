"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// ─── Ornamental Gold Divider with Diamond ─────────────────────
function OrnamentalDivider() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="gold-divider flex-1 max-w-32" />
      <div className="mx-5 relative">
        {/* Diamond motif */}
        <svg
          className="w-5 h-5 text-gold"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10 0 L20 10 L10 20 L0 10 Z" />
        </svg>
      </div>
      <div className="gold-divider flex-1 max-w-32" />
    </div>
  );
}

// ─── Lotus SVG Icon ───────────────────────────────────────────
function LotusIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Center petal */}
      <path
        d="M50 10 C47 25, 38 35, 32 48 C38 44, 46 46, 50 55 C54 46, 62 44, 68 48 C62 35, 53 25, 50 10Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Left petals */}
      <path
        d="M35 22 C30 35, 18 42, 12 52 C20 48, 30 50, 38 56 C35 45, 34 32, 35 22Z"
        fill="currentColor"
        opacity="0.5"
      />
      {/* Right petals */}
      <path
        d="M65 22 C70 35, 82 42, 88 52 C80 48, 70 50, 62 56 C65 45, 66 32, 65 22Z"
        fill="currentColor"
        opacity="0.5"
      />
      {/* Base curve */}
      <path
        d="M25 60 Q50 72 75 60"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />
    </svg>
  );
}

// ─── Hero Section ────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden bg-maroon text-white min-h-[70vh] flex items-center">
      {/* Sacred geometry background pattern */}
      <div className="absolute inset-0">
        {/* Radial mandala glows */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 15% 50%, rgba(197,155,39,0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 85% 50%, rgba(197,155,39,0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 20%, rgba(254,206,87,0.06) 0%, transparent 40%)
            `,
          }}
        />
        {/* Subtle geometric grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(197,155,39,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(197,155,39,1) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Top ornamental border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 text-center py-24 md:py-32">
        {/* Sacred chip */}
        <div className="inline-flex items-center gap-2 bg-white/5 border border-gold/20 rounded-full px-5 py-2 mb-8">
          <LotusIcon className="w-4 h-4 text-gold" />
          <span className="text-gold/90 text-sm font-medium tracking-wider uppercase">
            Sacred Digital Offerings
          </span>
        </div>

        <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
          <span className="text-gradient-gold">Daanam</span>
          <br />
          <span className="text-white/90 text-3xl md:text-4xl lg:text-5xl font-normal">
            Digital
          </span>
        </h1>

        <p className="text-lg md:text-xl text-white/65 max-w-2xl mx-auto mb-12 leading-relaxed">
          Where devotion meets divine grace. Your sacred offerings preserve
          heritage, feed the community, and keep the eternal flame burning.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/donate"
            className="inline-flex items-center gap-3 bg-gold hover:bg-gold-bright text-vermilion-deep font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] animate-glow-pulse"
          >
            <span className="text-xl">🙏</span>
            Offer Seva Now
          </Link>
          <a
            href="#about"
            className="inline-flex items-center gap-2 text-gold/70 hover:text-gold border border-gold/20 hover:border-gold/40 px-6 py-3 rounded-lg text-sm font-medium tracking-wider uppercase transition-all duration-200"
          >
            Learn More
          </a>
        </div>
      </div>

      {/* Bottom ornamental border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
    </section>
  );
}

// ─── About Section ───────────────────────────────────────────
function AboutSection() {
  return (
    <section id="about" className="py-24 px-6 mandala-bg">
      <div className="max-w-4xl mx-auto text-center">
        <div className="sacred-chip inline-block mb-6">About Daanam</div>
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-8 text-vermilion">
          The Sacred Duty of Selfless Giving
        </h2>
        <div className="gold-divider max-w-20 mx-auto mb-10" />
        <p className="text-lg leading-relaxed text-ink/70 max-w-3xl mx-auto">
          <span className="font-heading text-xl italic text-vermilion/80">
            &ldquo;Daanam&rdquo;
          </span>{" "}
          embodies the ancient Dharmic principle of selfless giving. This
          digital platform facilitates seamless, secure, and direct offerings
          to sustain our temple traditions, feed the needy through{" "}
          <em>Annadanam</em>, and support holy ceremonies — all with full
          digital verification and instant receipts.
        </p>
      </div>
    </section>
  );
}

// ─── Donation Purpose Cards ──────────────────────────────────
const purposes = [
  {
    icon: "🏛️",
    title: "Temple Maintenance",
    description:
      "Preserve and maintain the sacred temple structure, its murals, and sanctum for generations to come.",
    gradient: "from-vermilion/5 to-transparent",
  },
  {
    icon: "🙏",
    title: "Annadanam Seva",
    description:
      "Feed hundreds of devotees daily through our free meal program — the highest form of charity.",
    gradient: "from-gold/5 to-transparent",
  },
  {
    icon: "🪔",
    title: "Festival Celebrations",
    description:
      "Support grand celebrations of traditional festivals that unite our community in devotion.",
    gradient: "from-vermilion/5 to-transparent",
  },
  {
    icon: "📚",
    title: "Education Programs",
    description:
      "Fund educational initiatives teaching Vedic traditions, cultural arts, and life skills.",
    gradient: "from-gold/5 to-transparent",
  },
];

function PurposeSection() {
  return (
    <section className="py-24 px-6 bg-surface-container">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="sacred-chip inline-block mb-6">Avenues of Seva</div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Purpose of Donations
          </h2>
          <p className="text-ink-muted max-w-2xl mx-auto">
            Every contribution directly supports these sacred causes that
            sustain our temple and community
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {purposes.map((p, i) => (
            <div
              key={i}
              className={`relative bg-white temple-arch p-8 gold-border ambient-glow hover:ambient-glow-strong transition-all duration-300 hover:-translate-y-1 text-center group`}
            >
              {/* Subtle top gradient accent */}
              <div
                className={`absolute inset-x-0 top-0 h-24 rounded-t-[1.5rem] bg-gradient-to-b ${p.gradient} pointer-events-none`}
              />
              <div className="relative">
                <div className="text-4xl mb-5 group-hover:animate-sacred-float">
                  {p.icon}
                </div>
                <h3 className="text-lg font-heading font-semibold mb-3 text-vermilion">
                  {p.title}
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  {p.description}
                </p>
              </div>
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

  const counters = [
    {
      label: "Raised This Year",
      value: stats
        ? formatAmount(stats.yearlyDonationsTotal)
        : null,
    },
    {
      label: "Donations Received",
      value: stats
        ? stats.yearlyDonationsCount.toLocaleString()
        : null,
    },
    {
      label: "Generous Donors",
      value: stats
        ? stats.totalUniqueDonors.toLocaleString()
        : null,
    },
  ];

  return (
    <section className="py-20 px-6 bg-vermilion text-white relative overflow-hidden">
      {/* Subtle background glow */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 50% 50%, rgba(197,155,39,0.08) 0%, transparent 60%)
          `,
        }}
      />
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-gold mb-2">
            Transparency & Impact
          </h2>
          <p className="text-white/50 text-sm">
            Every rupee is accounted for and verified
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {counters.map((c, i) => (
            <div key={i} className="relative">
              <div className="text-3xl md:text-4xl font-bold text-gradient-gold tabular-nums mb-2">
                {c.value || (
                  <span className="skeleton inline-block w-24 h-10" />
                )}
              </div>
              <div className="text-white/60 text-sm tracking-wider uppercase font-medium">
                {c.label}
              </div>
              {/* Vertical divider on desktop */}
              {i < 2 && (
                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-white/10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Contact Section ─────────────────────────────────────────
function ContactSection() {
  return (
    <section className="py-24 px-6 mandala-bg">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <div className="sacred-chip inline-block mb-6">Reach Us</div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold">
            Visit the Temple
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-7">
            {[
              {
                icon: "📍",
                title: "Address",
                detail: "123 Temple Street, Sacred City, State 560001",
              },
              {
                icon: "📞",
                title: "Phone",
                detail: "+91 98765 43210",
              },
              {
                icon: "✉️",
                title: "Email",
                detail: "support@daanam-digital.org",
              },
              {
                icon: "🕐",
                title: "Temple Timings",
                detail: "6:00 AM – 12:00 PM, 4:00 PM – 9:00 PM",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="text-xl mt-0.5">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-vermilion text-sm tracking-wider uppercase mb-1">
                    {item.title}
                  </h3>
                  <p className="text-ink-muted">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-surface-container rounded-xl p-6 gold-border min-h-64 flex items-center justify-center ambient-glow">
            <div className="text-center">
              <LotusIcon className="w-12 h-12 text-gold/30 mx-auto mb-3" />
              <p className="text-ink-muted text-sm">
                Map loads when configured in admin settings
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-vermilion-deep text-white/60 relative">
      {/* Top gold border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div>
            <h3 className="font-heading text-xl text-gold font-bold mb-4">
              Daanam Digital
            </h3>
            <p className="text-sm leading-relaxed text-white/50">
              Sustaining sacred traditions and facilitating divine offerings
              with transparent digital verification. Every contribution is
              accounted for with love and devotion.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white/80 mb-4 text-sm tracking-wider uppercase">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/"
                  className="hover:text-gold transition-colors duration-200"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/donate"
                  className="hover:text-gold transition-colors duration-200"
                >
                  Make a Donation
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white/80 mb-4 text-sm tracking-wider uppercase">
              Contact Support
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-gold/50">📞</span>
                +91 98765 43210
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gold/50">✉️</span>
                support@daanam-digital.org
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30">
          <p>
            © {new Date().getFullYear()} Daanam Trust. All rights reserved.
          </p>
          <Link
            href="/admin/login"
            className="text-white/20 hover:text-gold/50 transition-colors duration-200"
          >
            Admin Portal
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
      <OrnamentalDivider />
      <AboutSection />
      <OrnamentalDivider />
      <PurposeSection />
      <ImpactCounter />
      <OrnamentalDivider />
      <ContactSection />
      <Footer />
    </main>
  );
}
