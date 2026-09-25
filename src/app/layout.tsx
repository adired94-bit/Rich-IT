import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { dirFor, type Locale } from "@/i18n/config";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/providers/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin", "hebrew", "cyrillic"],
  variable: "--font-rubik",
  display: "swap",
});

const siteDescription = "מערכת ניהול לקוחות ושירות לשטח — Rich IT Solutions";

export const metadata: Metadata = {
  title: "Rich IT Solutions — CRM",
  description: siteDescription,
  manifest: "/manifest.webmanifest",
  applicationName: "Rich IT Solutions",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Rich IT" },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon-192.png" }],
  },
  openGraph: {
    title: "Rich IT Solutions — CRM",
    description: siteDescription,
    locale: "he_IL",
    type: "website",
    siteName: "Rich IT Solutions",
    images: [{ url: "/icons/icon-512.png" }],
  },
  twitter: {
    card: "summary",
    title: "Rich IT Solutions — CRM",
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0f17",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  const dir = dirFor(locale);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${rubik.variable} font-sans antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <QueryProvider>
              <TooltipProvider delayDuration={200}>
                {children}
                <Toaster />
              </TooltipProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
