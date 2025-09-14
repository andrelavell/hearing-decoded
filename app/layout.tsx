import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import SiteChrome from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Hearing Decoded",
  description: "Audiobook & podcast library with beautiful player and live captions.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}

