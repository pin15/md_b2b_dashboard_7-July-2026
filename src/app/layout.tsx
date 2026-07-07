import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

// Inter — the B2C default sans. Exposed as --font-inter and wired to Tailwind's
// font-sans via @theme inline in globals.css so it cascades to every surface.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MoodScale — Employer Dashboard",
  description:
    "Employer wellbeing insights — k≥5 aggregates and participation status only.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
