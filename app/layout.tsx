import type { Metadata } from "next";
import { IBM_Plex_Serif, IBM_Plex_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

// Spec §9.2: IBM Plex Serif (titles) / Bricolage Grotesque (UI) / IBM Plex Mono (data).
const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Faraday Academy — Courses on the AI data center economy",
  description:
    "Short, sharp courses on the forces shaping the AI data center economy: power, cooling, capital, grid policy, sovereign AI, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${plexSerif.variable} ${bricolage.variable} ${plexMono.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
