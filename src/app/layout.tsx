import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/site";
import fs from "fs";
import path from "path";

// "Community anzeigen" aus den Admin-Einstellungen (src/data/settings.json)
function readShowCommunity(): boolean {
  try {
    const file = path.join(process.cwd(), "src", "data", "settings.json");
    return JSON.parse(fs.readFileSync(file, "utf8")).showCommunity ?? false;
  } catch {
    return false;
  }
}

// GoatCounter-Code für die Besucherzählung (Admin → Analytics)
function readAnalyticsCode(): string {
  try {
    const file = path.join(process.cwd(), "src", "data", "settings.json");
    return String(JSON.parse(fs.readFileSync(file, "utf8")).analytics?.goatcounter || "").trim();
  } catch {
    return "";
  }
}

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – Skateboard News, Events & Skateshops | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Skateboard", "Skateboarding", "Skate News", "Skateboard News Deutschland", "Skateboard Magazin",
    "Skate Contest", "Skate Events", "Skateshop", "Skateshops Deutschland", "Skateboard Verein",
    "Skaten lernen", "Skatepark", "Videopart",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "de_DE",
    alternateLocale: ["en_US"],
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} – Skateboard News, Events & Skateshops`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${SITE_NAME} – ${SITE_TAGLINE}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} – Skateboard News, Events & Skateshops`,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
};

import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import LayoutContent from "@/components/LayoutContent";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased flex flex-col"
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <LayoutContent showCommunity={readShowCommunity()} analyticsCode={readAnalyticsCode()}>{children}</LayoutContent>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
