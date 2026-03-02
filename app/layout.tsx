import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A股市场温度计",
  description: "市场情绪与综合数据看板",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-surface text-zinc-200 antialiased">
        {children}
      </body>
    </html>
  );
}
