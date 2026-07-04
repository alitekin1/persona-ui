import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";

const dana = localFont({
  src: "../../public/fonts/DanaVF.woff2",
  variable: "--font-dana",
  display: "swap",
});

const yekanBakh = localFont({
  src: [
    {
      path: "../../public/fonts/YekanBakhFaNum-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/YekanBakhFaNum-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-yekan",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Persona Mini App",
  description: "Character AI Telegram Mini App",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${dana.variable} ${yekanBakh.variable} dark`}>
      <body className="bg-[#09090b] text-[#f4f4f5] font-yekan antialiased pb-20 selection:bg-brand-lime/30 selection:text-white overscroll-none touch-pan-y">
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}