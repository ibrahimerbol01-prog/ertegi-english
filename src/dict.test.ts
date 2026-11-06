import { describe, expect, it } from "vitest";
import { DICT } from "./dict";

/**
 * Известные расхождения между kk и en, которые временно исключены из проверок.
 * // исправить переводом
 */
const KNOWN_GAPS: string[] = [];

describe("DICT translations", () => {
  const kk = DICT.kk as Record<string, unknown>;
  const en = DICT.en as Record<string, unknown>;

  const kkKeys = Object.keys(kk).filter((k) => !KNOWN_GAPS.includes(k));
  const enKeys = Object.keys(en).filter((k) => !KNOWN_GAPS.includes(k));

  it("kk and en have the exact same set of keys", () => {
    const missingInEn = kkKeys.filter((k) => !(k in en));
    const missingInKk = enKeys.filter((k) => !(k in kk));

    const errors: string[] = [];
    if (missingInEn.length > 0) {
      errors.push(`Missing in en: ${missingInEn.join(", ")}`);
    }
    if (missingInKk.length > 0) {
      errors.push(`Missing in kk: ${missingInKk.join(", ")}`);
    }

    expect(errors, errors.join("; ")).toEqual([]);
    expect(kkKeys.sort()).toEqual(enKeys.sort());
  });

  it("no translation string is empty", () => {
    for (const [lang, dict] of Object.entries({ kk, en, ru: DICT.ru as Record<string, unknown> })) {
      for (const [key, val] of Object.entries(dict)) {
        if (KNOWN_GAPS.includes(key)) continue;
        if (typeof val === "string") {
          expect(
            val.trim().length,
            `Empty translation string for key "${key}" in language "${lang}"`
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it("placeholders in curly braces match between kk and en", () => {
    const extractPlaceholders = (text: string): string[] => {
      const matches = text.match(/\{[a-zA-Z0-9_]+\}/g);
      return matches ? Array.from(new Set(matches)).sort() : [];
    };

    const commonKeys = kkKeys.filter((k) => k in en);
    for (const key of commonKeys) {
      if (KNOWN_GAPS.includes(key)) continue;
      const kkVal = kk[key];
      const enVal = en[key];

      if (typeof kkVal === "string" && typeof enVal === "string") {
        const kkPlaceholders = extractPlaceholders(kkVal);
        const enPlaceholders = extractPlaceholders(enVal);
        expect(
          kkPlaceholders,
          `Placeholder mismatch for key "${key}": kk has [${kkPlaceholders.join(
            ", "
          )}], en has [${enPlaceholders.join(", ")}]`
        ).toEqual(enPlaceholders);
      }
    }
  });

  it("ru has the same keys and placeholders as kk, and is written in Cyrillic", () => {
    const ru = DICT.ru as Record<string, unknown>;
    expect(Object.keys(ru).sort()).toEqual(Object.keys(kk).sort());
    const ph = (v: unknown) => (typeof v === "string" ? (v.match(/\{[a-zA-Z0-9_]+\}/g) ?? []).sort() : []);
    for (const key of Object.keys(kk)) {
      expect(ph(ru[key]), `placeholders of "${key}"`).toEqual(ph(kk[key]));
      // Every ru text must contain Cyrillic (catches an English string left in by mistake).
      expect(String(ru[key]), `ru "${key}" has no Cyrillic`).toMatch(/[А-Яа-яЁё]/);
    }
  });
});
