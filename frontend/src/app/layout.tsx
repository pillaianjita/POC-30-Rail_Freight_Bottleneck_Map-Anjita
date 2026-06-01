import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Rail Freight Bottleneck Map",
  description: "Real Rails Intelligence Library - POC 30",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} bg-obsidian font-sans tracking-tight text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
