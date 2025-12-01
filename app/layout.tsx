import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 使用 Inter 字体替代 Geist，这是 Next.js 14 的标准字体
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Web3 Founder Simulator",
  description: "A Web3 startup simulation game on Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}