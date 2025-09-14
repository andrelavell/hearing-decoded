"use client";

import { useState } from "react";
import CiteModal from "./CiteModal";

type Author = { name: string; credentials?: string; affiliation?: string };

type Props = {
  title: string;
  authors?: Author[];
  createdAt?: string;
  duration?: number;
  permalink?: string;
  doi?: string;
  transcriptJsonUrl?: string;
  audioUrl: string;
};

export default function EpisodeMeta({ title, authors, createdAt, duration, permalink, doi, transcriptJsonUrl, audioUrl }: Props) {
  const [openCite, setOpenCite] = useState(false);

  const dateStr = createdAt ? new Date(createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : undefined;
  const durStr = typeof duration === "number" ? `${Math.floor(duration / 60)} min` : undefined;

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        {authors && authors.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">Authors:</span>
            <span className="truncate">
              {authors.map((a, i) => (
                <span key={i}>
                  {a.name}{a.credentials ? `, ${a.credentials}` : ""}{a.affiliation ? ` (${a.affiliation})` : ""}
                  {i < authors.length - 1 ? "; " : ""}
                </span>
              ))}
            </span>
          </div>
        )}
        {dateStr && (
          <div className="flex items-center gap-1"><span className="text-slate-300">•</span><span>Published {dateStr}</span></div>
        )}
        {durStr && (
          <div className="flex items-center gap-1"><span className="text-slate-300">•</span><span>{durStr}</span></div>
        )}
        {(permalink || doi) && (
          <div className="flex items-center gap-1 truncate"><span className="text-slate-300">•</span><span className="truncate">{doi ? `DOI: ${doi}` : permalink}</span></div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => setOpenCite(true)}>Cite</button>
        {transcriptJsonUrl && (
          <a className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" href={transcriptJsonUrl} target="_blank" rel="noreferrer">Transcript</a>
        )}
        <a className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" href={audioUrl} download>Download</a>
        {permalink && (
          <a className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" href={permalink} target="_blank" rel="noreferrer">Permalink</a>
        )}
      </div>

      <CiteModal open={openCite} onClose={() => setOpenCite(false)} title={title} authors={authors} createdAt={createdAt} permalink={permalink} doi={doi} />
    </>
  );
}
