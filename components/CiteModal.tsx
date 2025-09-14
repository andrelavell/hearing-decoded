"use client";

import { useMemo } from "react";

export type Author = { name: string; credentials?: string; affiliation?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  authors?: Author[];
  createdAt?: string; // ISO
  permalink?: string;
  doi?: string;
};

function formatAPA(authors: Author[] = [], title: string, year: string, permalink?: string, doi?: string) {
  const parts = authors.map((a) => {
    // Split into words, last word as last name
    const words = a.name.trim().split(/\s+/);
    const last = words.pop() || "";
    const initials = words.map((w) => w[0]?.toUpperCase() + ".").join(" ");
    return `${last}, ${initials}`.trim();
  });
  const authorStr = parts.join(", ");
  const where = doi ? `https://doi.org/${doi}` : (permalink || "");
  return `${authorStr} (${year}). ${title}. ${where}`.trim();
}

function bibtexKey(title: string, year: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${slug}-${year}`;
}

function formatBibTeX(authors: Author[] = [], title: string, year: string, permalink?: string, doi?: string) {
  const authorStr = authors.length
    ? authors.map((a) => a.name).join(" and ")
    : "Unknown";
  const key = bibtexKey(title, year);
  const lines = [
    `@misc{${key},`,
    `  title={${title}},`,
    `  author={${authorStr}},`,
    `  year={${year}},`,
    `  howpublished={Podcast episode},`,
    permalink ? `  url={${permalink}},` : undefined,
    doi ? `  doi={${doi}},` : undefined,
    `}`,
  ].filter(Boolean) as string[];
  return lines.join("\n");
}

export default function CiteModal({ open, onClose, title, authors, createdAt, permalink, doi }: Props) {
  const year = useMemo(() => (createdAt ? new Date(createdAt).getFullYear().toString() : ""), [createdAt]);
  const apa = useMemo(() => formatAPA(authors, title, year, permalink, doi), [authors, title, year, permalink, doi]);
  const bib = useMemo(() => formatBibTeX(authors, title, year, permalink, doi), [authors, title, year, permalink, doi]);

  if (!open) return null;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard");
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-soft p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold">Cite this episode</h3>
          <button className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50" onClick={onClose} aria-label="Close">Close</button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <div className="mb-2 text-sm text-slate-600">APA</div>
            <div className="flex items-start gap-2">
              <textarea className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-slate-900" rows={3} readOnly value={apa} />
              <button onClick={() => copy(apa)} className="h-9 px-3 rounded-md bg-white border border-slate-200 hover:bg-slate-50">Copy</button>
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm text-slate-600">BibTeX</div>
            <div className="flex items-start gap-2">
              <textarea className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 font-mono text-sm text-slate-900" rows={6} readOnly value={bib} />
              <button onClick={() => copy(bib)} className="h-9 px-3 rounded-md bg-white border border-slate-200 hover:bg-slate-50">Copy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
