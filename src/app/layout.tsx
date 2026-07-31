import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/components/CartProvider";
import JsonLd from "@/components/JsonLd";
import { getSettings } from "@/lib/settings";
import { media } from "@/lib/media";
import { organisationSchema, SITE_URL } from "@/lib/seo";

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sweet Share — Plant-based desserts, made to be shared",
    template: "%s · Sweet Share",
  },
  description:
    "Vegan, diabetes-friendly desserts baked without dairy, eggs or refined sugar. Order ahead for gatherings, celebrations and ordinary Tuesdays.",
  keywords: [
    "vegan desserts",
    "diabetes friendly desserts",
    "dairy free bakery",
    "egg free desserts",
    "no refined sugar",
    "plant based bakery",
    "Sweet Share",
  ],
  openGraph: {
    type: "website",
    siteName: "Sweet Share",
    title: "Sweet Share — Plant-based desserts, made to be shared",
    description:
      "Vegan, diabetes-friendly desserts baked without dairy, eggs or refined sugar.",
    images: [{ url: media("hero"), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sweet Share — Plant-based desserts, made to be shared",
    description:
      "Vegan, diabetes-friendly desserts baked without dairy, eggs or refined sugar.",
    images: [media("hero")],
  },
  alternates: { canonical: "/" },
  applicationName: "Sweet Share",
  category: "food",
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
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <html lang="en">
      <body className="grain min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-berry focus:px-5 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>

        <CartProvider>
          <Header announcement={settings.announcement} />
          <main id="main">{children}</main>
          <Footer
            contactEmail={settings.contactEmail}
            contactPhone={settings.contactPhone}
            instagram={settings.instagram}
            facebook={settings.facebook}
          />
        </CartProvider>

        <JsonLd data={organisationSchema(settings.contactEmail)} />
      </body>
    </html>
  );
}
