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
            <a href="/" className="text-xl font-bold tracking-tight">🎙️ Parley.</a>
            <nav className="hidden md:flex text-sm text-white/70 space-x-8">
              <a className="hover:text-white" href="/">Home</a>
              <a className="hover:text-white" href="/">Episodes</a>
              <a className="hover:text-white" href="/">Pages</a>
              <a className="hover:text-white" href="/admin">Contact</a>
            </nav>
            <button className="bg-yellow-400 text-black px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
              <span className="w-4 h-4 bg-black rounded-full flex items-center justify-center text-yellow-400 text-xs">👤</span>
              Subscribe
            </button>
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
