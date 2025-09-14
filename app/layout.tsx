import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Hearing Decoded",
  description: "Audiobook & podcast library with beautiful player and live captions.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-white/10">
          <div className="container py-6 flex items-center justify-between">
            <a href="/" className="text-xl font-semibold tracking-tight">Hearing Decoded</a>
            <nav className="text-sm text-white/70 space-x-6">
              <a className="hover:text-white" href="/">Episodes</a>
              <a className="hover:text-white" href="/admin">Admin</a>
            </nav>
          </div>
        </header>
        <main className="container py-10">{children}</main>
        <footer className="container py-12 text-center text-white/50 text-sm">
          © {new Date().getFullYear()} Hearing Decoded
        </footer>
      </body>
    </html>
  );
}
