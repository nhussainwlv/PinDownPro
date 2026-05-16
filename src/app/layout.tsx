import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Pin Down Pro — Premium Pinterest Downloader",
    template: "%s | Pin Down Pro",
  },
  description:
    "Download HD Pinterest videos, images, GIFs and carousels instantly. Fast, elegant, secure.",
  keywords: [
    "Pinterest downloader",
    "Pinterest video download",
    "pin.it downloader",
    "Pinterest GIF",
  ],
  openGraph: {
    title: "Pin Down Pro",
    description: "Premium Pinterest media downloader",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pin Down Pro",
  },
};

export const viewport: Viewport = {
  themeColor: "#050508",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
