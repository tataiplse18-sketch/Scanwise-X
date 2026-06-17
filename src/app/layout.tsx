import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ScanWise — Scan karo. Samjho. Sahi khao.",
  description:
    "AI-powered food barcode scanner for Indian users. Scan any packaged food product and instantly understand what's inside — in Hindi or English.",
  manifest: "/manifest.json",
  keywords: [
    "ScanWise",
    "food scanner",
    "barcode scanner",
    "India",
    "Hindi",
    "nutrition",
    "PWA",
  ],
  authors: [{ name: "ScanWise Team" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "ScanWise",
  },
  formatDetection: {
    telephone: false,
  },
  applicationName: "ScanWise",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#050505",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="ScanWise" />
      </head>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground`}
      >
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
