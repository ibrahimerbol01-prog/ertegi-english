import { useLang } from "../../lang";
import type { DICT } from "../../dict";

/** Interface strings for one language. */
export type UiText = (typeof DICT)["kk"];

/* Picks the Kazakh or English UI string for the current language. */
export function useTr() {
  const kk = useLang() === "kk";
  return (kkText: string, enText: string) => (kk ? kkText : enText);
}

export const LEVEL_COLORS: Record<string, { bg: string; edge: string; island: string; soft: string }> = {
  A1: { bg: "bg-[#15805A]", edge: "shadow-[0_4px_0_#0F6446]", island: "shadow-[0_7px_0_#0F6446]", soft: "text-jade-deep" },
  A2: { bg: "bg-sky-deep", edge: "shadow-[0_4px_0_#075F75]", island: "shadow-[0_7px_0_#075F75]", soft: "text-sky-deep" },
  B1: { bg: "bg-sun", edge: "shadow-[0_4px_0_var(--color-sun-deep)]", island: "shadow-[0_7px_0_var(--color-sun-deep)]", soft: "text-sun-deep" },
  B2: { bg: "bg-felt", edge: "shadow-[0_4px_0_var(--color-felt-deep)]", island: "shadow-[0_7px_0_var(--color-felt-deep)]", soft: "text-felt-deep" },
  C1: { bg: "bg-night", edge: "shadow-[0_4px_0_#121a31]", island: "shadow-[0_7px_0_#121a31]", soft: "text-night" },
};
