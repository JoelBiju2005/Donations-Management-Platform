import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
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
    "Support temple maintenance, annadanam, festivals, and community programs. Secure, verified digital offerings with instant receipts on Daanam Digital.",
  keywords: [
    "daanam",
    "temple",
    "donation",
    "seva",
    "annadanam",
    "upi",
    "online donation",
    "digital offering",
    "daanam digital",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-base text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
