import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const jetBrainsMono = localFont({
  src: [
    {
      path: "../public/JetBrains_Mono/static/JetBrainsMono-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/JetBrains_Mono/static/JetBrainsMono-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/JetBrains_Mono/static/JetBrainsMono-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/JetBrains_Mono/static/JetBrainsMono-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Bar Market",
  description: "Bebidas com preços dinâmicos em tempo real",
  icons: {
    icon: "/logo_bar_market.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${jetBrainsMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
