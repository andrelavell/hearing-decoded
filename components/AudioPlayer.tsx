"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

type Cue = {
  start: number;
  end: number;
  text: string;
};

function parseVtt(vtt: string): Cue[] {
  const lines = vtt.split(/\r?\n/);
  const cues: Cue[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line || /^WEBVTT/i.test(line) || /^NOTE/.test(line)) {
      i++;
      continue;
    }
    // Optional cue id line
    const maybeTime = lines[i + 1] ? lines[i + 1].trim() : "";
    const timeLine = /-->/.test(line) ? line : maybeTime;
    const timeIdx = /-->/.test(line) ? i : i + 1;
    const m = timeLine.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2}\.\d{3})/);
    if (m) {
      const start = toSeconds(m[1]);
      const end = toSeconds(m[2]);
      const textLines: string[] = [];
      let j = timeIdx + 1;
      while (j < lines.length && lines[j].trim() !== "") {
        textLines.push(lines[j]);
        j++;
      }
      cues.push({ start, end, text: textLines.join("\n") });
      i = j + 1;
    } else {
      i++;
    }
  }
  return cues;
}

function toSeconds(hms: string) {
  const [h, m, s] = hms.split(":");
  const [sec, ms] = s.split(".");
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(sec) + parseInt(ms) / 1000;
}

function formatTime(sec: number) {
  if (!isFinite(sec)) return "0:00";
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  const m = Math.floor((sec / 60) % 60).toString();
  const h = Math.floor(sec / 3600);
  return h > 0 ? `${h}:${m.padStart(2, "0")}:${s}` : `${m}:${s}`;
}

export default function AudioPlayer({
  src,
  captionsVttUrl,
  onDuration,
}: {
  src: string;
  captionsVttUrl?: string;
  onDuration?: (d: number) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [prevVolume, setPrevVolume] = useState(1);
  const [cues, setCues] = useState<Cue[]>([]);
  const [showCaptions, setShowCaptions] = useState(!!captionsVttUrl);

  const activeCue = useMemo(() => cues.find((c) => current >= c.start && current <= c.end)?.text ?? "", [cues, current]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onLoaded = () => {
      setDuration(a.duration || 0);
      onDuration?.(a.duration || 0);
    };
    const onTime = () => setCurrent(a.currentTime || 0);
    const onEnd = () => setPlaying(false);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
    };
  }, [onDuration]);

  useEffect(() => {
    if (!captionsVttUrl) return;
    fetch(captionsVttUrl)
      .then((r) => r.text())
      .then((t) => setCues(parseVtt(t)))
      .catch(() => setCues([]));
  }, [captionsVttUrl]);

  // Keep captions toggle consistent if prop changes
  useEffect(() => {
    setShowCaptions(!!captionsVttUrl);
  }, [captionsVttUrl]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  };
  const seek = (t: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(duration, t));
    setCurrent(a.currentTime);
  };

  const skip = (delta: number) => seek(current + delta);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
  }, [volume]);

  // Keyboard shortcuts: space (play/pause), ← (back 15), → (forward 30), ↑/↓ volume
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const interactive = ["input", "textarea", "select", "button"].includes(tag || "");
      if (interactive) return; // don't steal focus
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        skip(-15);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        skip(30);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setVolume((v) => Math.min(1, v + 0.05));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setVolume((v) => Math.max(0, v - 0.05));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const toggleMute = () => {
    if (volume === 0) {
      setVolume(prevVolume || 1);
    } else {
      setPrevVolume(volume);
      setVolume(0);
    }
  };

  const share = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : src;
      if ((navigator as any)?.share) {
        await (navigator as any).share({ title: "Hearing Decoded", url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard");
      }
    } catch {
      // ignore
    }
  };

  const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
  const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
  const BackIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <polyline points="11 19 2 12 11 5" />
      <path d="M22 19V5a7 7 0 0 0-7 7v7" />
    </svg>
  );
  const ForwardIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <polyline points="13 19 22 12 13 5" />
      <path d="M2 19V5a7 7 0 0 1 7 7v7" />
    </svg>
  );
  const VolumeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      {volume > 0.66 && <path d="M15 9a5 5 0 0 1 0 6" />}
      {volume > 0.33 && <path d="M17.5 5a9 9 0 0 1 0 14" />}
    </svg>
  );
  const VolumeMuteIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );

  return (
    <div className="card p-6 sm:p-8">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Subtitles panel */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-700">Subtitles</div>
          {captionsVttUrl ? (
            <button
              onClick={() => setShowCaptions((v) => !v)}
              className={clsx(
                "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm border",
                showCaptions
                  ? "bg-accent-500 border-accent-500 text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
              aria-pressed={showCaptions}
              aria-label="Toggle captions"
            >
              <span className="font-semibold">CC</span>
            </button>
          ) : (
            <span className="text-xs text-slate-500">No captions</span>
          )}
        </div>
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 min-h-[64px]">
          <div className="text-base leading-relaxed whitespace-pre-wrap text-slate-800">
            {showCaptions ? (activeCue || "…") : "Captions hidden"}
          </div>
        </div>
      </div>

      {/* Time + scrubber */}
      <div className="flex items-center justify-between text-xs text-slate-600">
        <div>{formatTime(current)}</div>
        <div>{formatTime(duration)}</div>
      </div>
      <div className="mt-2 sm:mt-3">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={(e) => seek(parseFloat(e.target.value))}
          className="w-full accent-accent-500 h-2"
          aria-label="Scrubber"
        />
      </div>

      {/* Transport controls */}
      <div className="mt-6 sm:mt-8 flex items-center justify-center gap-8">
        <button
          onClick={() => skip(-15)}
          className="hidden sm:inline-flex items-center justify-center rounded-full bg-white border border-slate-200 hover:bg-slate-50 w-12 h-12 text-slate-700"
          aria-label="Back 15 seconds"
          title="Back 15s (←)"
        >
          <BackIcon className="w-6 h-6" />
        </button>

        <button
          onClick={toggle}
          className={clsx(
            "inline-flex items-center justify-center rounded-full w-16 h-16 sm:w-20 sm:h-20",
            "bg-accent-500 text-white shadow-soft hover:brightness-95"
          )}
          aria-label={playing ? "Pause" : "Play"}
          title={playing ? "Pause (Space)" : "Play (Space)"}
        >
          {playing ? (
            <PauseIcon className="w-7 h-7" />
          ) : (
            <PlayIcon className="w-7 h-7 ml-0.5" />
          )}
        </button>

        <button
          onClick={() => skip(30)}
          className="hidden sm:inline-flex items-center justify-center rounded-full bg-white border border-slate-200 hover:bg-slate-50 w-12 h-12 text-slate-700"
          aria-label="Forward 30 seconds"
          title="Forward 30s (→)"
        >
          <ForwardIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Settings */}
      <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-sm">
        <label className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-slate-700">
          <span>Speed</span>
          <select
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="bg-transparent outline-none"
          >
            {[0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
              <option key={s} value={s}>{s}x</option>
            ))}
          </select>
        </label>

        <label className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-slate-700">
          <span>Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="accent-accent-500"
          />
        </label>

        <button
          onClick={toggleMute}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-slate-700"
          aria-label={volume === 0 ? "Unmute" : "Mute"}
          title={volume === 0 ? "Unmute" : "Mute"}
        >
          {volume === 0 ? (
            <VolumeMuteIcon className="w-4 h-4" />
          ) : (
            <VolumeIcon className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{volume === 0 ? "Muted" : "Mute"}</span>
        </button>

        <button
          onClick={share}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-slate-700"
          aria-label="Share episode"
          title="Share episode"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span className="hidden sm:inline">Share</span>
        </button>

        <a
          href={src}
          download
          className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-slate-700"
          aria-label="Download MP3"
          title="Download MP3"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="hidden sm:inline">Download</span>
        </a>
      </div>
    </div>
  );
}

