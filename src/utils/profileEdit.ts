import { cleanNick } from "./classes";

/* Nickname and avatar of the profile (docs/product/profile-and-placement.md, A).
   Avatars are our own illustrations only, no photo upload: an ornament on a
   palette colour, or a tale cover. Only the id is stored (auth user metadata
   "avatar"), which is not personal data. */

export const AVATAR_ORNAMENTS = ["qoshqar", "shanyraq", "tumar"] as const;
export const AVATAR_COLORS = ["sky", "jade", "sun", "felt", "night"] as const;
/** The tales with a cover (src/components/StoryCover.tsx); profileEdit.test.ts checks they exist. */
export const AVATAR_TALES = ["aldar_kose", "zhirenshe", "er_tostik", "tazsha_bala", "ayaz_bi", "asan_kaigy", "alpamys"] as const;

export type AvatarOrnament = (typeof AVATAR_ORNAMENTS)[number];
export type AvatarColor = (typeof AVATAR_COLORS)[number];
export type Avatar = { kind: "ornament"; ornament: AvatarOrnament; color: AvatarColor } | { kind: "tale"; tale: string };

export const AVATAR_IDS: readonly string[] = [
  ...AVATAR_ORNAMENTS.flatMap((o) => AVATAR_COLORS.map((c) => `orn-${o}-${c}`)),
  ...AVATAR_TALES.map((t) => `tale-${t}`),
];

/** The avatar for a stored id, or null for none / an id that is not ours. */
export function parseAvatar(id: unknown): Avatar | null {
  if (typeof id !== "string" || !AVATAR_IDS.includes(id)) return null;
  if (id.startsWith("tale-")) return { kind: "tale", tale: id.slice(5) };
  const [, ornament, color] = id.split("-");
  return { kind: "ornament", ornament: ornament as AvatarOrnament, color: color as AvatarColor };
}

export const NICK_MAX = 30;
/* Words a nickname may not contain. Empty until the project lead decides whose
   list to use and in which languages (docs/product/profile-and-placement.md). */
export const NICK_BLOCKLIST: readonly string[] = [];

export type NickError = "empty" | "too_long" | "bad_chars" | "blocked";

/** A display name after cleaning: 1–30 characters, letters, digits, space, . ' -. */
export function validateNick(input: string, blocklist: readonly string[] = NICK_BLOCKLIST): { ok: true; value: string } | { ok: false; error: NickError } {
  const value = cleanNick(input).replace(/\s+/g, " ").trim();
  if (!value) return { ok: false, error: "empty" };
  if ([...value].length > NICK_MAX) return { ok: false, error: "too_long" };
  if (!/^[\p{L}\p{M}\p{N} .'-]+$/u.test(value)) return { ok: false, error: "bad_chars" };
  const low = value.toLowerCase();
  if (blocklist.some((w) => w && low.includes(w.toLowerCase()))) return { ok: false, error: "blocked" };
  return { ok: true, value };
}
