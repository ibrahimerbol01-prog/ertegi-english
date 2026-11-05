import { noteChange } from "./learnerSync";

/* --- Proverb collection, kept per user in localStorage, synced to learner_state (learnerSync.ts) --- */
const maqalKey = (userId?: string) => `ertegi_maqals_${userId || "guest"}`;

export function loadMaqals(userId?: string): number[] {
  try {
    const raw = localStorage.getItem(maqalKey(userId));
    const v: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x): x is number => typeof x === "number") : [];
  } catch {
    return [];
  }
}

export function saveMaqal(userId: string | undefined, index: number) {
  const all = new Set(loadMaqals(userId));
  all.add(index);
  try { localStorage.setItem(maqalKey(userId), JSON.stringify([...all])); } catch { /* storage full or blocked */ }
  noteChange(userId, "maqal", String(index));
}
