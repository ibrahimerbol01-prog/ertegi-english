import { createContext, useContext } from "react";

/* Interface language. Kazakh UI text is written in Cyrillic, the script
   students use at school; English stays only in the learning content. */
export type Lang = "kk" | "en";

const LANG_KEY = "ertegi_lang";

// Screen readers pick their voice from <html lang>, so it follows the UI language.
function setDocLang(lang: Lang) {
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}

export function loadLang(): Lang {
  let lang: Lang = "kk";
  try {
    lang = localStorage.getItem(LANG_KEY) === "en" ? "en" : "kk";
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
