import { useCallback, useState } from "react";

/* Sign-language videos for dictionary words (the «Жест режимі», ordinary site
   only: the wordbank screen that shows them is not part of the research build).

   The app never draws or generates signs: every entry is a recording of a
   person, and an entry counts only if it says which sign language it is in,
   who signed it, who checked it and under what licence (validSign). No entry,
   no sign: a word without a recording shows nothing rather than a guess. The
   data file starts empty and is filled when recordings exist (src/data/signs.json). */

export interface SignVideo {
  mp4: string;
  webm?: string;
  poster?: string;
}

export interface SignEntry {
  /** Headword as the wordbank card writes it (cardWord), compared in lower case. */
  word: string;
  /** Part of speech as the wordbank writes it, when the sign differs by it; else the sign serves every part of speech. */
  pos?: string;
  video: SignVideo;
  /** Which sign language the recording is in, as the person who recorded it names it. */
  language: string;
  /** Who signed it (a name or an id the signer agreed to show). */
  signer: string;
  /** Who checked the sign (a native signer or an interpreter). */
  reviewedBy: string;
  licence: string;
  /** A stand-in that is not a real sign: shown with a badge, never counted as a recording. */
  sample?: boolean;
}

export interface SignsFile {
  schema: 1;
  entries: unknown[];
}

/* Videos come from our own site (a path) or our own public Supabase storage; nothing
   else, so a bad entry can't point the player at another host. Plain lower-case file
   names only: no "%", no "..". */
const SUPABASE_REF = "tsialjlxlhwemrkyyvjv";
const NAME = "[a-z0-9_\\-./]+";
const urlFor = (exts: string) => new RegExp(
  `^(?:\\/(?!\\/)${NAME}|https:\\/\\/${SUPABASE_REF}\\.supabase\\.co\\/storage\\/v1\\/object\\/public\\/${NAME})\\.(?:${exts})$`,
);
const URL_BY_KIND = {
  mp4: urlFor("mp4"),
  webm: urlFor("webm"),
  poster: urlFor("jpg|jpeg|png|webp"),
} as const;

export const safeMediaUrl = (u: unknown, kind: keyof typeof URL_BY_KIND): u is string =>
  typeof u === "string" && !u.includes("..") && URL_BY_KIND[kind].test(u);

const filled = (s: unknown): s is string => typeof s === "string" && s.trim().length > 0;

export function validSign(e: unknown): e is SignEntry {
  if (!e || typeof e !== "object") return false;
  const r = e as Record<string, unknown>;
  const v = r.video as Record<string, unknown> | undefined;
  return (
    filled(r.word) && filled(r.language) && filled(r.signer) && filled(r.reviewedBy) && filled(r.licence) &&
    (r.pos === undefined || filled(r.pos)) &&
    !!v && safeMediaUrl(v.mp4, "mp4") &&
    (v.webm === undefined || safeMediaUrl(v.webm, "webm")) &&
    (v.poster === undefined || safeMediaUrl(v.poster, "poster"))
  );
}

export const signKey = (word: string, pos?: string) =>
  word.trim().toLowerCase() + (pos ? `|${pos.trim().toLowerCase()}` : "");

/** Headword (and part of speech, when the entry has one) → entry. Invalid entries are dropped; the first of a duplicate wins. */
export function buildSignIndex(file: Pick<SignsFile, "entries">): Map<string, SignEntry> {
  const index = new Map<string, SignEntry>();
  for (const e of file.entries) {
    if (!validSign(e)) continue;
    const k = signKey(e.word, e.pos);
    if (!index.has(k)) index.set(k, e);
  }
  return index;
}

/** The sign for this word and part of speech: one made for that part of speech, else one for the word. */
export const findSign = (index: Map<string, SignEntry> | null, word: string, pos?: string): SignEntry | undefined =>
  index?.get(signKey(word, pos)) ?? index?.get(signKey(word));

let cached: Promise<Map<string, SignEntry>> | null = null;

/** The sign data is its own small chunk, fetched the first time the dictionary asks; a failure is not remembered. */
export function loadSigns(): Promise<Map<string, SignEntry>> {
  if (!cached) {
    cached = (async () => {
      const m = await import("../data/signs.json");
      return buildSignIndex(m.default as SignsFile);
    })().catch((err) => { cached = null; throw err; });
  }
  return cached;
}

const DEAF_KEY = "ertegi_deaf_mode";

export function readDeafMode(): boolean {
  try { return localStorage.getItem(DEAF_KEY) === "1"; } catch { return false; }
}

/** The mode is a device setting: signs first. */
export function useDeafMode(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(readDeafMode);
  const set = useCallback((v: boolean) => {
    setOn(v);
    try { if (v) localStorage.setItem(DEAF_KEY, "1"); else localStorage.removeItem(DEAF_KEY); } catch { /* storage blocked */ }
  }, []);
  return [on, set];
}
