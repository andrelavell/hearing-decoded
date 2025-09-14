import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Hearing Decoded",
  description: "Academic podcast series exploring the science of hearing and auditory perception.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60">
          <div className="container py-4 flex items-center justify-between">
            <a href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold text-slate-800 gradient-text">Hearing Decoded</span>
            </a>
            <nav className="flex items-center space-x-8">
              <a className="text-slate-600 hover:text-primary-600 font-medium transition-colors duration-200" href="/">
                Episodes
              </a>
              <a className="text-slate-600 hover:text-primary-600 font-medium transition-colors duration-200" href="/admin">
                Admin
              </a>
            </nav>
          </div>
        </header>
        <main className="container py-8 sm:py-12 lg:py-16 animate-fade-in">
          {children}
        </main>
        <footer className="border-t border-slate-200/60 bg-slate-50/50 backdrop-blur-sm">
          <div className="container py-12 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-lg font-semibold text-slate-700">Hearing Decoded</span>
            </div>
            <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
              Exploring the fascinating world of auditory science through engaging academic discussions.
            </p>
            <p className="text-slate-400 text-xs mt-4">
              © {new Date().getFullYear()} Hearing Decoded. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
