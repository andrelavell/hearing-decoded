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

// Modern icons as SVG components
const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
  </svg>
);

const SkipBackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
  </svg>
);

const SkipForwardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
  </svg>
);

const VolumeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>
);

const CaptionsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z"/>
  </svg>
);

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
  const [loading, setLoading] = useState(false);

  const activeCue = useMemo(() => cues.find((c) => current >= c.start && current <= c.end)?.text ?? "", [cues, current]);
  const progress = duration > 0 ? (current / duration) * 100 : 0;

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onLoaded = () => {
      setDuration(a.duration || 0);
      onDuration?.(a.duration || 0);
      setLoading(false);
    };
    const onTime = () => setCurrent(a.currentTime || 0);
    const onEnd = () => setPlaying(false);
    const onLoadStart = () => setLoading(true);
    
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    a.addEventListener("loadstart", onLoadStart);
    
    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("loadstart", onLoadStart);
    };
  }, [onDuration]);

  useEffect(() => {
    if (!captionsVttUrl) return;
    fetch(captionsVttUrl)
      .then((r) => r.text())
      .then((t) => setCues(parseVtt(t)))
      .catch(() => setCues([]));
  }, [captionsVttUrl]);

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
    <div className="card-elevated p-8 sm:p-10 max-w-4xl mx-auto">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Captions Display */}
      {captionsVttUrl && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Live Transcript</h3>
            <button
              onClick={() => setShowCaptions((v) => !v)}
              className={clsx(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                showCaptions 
                  ? "bg-primary-500 text-white shadow-lg hover:bg-primary-600" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
              aria-pressed={showCaptions}
              aria-label="Toggle captions"
            >
              <CaptionsIcon />
              <span>{showCaptions ? "Hide" : "Show"} Captions</span>
            </button>
          </div>
          
          {showCaptions && (
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 p-6 min-h-[120px] shadow-inner">
              <div className="text-lg leading-relaxed text-slate-700 font-medium">
                {activeCue || (
                  <span className="text-slate-400 italic">
                    {loading ? "Loading transcript..." : "Transcript will appear here as the episode plays"}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm font-medium text-slate-600 mb-3">
          <span>{formatTime(current)}</span>
          <span className="text-slate-400">•</span>
          <span>{formatTime(duration)}</span>
        </div>
        
        <div className="relative">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Seek audio position"
          />
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <button
          onClick={() => skip(-15)}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all duration-200 hover:shadow-md"
          aria-label="Rewind 15 seconds"
        >
          <SkipBackIcon />
          <span className="text-xs font-bold ml-1">15</span>
        </button>

        <button
          onClick={toggle}
          disabled={loading}
          className={clsx(
            "flex items-center justify-center w-20 h-20 rounded-full transition-all duration-200 shadow-xl hover:shadow-2xl",
            loading 
              ? "bg-slate-300 cursor-not-allowed" 
              : "bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white hover:scale-105"
          )}
          aria-label={playing ? "Pause" : "Play"}
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : playing ? (
            <PauseIcon />
          ) : (
            <PlayIcon />
          )}
        </button>

        <button
          onClick={() => skip(30)}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all duration-200 hover:shadow-md"
          aria-label="Fast forward 30 seconds"
        >
          <span className="text-xs font-bold mr-1">30</span>
          <SkipForwardIcon />
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-center gap-8 text-sm">
        {/* Speed Control */}
        <div className="flex items-center gap-3">
          <span className="text-slate-600 font-medium">Speed</span>
          <select
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
              <option key={s} value={s}>{s}×</option>
            ))}
          </select>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <VolumeIcon />
          <div className="relative w-24">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer slider"
              aria-label="Volume"
            />
            <style jsx>{`
              .slider::-webkit-slider-thumb {
                appearance: none;
                height: 16px;
                width: 16px;
                border-radius: 50%;
                background: #3b82f6;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
              }
              .slider::-moz-range-thumb {
                height: 16px;
                width: 16px;
                border-radius: 50%;
                background: #3b82f6;
                cursor: pointer;
                border: none;
                box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
              }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );
}
