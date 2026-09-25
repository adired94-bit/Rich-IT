import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withSerwistInit from "@serwist/next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@react-pdf/renderer", "postgres"],
  // Font files read at runtime via computed fs paths can't be discovered by
  // serverless bundlers' static analysis and get silently dropped from the
  // deployed function — force-include them everywhere. This covers both our
  // own custom fonts (public/fonts) and pdfkit's bundled standard fonts,
  // which @react-pdf/renderer loads internally the same dynamic way
  // (missing standard-fonts/*.cjs caused "Cannot find module ... Helvetica.cjs").
  outputFileTracingIncludes: {
    "/**": [
      "./public/fonts/**",
      "./node_modules/pdfkit/js/standard-fonts/**",
      "./node_modules/pdfkit/js/data/**",
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "25mb" },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default withSerwist(withNextIntl(nextConfig));
