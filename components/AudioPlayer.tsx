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

  return (
    <div className="card p-6 sm:p-8">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Subtitles panel */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-white/80">Subtitles</div>
          {captionsVttUrl ? (
            <button
              onClick={() => setShowCaptions((v) => !v)}
              className={clsx(
                "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm",
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
        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 min-h-[64px]">
          <div className="text-base leading-relaxed whitespace-pre-wrap text-white/90">
            {showCaptions ? (activeCue || "…") : "Captions hidden"}
          </div>
        </div>
      </div>

      {/* Time + scrubber */}
      <div className="flex items-center justify-between text-xs text-white/60">
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
          className="w-full accent-accent-500 h-1.5"
          aria-label="Scrubber"
        />
      </div>

      {/* Transport controls */}
      <div className="mt-6 sm:mt-8 flex items-center justify-center gap-8">
        <button
          onClick={() => skip(-15)}
          className="hidden sm:inline-flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 w-12 h-12 text-sm"
          aria-label="Back 15 seconds"
        >
          ◄ 15
        </button>

        <button
          onClick={toggle}
          className={clsx(
            "inline-flex items-center justify-center rounded-full w-16 h-16 sm:w-20 sm:h-20",
            "bg-accent-500 text-black shadow-soft hover:brightness-95"
          )}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <span className="text-xl font-bold">❚❚</span>
          ) : (
            <span className="text-xl font-bold">▶</span>
          )}
        </button>

        <button
          onClick={() => skip(30)}
          className="hidden sm:inline-flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 w-12 h-12 text-sm"
          aria-label="Forward 30 seconds"
        >
          30 ►
        </button>
      </div>

      {/* Settings */}
      <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
        <label className="inline-flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5">
          <span className="text-white/70">Speed</span>
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

        <label className="inline-flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5">
          <span className="text-white/70">Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}
