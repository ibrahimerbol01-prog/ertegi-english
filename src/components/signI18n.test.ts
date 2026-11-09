import { describe, expect, it } from "vitest";
import { SIGN_T } from "./signI18n";

describe("sign mode text", () => {
  it("kk and en have the same keys and none is empty", () => {
    expect(Object.keys(SIGN_T.kk).sort()).toEqual(Object.keys(SIGN_T.en).sort());
    for (const lang of ["kk", "en"] as const) {
      for (const [k, v] of Object.entries(SIGN_T[lang])) expect(v.trim().length, `${lang}.${k}`).toBeGreaterThan(0);
    }
  });
});
