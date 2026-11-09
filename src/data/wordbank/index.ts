import type { WordbankLevel } from "./config";
import type { WordbankEntry } from "./types";

/* Each level is a chunk of its own, loaded only when the wordbank screen asks
   for it: never in the entry bundle or in KazakhTalesApp. */
const LOADERS: Record<WordbankLevel, () => Promise<{ default: unknown }>> = {
  A1: () => import("./A1.json"),
  A2: () => import("./A2.json"),
  B1: () => import("./B1.json"),
  B2: () => import("./B2.json"),
  C1: () => import("./C1.json"),
  C2: () => import("./C2.json"),
};

export const loadWordbankLevel = async (level: WordbankLevel): Promise<WordbankEntry[]> =>
  (await LOADERS[level]()).default as WordbankEntry[];
