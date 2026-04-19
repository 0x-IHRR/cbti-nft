import type { Metadata } from "next";
import { WalletProvider } from "@/components/WalletProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CBTI - Crypto Bagholder Type Index",
  description:
    "加密持仓者类型指数 — 一个 Meme 原生的加密人格测试，找到你的持仓者原型。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
