import type { Metadata } from "next";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "DFW Probabilistic Operations Explorer",
  description: "Probabilistic analytics from live/cached public aviation and weather data.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
