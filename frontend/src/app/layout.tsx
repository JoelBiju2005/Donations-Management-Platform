import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Daanam — Temple Donations Management Platform",
  description:
    "Support temple maintenance, annadanam, festivals, and community programs. Secure, verified payments with instant digital receipts on Daanam.",
  keywords: ["daanam", "temple", "donation", "seva", "annadanam", "upi", "online donation", "digital offering"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-base text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
