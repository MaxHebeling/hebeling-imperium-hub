import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IDR Privado",
    short_name: "IDR",
    description: "Portal privado premium para staff e inversionistas de Inversionistas del Reino.",
    start_url: "/idr/overview",
    scope: "/idr",
    display: "standalone",
    background_color: "#07101C",
    theme_color: "#07101C",
    orientation: "portrait",
    lang: "es",
    categories: ["business", "finance", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
