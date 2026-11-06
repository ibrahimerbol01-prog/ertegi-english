import { createContext, useContext } from "react";

/* Interface language. Kazakh UI text is written in Cyrillic, the script
   students use at school; English stays only in the learning content. */
export type Lang = "kk" | "ru" | "en";

/** The Russian button appears in the language switcher only when every screen has
    Russian text (otherwise a Russian reader would see English in the gaps). Stage 1
    (this flag off) adds the language, the dictionary and the helpers; the screens
    are converted in later pull requests, then this flips to true. */
export const RU_UI_READY = false;

/** Interface languages the app knows. */
export const LANGS: readonly Lang[] = ["kk", "ru", "en"];

/** Narrows any stored or typed value to a known language (Kazakh by default). */
export const toLang = (v: unknown): Lang => (v === "en" || v === "ru" ? v : "kk");

/** Picks the text for the current language: pick(lang, kk, ru, en). */
export const pick = <T,>(lang: Lang, kk: T, ru: T, en: T): T => (lang === "ru" ? ru : lang === "en" ? en : kk);

const LANG_KEY = "ertegi_lang";

// Screen readers pick their voice from <html lang>, so it follows the UI language.
function setDocLang(lang: Lang) {
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}

export function loadLang(): Lang {
  let lang: Lang = "kk";
  try {
    lang = toLang(localStorage.getItem(LANG_KEY));
  } catch { /* storage blocked */ }
  setDocLang(lang);
  return lang;
}

export function saveLang(lang: Lang) {
  setDocLang(lang);
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* storage blocked */ }
}

export const LangContext = createContext<Lang>("kk");
export const useLang = () => useContext(LangContext);
