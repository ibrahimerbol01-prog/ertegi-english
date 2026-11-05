import type { TestSet } from "./types";
import { validateTestSet } from "./engine";

/* The approved set goes to src/data/researchTest.json and wins over the
   sample with no code change (docs/research-build.md). This module is only
   reached from the research build's test screen. */
const files = import.meta.glob<{ default: unknown }>("../../data/researchTest*.json", { eager: true });

export function pickTestSet(found: Record<string, { default: unknown }>): { set: TestSet | null; errors: string[] } {
  const path = Object.keys(found).find((p) => p.endsWith("/researchTest.json")) ?? Object.keys(found).find((p) => p.endsWith("/researchTest.sample.json"));
  if (!path) return { set: null, errors: ["no item set"] };
  const raw = found[path].default;
  const errors = validateTestSet(raw);
  return errors.length ? { set: null, errors } : { set: raw as TestSet, errors };
}

export const TEST_SET = pickTestSet(files);
