import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, RotateCcw, Volume1, Volume2, VolumeX } from "lucide-react";
import { bestBrowserVoice, narrate, primeAudio, stopClip } from "../utils/narration";

/* A small audio player for a listening scene: play and pause, a slider to jump
   anywhere, speed and volume. The neural Azure voice plays through our own
   audio element; if it can't be reached, the best browser voice reads the text
   (pause works, jumping does not). */

type Status = "idle" | "loading" | "playing" | "paused" | "ended";
const SPEEDS = [0.75, 1, 1.25];

// iPhones ignore audio.volume (only the hardware buttons change it), so the
// volume slider is shown only where it works; mute works everywhere.
const volumeWorks = (() => {
  try {
    const a = new Audio();
    a.volume = 0.5;
    return a.volume === 0.5;
  } catch {
    return false;
  }
})();

const clock = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

type Props = { text: string; lang: "kk" | "en"; onPlay?: () => void };

// A new scene starts from a fresh player.
export function ScenePlayer(props: Props) {
  return <Player key={props.text} {...props} />;
}

function Player({ text, lang, onPlay }: Props) {
  const kk = lang === "kk";
  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  // Browser voice fallback: progress comes from word boundaries, no seeking.
  const [browser, setBrowser] = useState(false);
  const [browserProgress, setBrowserProgress] = useState(0);
  const ready = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const request = useRef(0);

  // Stop everything when the sheet closes.
  useEffect(() => {
    const el = audioRef.current;
    const pending = request;
    return () => {
      pending.current++;
      el?.pause();
      try { window.speechSynthesis?.cancel(); } catch { /* not supported */ }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    audioRef.current.muted = muted;
  }, [volume, muted]);

  const speakInBrowser = (from: "start" | "resume") => {
    const synth = window.speechSynthesis;
    if (!synth) { setStatus("idle"); return; }
    if (from === "resume" && synth.paused) { synth.resume(); setStatus("playing"); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = bestBrowserVoice();
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? "en-US";
    u.rate = rate;
    u.volume = muted ? 0 : volume;
    u.onboundary = (e) => setBrowserProgress(Math.min(1, e.charIndex / text.length));
    u.onend = () => { setBrowserProgress(1); setStatus("ended"); };
    u.onerror = () => setStatus("idle");
    setBrowserProgress(0);
    setStatus("playing");
    synth.speak(u);
  };

  const start = async () => {
    const el = audioRef.current;
    if (!el) return;
    onPlay?.();
    stopClip(); // any other "listen" button that is still talking
    if (browser) { speakInBrowser(status === "paused" ? "resume" : "start"); return; }
    if (ready.current) {
      if (status === "ended") el.currentTime = 0;
      el.play().catch(() => setStatus("paused"));
      return;
    }
    const id = ++request.current;
    primeAudio(el); // must happen inside the tap for iPhones
    setStatus("loading");
    try {
      const { url } = await narrate(text);
      if (id !== request.current) return;
      el.src = url;
      el.playbackRate = rate;
      ready.current = true;
      setLoaded(true);
      await el.play();
    } catch {
      if (id !== request.current) return;
      setBrowser(true);
      speakInBrowser("start");
    }
  };

  const pause = () => {
    if (browser) {
      try { window.speechSynthesis.pause(); } catch { /* not supported */ }
      setStatus("paused");
      return;
    }
    audioRef.current?.pause();
  };

  const seek = (value: number) => {
    const el = audioRef.current;
    if (!el || !ready.current) return;
    el.currentTime = value;
    setTime(value);
    if (status === "ended") setStatus("paused");
  };

  const changeRate = (r: number) => {
    setRate(r);
    // The browser voice can't change speed mid-sentence: restart it at the new speed.
    if (browser && status === "playing") setTimeout(() => speakInBrowser("start"), 0);
  };

  const playing = status === "playing";
  const fill = browser ? browserProgress * 100 : duration ? (time / duration) * 100 : 0;
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="rounded-[22px] bg-sky-soft/60 border-2 border-sky/20 p-3.5">
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => { if (ready.current) setStatus("playing"); }}
        onPause={(e) => { if (!e.currentTarget.ended && ready.current) setStatus("paused"); }}
        onEnded={() => { if (ready.current) setStatus("ended"); }}
        onTimeUpdate={(e) => { if (ready.current) setTime(e.currentTarget.currentTime); }}
        onLoadedMetadata={(e) => { if (ready.current) setDuration(e.currentTarget.duration); }}
        onDurationChange={(e) => { if (ready.current && Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration); }}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={playing ? pause : start}
          disabled={status === "loading"}
          aria-label={playing ? (kk ? "Кідірту" : "Pause") : status === "ended" ? (kk ? "Қайта тыңдау" : "Play again") : (kk ? "Тыңдау" : "Play")}
          className="w-14 h-14 rounded-full bg-sky text-white flex items-center justify-center shrink-0 shadow-[0_4px_0_var(--color-sky-deep)] active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-sky-deep)] transition-transform disabled:opacity-80"
        >
          {status === "loading" ? <Loader2 size={24} className="animate-spin" />
            : playing ? <Pause size={24} fill="currentColor" />
            : status === "ended" ? <RotateCcw size={22} strokeWidth={2.6} />
            : <Play size={24} fill="currentColor" className="ml-0.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <input
            type="range"
            className="seek"
            min={0}
            max={duration || 1}
            step={0.1}
            value={browser ? browserProgress : time}
            disabled={browser || !loaded}
            onChange={(e) => seek(Number(e.target.value))}
            style={{ "--fill": `${fill}%` } as React.CSSProperties}
            aria-label={kk ? "Қай жерден тыңдау" : "Position"}
            aria-valuetext={`${clock(time)} / ${clock(duration)}`}
          />
          <div className="flex justify-between text-[12px] font-semibold text-ink-2 tabular-nums -mt-0.5">
            <span>{browser ? "" : clock(time)}</span>
            <span>
              {status === "loading" ? (kk ? "Дайындалып жатыр…" : "Loading…")
                : browser ? (kk ? "Браузер дауысы" : "Browser voice")
                : clock(duration)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2.5">
        <div className="segmented flex-1 max-w-[180px]" role="group" aria-label={kk ? "Жылдамдық" : "Speed"}>
          {SPEEDS.map((r) => (
            <button key={r} aria-pressed={rate === r} onClick={() => changeRate(r)}>{r}×</button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <button
            onClick={() => setMuted((m) => !m)}
            aria-pressed={muted}
            aria-label={muted ? (kk ? "Дыбысты қосу" : "Unmute") : (kk ? "Дыбысты өшіру" : "Mute")}
            className="w-10 h-10 rounded-full text-sky-deep flex items-center justify-center shrink-0 hover:bg-card/70"
          >
            <VolumeIcon size={20} />
          </button>
          {volumeWorks && (
            <input
              type="range"
              className="seek max-w-[110px]"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => { const v = Number(e.target.value); setVolume(v); setMuted(v === 0); }}
              style={{ "--fill": `${(muted ? 0 : volume) * 100}%` } as React.CSSProperties}
              aria-label={kk ? "Дыбыс деңгейі" : "Volume"}
            />
          )}
        </div>
      </div>
    </div>
  );
}
