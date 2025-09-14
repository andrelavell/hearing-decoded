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
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="container py-6 flex items-center justify-between">
            <a href="/" className="text-xl font-semibold tracking-tight">Hearing Decoded</a>
            <nav className="text-sm text-slate-600 space-x-6">
              <a className="hover:text-slate-900" href="/">Episodes</a>
              <a className="hover:text-slate-900" href="/admin">Admin</a>
            </nav>
          </div>
        </header>
        <main className="container py-10">{children}</main>
        <footer className="container py-12 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} Hearing Decoded
        </footer>
      </body>
    </html>
  );
}

