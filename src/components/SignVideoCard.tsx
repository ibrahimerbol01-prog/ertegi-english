import { useEffect, useRef, useState } from "react";
import { Check, FlipHorizontal2, Pause, Play, RotateCcw, Turtle } from "lucide-react";
import type { SignEntry } from "../utils/signs";
import { useSignT } from "./signI18n";

/* One recorded sign for a dictionary word: the video, then Play/Pause, Replay,
   Slow (0.5×) and Mirror. It is muted and silent by design (nothing here relies
   on sound) and is not preloaded: a list of words costs nothing until a sign is
   opened. It starts only when the learner opened it (autoPlay is passed for that
   tap and for nothing else); with reduced motion it does not loop. Only one sign
   plays at a time. */

const isPlayAbort = (e: unknown) => {
  const name = (e as { name?: string } | null)?.name;
  return name === "AbortError" || name === "NotAllowedError"; // paused during loading / blocked: not a broken video
};

export default function SignVideoCard({ entry, word, meaning, autoPlay = false }: {
  entry: SignEntry;
  word: string;
  /** The Kazakh meaning shown under the video, when the dictionary has one. */
  meaning?: string;
  autoPlay?: boolean;
}) {
  const t = useSignT();
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const [mirror, setMirror] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const calm = typeof window !== "undefined" && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const v = video.current;
    if (v) v.playbackRate = slow ? 0.5 : 1;
  }, [slow, attempt]);

  useEffect(() => {
    if (autoPlay) video.current?.play().catch((e) => { if (!isPlayAbort(e)) setFailed(true); });
  }, [autoPlay, attempt]);

  // After "try again" the focus goes to the first control, not to the page.
  useEffect(() => {
    if (attempt > 0 && !failed) controls.current?.querySelector("button")?.focus();
  }, [attempt, failed]);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().catch((e) => { if (!isPlayAbort(e)) setFailed(true); });
    else v.pause();
  };
  const replay = () => {
    const v = video.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch((e) => { if (!isPlayAbort(e)) setFailed(true); });
  };
  const onPlay = () => {
    setPlaying(true);
    const me = video.current;
    document.querySelectorAll<HTMLVideoElement>("video[data-sign-video]").forEach((o) => { if (o !== me && !o.paused) o.pause(); });
  };
  const retry = () => { setFailed(false); setPlaying(false); setAttempt((n) => n + 1); };

  // mp4 first (every phone plays it); the failure of the last source is the failure of the video.
  const sources = [{ src: entry.video.mp4, type: "video/mp4" }, ...(entry.video.webm ? [{ src: entry.video.webm, type: "video/webm" }] : [])];

  const toggleBtn = "btn btn-ghost btn-sm justify-center !px-2";
  return (
    <figure className="card p-3 w-full">
      <div className="relative rounded-xl overflow-hidden bg-sand-2 aspect-[4/3]">
        {failed ? (
          <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <p className="text-[15px] text-ink-2">{t.error}</p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={retry}>{t.retry}</button>
          </div>
        ) : (
          <video
            key={attempt}
            ref={video}
            data-sign-video=""
            className="w-full h-full object-contain"
            style={mirror ? { transform: "scaleX(-1)" } : undefined}
            muted
            loop={!calm}
            playsInline
            preload="none"
            poster={entry.video.poster}
            aria-label={`${t.videoLabel}: ${word}`}
            onPlay={onPlay}
            onPause={() => setPlaying(false)}
            // A <source>'s error bubbles through React to here: only the video's own errors count; the last source reports itself.
            onError={(e) => { if (e.target === e.currentTarget) setFailed(true); }}
          >
            {sources.map((s, i) => (
              <source key={s.src} src={s.src} type={s.type} onError={i === sources.length - 1 ? () => setFailed(true) : undefined} />
            ))}
          </video>
        )}
        {entry.sample && <span className="absolute top-2 left-2 chip">{t.sample}</span>}
      </div>

      {!failed && (
        <div ref={controls} className="grid grid-cols-2 gap-2 mt-3" role="group" aria-label={t.controls}>
          <button type="button" className={toggleBtn} onClick={toggle}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
            <span className="ml-1">{playing ? t.pause : t.play}</span>
          </button>
          <button type="button" className={toggleBtn} onClick={replay}>
            <RotateCcw size={16} /><span className="ml-1">{t.replay}</span>
          </button>
          <button type="button" className={toggleBtn} onClick={() => setSlow((s) => !s)} aria-pressed={slow}>
            {slow ? <Check size={16} /> : <Turtle size={16} />}<span className="ml-1">{t.slow}</span>
          </button>
          <button type="button" className={toggleBtn} onClick={() => setMirror((m) => !m)} aria-pressed={mirror}>
            {mirror ? <Check size={16} /> : <FlipHorizontal2 size={16} />}<span className="ml-1">{t.mirror}</span>
          </button>
        </div>
      )}

      <figcaption className="mt-3 text-[15px] text-ink-2">
        <span lang="en" className="font-bold text-ink">{word}</span>
        {meaning && <> · <span lang="kk">{meaning}</span></>}
        <span className="block text-xs text-ink-3 mt-1">
          {entry.sample
            ? t.sampleNote
            : `${t.language}: ${entry.language} · ${t.by}: ${entry.signer} · ${t.checked}: ${entry.reviewedBy} · ${entry.licence}`}
        </span>
      </figcaption>
    </figure>
  );
}
