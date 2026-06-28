import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";

const peyda = localFont({
  src: "../../public/fonts/PeydaWebVF.woff2",
  variable: "--font-peyda",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${peyda.variable} ${yekanBakh.variable} dark`}>
      <body className="bg-[#09090b] text-[#f4f4f5] font-yekan antialiased pb-20">
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}