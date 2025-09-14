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
  const [muted, setMuted] = useState(false);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [cues, setCues] = useState<Cue[]>([]);
  const [showCaptions, setShowCaptions] = useState(!!captionsVttUrl);
  const [copied, setCopied] = useState(false);

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
    const onProgress = () => {
      try {
        const b = a.buffered;
        if (b.length > 0) {
          const end = b.end(b.length - 1);
          setBufferedEnd(Math.min(end, a.duration || 0));
        }
      } catch (_e) {
        // ignore
      }
    };
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    a.addEventListener("progress", onProgress);
    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("progress", onProgress);
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
    a.muted = muted;
  }, [volume]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = muted;
  }, [muted]);

  // Seek to timestamp if provided in URL (?t=seconds)
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const url = typeof window !== "undefined" ? new URL(window.location.href) : null;
    const t = url ? url.searchParams.get("t") : null;
    if (t) {
      const sec = parseFloat(t);
      if (isFinite(sec) && sec >= 0) {
        const applySeek = () => seek(sec);
        if (a.readyState >= 1) applySeek();
        else a.addEventListener("loadedmetadata", applySeek, { once: true } as any);
      }
    }
  }, []);

  // Keyboard shortcuts: Space toggle, ArrowLeft/Right 10s, J/K/L, +/- speed, M mute
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return; // don't hijack typing
      if (e.code === "Space") { e.preventDefault(); toggle(); }
      else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "j") skip(-10);
      else if (e.key === "ArrowRight" || e.key.toLowerCase() === "l") skip(10);
      else if (e.key.toLowerCase() === "k") toggle();
      else if (e.key === "+") setSpeed((s) => Math.min(2, Math.round((s + 0.25) * 4) / 4));
      else if (e.key === "-") setSpeed((s) => Math.max(0.5, Math.round((s - 0.25) * 4) / 4));
      else if (e.key.toLowerCase() === "m") setMuted((m) => !m);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skip]);

  const copyShareLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("t", Math.floor(current).toString());
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="card p-6 sm:p-8">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Top bar: caption toggle + share */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/75">Subtitles</span>
          {captionsVttUrl ? (
            <button
              onClick={() => setShowCaptions((v) => !v)}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm",
                showCaptions ? "bg-accent-500 text-black" : "bg-white/5 text-white/80 hover:bg-white/10"
              )}
              aria-pressed={showCaptions}
              aria-label="Toggle captions"
            >
              <span className="font-semibold">CC</span>
            </button>
          ) : (
            <span className="text-xs text-white/40">No captions</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyShareLink}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10"
            aria-label="Copy share link at current time"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v7a1 1 0 0 0 1 1h7"/><path d="M21 3a16 16 0 0 0-8 13"/><path d="M21 3h-6"/><path d="M21 3v6"/></svg>
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      </div>

      {/* Subtitles panel */}
      <div className="mb-6 sm:mb-8 rounded-xl border border-white/10 bg-white/5 p-4 min-h-[64px]">
        <div className="text-base leading-relaxed whitespace-pre-wrap text-white/90">
          {showCaptions ? (activeCue || "…") : "Captions hidden"}
        </div>
      </div>

      {/* Time + scrubber */}
      <div className="flex items-center justify-between text-xs text-white/60">
        <div>{formatTime(current)}</div>
        <div>{formatTime(duration)}</div>
      </div>
      <div className="mt-2 sm:mt-3 relative">
        {/* Buffered track */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-white/10">
          <div
            className="h-1.5 rounded-full bg-white/20"
            style={{ width: `${duration ? (bufferedEnd / duration) * 100 : 0}%` }}
            aria-hidden="true"
          />
          <div
            className="h-1.5 rounded-full bg-accent-500/90"
            style={{ width: `${duration ? (current / duration) * 100 : 0}%` }}
            aria-hidden="true"
          />
        </div>
        {/* Invisible native range for a11y + pointer interactions */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={(e) => seek(parseFloat(e.target.value))}
          className="w-full h-6 appearance-none bg-transparent cursor-pointer relative z-10"
          aria-label="Scrubber"
        />
      </div>

      {/* Transport controls */}
      <div className="mt-6 sm:mt-8 flex items-center justify-center gap-4 sm:gap-8">
        <button
          onClick={() => skip(-15)}
          className="inline-flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 w-12 h-12 text-sm"
          aria-label="Back 15 seconds"
          title="Back 15s (J/←)"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5V2l-5 5 5 5V9a7 7 0 1 1-7 7"/></svg>
        </button>

        <button
          onClick={toggle}
          className={clsx(
            "inline-flex items-center justify-center rounded-full w-16 h-16 sm:w-20 sm:h-20",
            "bg-accent-500 text-black shadow-soft hover:brightness-95"
          )}
          aria-label={playing ? "Pause" : "Play"}
          title={playing ? "Pause (K/Space)" : "Play (K/Space)"}
        >
          {playing ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>

        <button
          onClick={() => skip(30)}
          className="inline-flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 w-12 h-12 text-sm"
          aria-label="Forward 30 seconds"
          title="Forward 30s (L/→)"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5V2l5 5-5 5V9a7 7 0 1 0 7 7"/></svg>
        </button>
      </div>

      {/* Settings */}
      <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-sm">
        <button
          onClick={() => setSpeed((s) => {
            const list = [0.75, 1, 1.25, 1.5, 1.75, 2];
            const idx = list.indexOf(s);
            return list[(idx + 1) % list.length];
          })}
          className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-full px-3 py-1.5"
          aria-label="Change speed"
          title="Change speed (+/-)"
        >
          <span className="text-white/70">Speed</span>
          <span className="font-semibold">{speed.toFixed(2).replace(/\.00$/, "")}x</span>
        </button>

        <label className="inline-flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute" : "Mute"}
            className="text-white/80 hover:text-white"
          >
            {muted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M23 9l-6 6"/><path d="M17 9l6 6"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.54 8.46A5 5 0 0 1 17 12a5 5 0 0 1-1.46 3.54"/><path d="M19.07 6.93A8 8 0 0 1 21 12a8 8 0 0 1-1.93 5.07"/></svg>
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => { setVolume(parseFloat(e.target.value)); if (muted && parseFloat(e.target.value) > 0) setMuted(false); }}
            aria-label="Volume"
          />
        </label>
      </div>
    </div>
  );
}
