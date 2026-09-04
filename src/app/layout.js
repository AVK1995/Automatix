import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieConsentBanner from "@/components/ui/CookieConsentBanner";
import GlobalTooltipProvider from "@/components/ui/GlobalTooltipProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "Automatix — The Modern Visual Automation & Workflow Engine",
    template: "%s | Automatix"
  },
  description: "Enterprise-grade visual workflow builder. Seamlessly connect Meta WhatsApp Cloud API, Instagram DM, Google Sheets, Stripe, Meta CAPI, and custom Webhooks with AI mediation.",
  keywords: [
    "Workflow automation",
    "WhatsApp Cloud API automation",
    "Instagram DM automation",
    "Visual workflow builder",
    "Zapier alternative",
    "Meta CAPI automation",
    "Google Sheets webhook sync",
    "Enterprise automation engine"
  ],
  authors: [{ name: "Automatix Platform" }],
  creator: "Automatix",
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://automatix.io'),
  openGraph: {
    title: "Automatix — Modern Visual Workflow & Marketing Automation",
    description: "Connect your webhooks, WhatsApp templates, Instagram DM bots, and databases on a single unified canvas. Built for modern high-growth teams.",
    url: "https://automatix.io",
    siteName: "Automatix",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Automatix — Visual Automation Engine",
    description: "Visual canvas for WhatsApp, Instagram, Google Sheets, Stripe, and Webhook automations."
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GlobalTooltipProvider>
          {children}
        </GlobalTooltipProvider>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
