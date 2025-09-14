"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isEpisode = pathname?.startsWith("/episode/");

  if (isEpisode) {
    return (
      <main className="min-h-screen">{children}</main>
    );
  }

  return (
    <>
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
    </>
  );
}
