import { createContext, useContext } from "react";

/* Interface language. Kazakh UI text is written in Cyrillic, the script
   students use at school; English stays only in the learning content. */
export type Lang = "kk" | "en";

const LANG_KEY = "ertegi_lang";

export function loadLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === "en" ? "en" : "kk";
  } catch {
    return "kk";
  }
}

export function saveLang(lang: Lang) {
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* storage blocked */ }
}

export const LangContext = createContext<Lang>("kk");
export const useLang = () => useContext(LangContext);
