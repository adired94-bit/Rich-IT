import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rich IT Solutions — CRM",
    short_name: "Rich IT",
    description: "AI-Powered All-in-One CRM & Service Management",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0b0f17",
    theme_color: "#0b0f17",
    dir: "auto",
    lang: "he",
    categories: ["business", "productivity", "utilities"],
    icons: [
      { src: "/icons/icon-72.png", sizes: "72x72", type: "image/png" },
      { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { src: "/icons/icon-128.png", sizes: "128x128", type: "image/png" },
      { src: "/icons/icon-144.png", sizes: "144x144", type: "image/png" },
      { src: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "הקלטה מהירה", short_name: "הקלטה", url: "/?quickRecord=1", icons: [{ src: "/icons/icon-96.png", sizes: "96x96" }] },
      { name: "לקוח חדש", short_name: "לקוח", url: "/clients/new", icons: [{ src: "/icons/icon-96.png", sizes: "96x96" }] },
      { name: "יומן", short_name: "יומן", url: "/calendar", icons: [{ src: "/icons/icon-96.png", sizes: "96x96" }] },
    ],
  };
}
