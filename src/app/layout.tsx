import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR Tracking - Ho tro hoc sinh",
  description: "He thong theo doi bo dung cu hoc tap bang QR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
