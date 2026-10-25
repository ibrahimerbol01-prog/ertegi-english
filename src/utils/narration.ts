import { supabase } from "../lib/supabase";

/* Story narration for read-along: a neural Azure voice reads the whole text in
   one go, so sentences join the way a person reads them. Word timings come
   back with the audio, which lets the reader follow along like subtitles. */

export interface Narration {
  url: string;
  // Start time (seconds) and text of every spoken word.
  words: { time: number; text: string }[];
}

// Most natural voice first; the second is available in every Azure region.
const VOICES = ["en-US-AvaMultilingualNeural", "en-US-JennyNeural"];

const cache = new Map<string, Promise<Narration>>();

export function narrate(text: string): Promise<Narration> {
  let job = cache.get(text);
  if (!job) {
    job = synthesize(text);
    cache.set(text, job);
    job.catch(() => cache.delete(text));
  }
  return job;
}

// Azure tokens live ten minutes; reuse one for eight so each clip starts faster.
let tokenJob: { at: number; job: Promise<{ token: string; region: string }> } | null = null;
function speechToken() {
  if (tokenJob && Date.now() - tokenJob.at < 8 * 60_000) return tokenJob.job;
  const job = (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/azure-token", { headers: { Authorization: `Bearer ${session?.access_token ?? ""}` } });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error || "No speech token");
    return body as { token: string; region: string };
  })();
  tokenJob = { at: Date.now(), job };
  job.catch(() => { tokenJob = null; });
  return job;
}

async function synthesize(text: string): Promise<Narration> {
  const auth = await speechToken();
  const SDK = await import("microsoft-cognitiveservices-speech-sdk");
  let lastError: unknown = null;
  for (const voice of VOICES) {
    try {
      const config = SDK.SpeechConfig.fromAuthorizationToken(auth.token, auth.region);
      config.speechSynthesisVoiceName = voice;
      config.speechSynthesisOutputFormat = SDK.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;
      // No audio config: keep the audio in memory and play it ourselves, so speed and seeking are ours.
      const synth = new SDK.SpeechSynthesizer(config, null);
      const words: Narration["words"] = [];
      synth.wordBoundary = (_s, e) => {
        if (e.boundaryType === SDK.SpeechSynthesisBoundaryType.Word) words.push({ time: e.audioOffset / 1e7, text: e.text });
      };
      const audio = await new Promise<ArrayBuffer>((resolve, reject) => {
        synth.speakTextAsync(
          text,
          (r) => {
            synth.close();
            if (r.reason === SDK.ResultReason.SynthesizingAudioCompleted) resolve(r.audioData);
            else reject(new Error(r.errorDetails || "Synthesis failed"));
          },
          (err) => { synth.close(); reject(new Error(err)); }
        );
      });
      return { url: URL.createObjectURL(new Blob([audio], { type: "audio/mpeg" })), words };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

/* Browser fallback when the Azure voice is unreachable: the best English
   system voice, at natural pitch. */
export function bestBrowserVoice(): SpeechSynthesisVoice | null {
  try {
    const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
    return (
      voices.find((v) => /natural|neural|online/i.test(v.name)) ??
      voices.find((v) => /google us english|samantha|aria|jenny/i.test(v.name)) ??
      voices.find((v) => v.lang === "en-US") ??
      voices[0] ??
      null
    );
  } catch {
    return null;
  }
}

/* Match spoken words to the reader's tokens in order. Matching by text, not by
   character offset, keeps the two in step whatever the voice does with quotes. */
const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
export function alignWords(words: Narration["words"], tokens: string[]): number[] {
  let cursor = 0;
  return words.map((w) => {
    const word = clean(w.text);
    if (!word) return -1;
    for (const from of [cursor, Math.max(0, cursor - 2)]) {
      for (let j = from; j < Math.min(tokens.length, from + 12); j++) {
        const tok = clean(tokens[j]);
        // Hyphenated tokens ("stone-squeezing") can be spoken as two words.
        if (tok === word || (word.length >= 3 && (tok.startsWith(word) || tok.endsWith(word)))) {
          cursor = j + 1;
          return j;
        }
      }
    }
    return -1;
  });
}

/* iPhones only let an audio element play if it first plays inside the tap
   itself. Voice audio arrives a moment later, so each element plays a short
   silence on the tap to unlock it. */
const SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";
const unlocked = new WeakSet<HTMLAudioElement>();
export function primeAudio(el: HTMLAudioElement) {
  if (unlocked.has(el)) return;
  unlocked.add(el);
  el.src = SILENCE;
  el.play().catch(() => { /* nothing to unlock */ });
}

/* Short clips (a word, a proverb, a card scene) in the same neural voice.
   One clip plays at a time; a newer request replaces an older one. */
let clip: HTMLAudioElement | null = null;
let clipRequest = 0;

export async function speakClip(text: string, rate = 1) {
  const request = ++clipRequest;
  stopClip(false);
  clip = clip ?? new Audio();
  primeAudio(clip);
  let url: string;
  try {
    ({ url } = await narrate(text));
  } catch (err) {
    if (request === clipRequest) throw err;
    return;
  }
  if (request !== clipRequest) return;
  clip.src = url;
  clip.playbackRate = rate;
  try {
    await clip.play();
  } catch (err) {
    // A newer clip interrupting this one is not a failure.
    if (request === clipRequest) throw err;
  }
}

export function stopClip(cancelPending = true) {
  if (cancelPending) clipRequest++;
  clip?.pause();
  try { window.speechSynthesis?.cancel(); } catch { /* not supported */ }
}
