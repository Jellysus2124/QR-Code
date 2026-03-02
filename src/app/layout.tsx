import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR Tracking - Student Support",
  description: "QR-based tracking system for stationery kit distribution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
