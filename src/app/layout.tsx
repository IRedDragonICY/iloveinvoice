import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { AppLayoutWrapper } from "@/components/layout/AppLayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const siteName = "ILoveInvoice";
const siteTitle = `${siteName} — Pembuat Invoice Online Gratis`;
const siteDescription =
  "Buat, kelola, dan ekspor invoice dengan cepat. Simpan data perusahaan dan produk, tema gelap/terang, dan ekspor PDF yang rapi.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
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
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Set html.dark before React hydration to avoid FOUC and mismatches
  const themeScript = `(()=>{try{const raw=localStorage.getItem('ez_settings');const s=raw?JSON.parse(raw):null;const pref=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;const t=(s&&s.theme)||'system';const dark=t==='dark'||(t==='system'&&pref);const root=document.documentElement;root.classList.toggle('dark',dark);root.setAttribute('data-theme',dark?'dark':'light');}catch(e){}})();`;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <meta name="google-site-verification" content="SeU7j1p_RghwijQK39HcGyU9L5su7-xhodHrPXhE2Xs" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: siteName,
              url: siteUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: `${siteUrl}/?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NavigationProvider>
          <AppLayoutWrapper>
            {children}
          </AppLayoutWrapper>
        </NavigationProvider>
        <Analytics />
      </body>
    </html>
  );
}
