import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A股估值温度计",
  description: "每日定时长线估值温度计 · 历史分位与股债利差(ERP)",
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
