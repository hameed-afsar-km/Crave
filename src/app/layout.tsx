import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crave Express - Skip The Queue. Order Smarter.",
  description:
    "Order your favorite meals in advance, choose your pickup time, and collect your food without standing in long queues. Near LIC Metro, Chennai.",
  keywords: [
    "food ordering",
    "queue management",
    "Chennai food",
    "LIC Metro",
    "Shawarma",
    "Burger",
    "online ordering",
  ],
  openGraph: {
    title: "Crave Express - Skip The Queue. Order Smarter.",
    description:
      "Order your favorite meals in advance, choose your pickup time, and collect your food without standing in long queues.",
    type: "website",
    locale: "en_IN",
  },
  manifest: "/manifest.json",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Crave Express",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
    >
      <body className="min-h-screen flex flex-col">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
