import type { Metadata, Viewport } from "next";
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

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://crave.app';

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0F" },
    { media: "(prefers-color-scheme: light)", color: "#0A0A0F" },
  ],
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Crave — Online Food Ordering & Queue Management, Chennai",
    template: "%s | Crave",
  },
  description:
    "Order your favorite meals in advance from Crave near LIC Metro, Chennai. Skip the queue, choose your pickup time, and collect fresh Shawarma, Burgers & more.",
  applicationName: "Crave",
  generator: "Next.js",
  creator: "Crave",
  publisher: "Crave",
  authors: [{ name: "Crave" }],
  category: "food",
  keywords: [
    "food ordering",
    "queue management",
    "Chennai food",
    "LIC Metro",
    "Shawarma",
    "Burger",
    "online ordering",
    "restaurant",
    "cloud kitchen",
    "food delivery",
    "pickup",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "en-IN": BASE_URL,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.svg", type: "image/svg+xml", sizes: "192x192" },
      { url: "/icons/icon-512.svg", type: "image/svg+xml", sizes: "512x512" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.svg"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Crave",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  referrer: "strict-origin-when-cross-origin",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    yahoo: process.env.NEXT_PUBLIC_YAHOO_SITE_VERIFICATION || "",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Crave",
    title: "Crave — Skip The Queue. Order Smarter.",
    description:
      "Order your favorite meals in advance, choose your pickup time, and collect your food without standing in long queues. Near LIC Metro, Chennai.",
    url: BASE_URL,
    countryName: "India",
  },
  twitter: {
    card: "summary_large_image",
    site: "@crave_app",
    creator: "@crave_app",
    title: "Crave — Skip The Queue. Order Smarter.",
    description:
      "Order your favorite meals in advance, choose your pickup time, and collect your food without standing in long queues.",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
    >
      <body className="min-h-screen flex flex-col">
        <script
          id="schema-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': `${BASE_URL}/#organization`,
                  name: 'Crave',
                  url: BASE_URL,
                  logo: `${BASE_URL}/icons/icon-512.svg`,
                  description:
                    'Online food ordering near LIC Metro, Chennai. Skip the queue and order smarter.',
                  contactPoint: {
                    '@type': 'ContactPoint',
                    telephone: '+91-9876543210',
                    contactType: 'customer service',
                    availableLanguage: ['English', 'Tamil'],
                  },
                  sameAs: [
                    'https://facebook.com/craveapp',
                    'https://instagram.com/craveapp',
                    'https://twitter.com/crave_app',
                  ],
                },
                {
                  '@type': 'WebSite',
                  '@id': `${BASE_URL}/#website`,
                  url: BASE_URL,
                  name: 'Crave',
                  description:
                    'Online food ordering & queue management system near LIC Metro, Chennai.',
                  publisher: { '@id': `${BASE_URL}/#organization` },
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: `${BASE_URL}/menu?search={search_term_string}`,
                    },
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'FoodEstablishment',
                  '@id': `${BASE_URL}/#restaurant`,
                  name: 'Crave',
                  url: BASE_URL,
                  servesCuisine: ['Indian', 'Shawarma', 'Burgers', 'Fast Food'],
                  priceRange: '₹50–₹500',
                  telephone: '+91-9876543210',
                  address: {
                    '@type': 'PostalAddress',
                    streetAddress: 'Near LIC Metro',
                    addressLocality: 'Chennai',
                    addressRegion: 'Tamil Nadu',
                    postalCode: '600002',
                    addressCountry: 'IN',
                  },
                  geo: {
                    '@type': 'GeoCoordinates',
                    latitude: 13.0827,
                    longitude: 80.2707,
                  },
                  openingHoursSpecification: [
                    {
                      '@type': 'OpeningHoursSpecification',
                      dayOfWeek: [
                        'Monday',
                        'Tuesday',
                        'Wednesday',
                        'Thursday',
                        'Friday',
                        'Saturday',
                      ],
                      opens: '10:00',
                      closes: '22:00',
                    },
                    {
                      '@type': 'OpeningHoursSpecification',
                      dayOfWeek: 'Sunday',
                      opens: '11:00',
                      closes: '21:00',
                    },
                  ],
                  acceptsReservations: 'false',
                  hasMenu: `${BASE_URL}/menu`,
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: '4.5',
                    ratingCount: '128',
                    bestRating: '5',
                  },
                },
              ],
            }),
          }}
        ></script>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
