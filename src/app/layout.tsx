import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Nexus3 — Careers",
  description: "Join Nexus3. We build and operate AI-driven businesses across industries where intelligent systems can replace entire workflows.",
  icons: {
    icon: "/nexus3-favicon.png",
  },
  openGraph: {
    title: "Nexus3 — Careers",
    description: "Build the future of AI with us. Small teams. Big problems. Real outcomes.",
    type: "website",
    siteName: "NX3 Recruit",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[var(--bg)] text-[var(--text)] antialiased">
        {children}
      </body>
    </html>
  );
}
