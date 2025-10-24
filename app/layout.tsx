import type { Metadata } from "next";
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
  title: "Depths Components - React components for analytics dashboards",
  description:
    "ShadCN inspired, React + Tailwind components as a part of Depths's open core to build custom analytics stack.",
  applicationName: "Depths",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  keywords: [
    "OpenTelemetry",
    "OTLP",
    "observability",
    "traces",
    "logs",
    "metrics",
    "Delta Lake",
    "S3",
    "lakehouse",
    "telemetry",
  ],
  category: "Observability",
  authors: [{ name: "Depths AI" }],
  creator: "Depths AI",
  publisher: "Depths AI",
  alternates: {
    canonical: "/", // canonical root (per-page canonicals can override)
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Depths",
    title: "Depths — Open, S3-native observability",
    description:
      "Store more. Know sooner. OTel-native universal observability on your S3.",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png", // stored under /public
        width: 1200,
        height: 630,
        alt: "Depths — OTel-native S3-priced observability",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Depths — Open, S3-native observability",
    description:
      "OTel-native ingest + Delta on S3. Simple, fast, and priced to keep.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    // add more if you have them in /public:
    // shortcut: "/favicon-16x16.png",
    // apple: "/apple-touch-icon.png",
  },
  // If you add a web app manifest later:
  // manifest: "/site.webmanifest",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
