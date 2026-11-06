import { RESEARCH_MODE } from "./research/mode";

/* Ordinary build: index.html only preloads the Google Fonts stylesheet
   (vite.config.ts, nonBlockingFonts), so it no longer blocks the first paint;
   here it becomes a stylesheet. The research build keeps the blocking link in
   index.html and this does nothing, so its page is unchanged. */
export function loadFonts(doc: Pick<Document, "querySelector" | "createElement" | "head"> | undefined = typeof document === "undefined" ? undefined : document): boolean {
  if (RESEARCH_MODE || !doc) return false;
  const pre = doc.querySelector<HTMLLinkElement>("link[rel=preload][data-fonts]");
  if (!pre) return false;
  const css = doc.createElement("link");
  css.rel = "stylesheet";
  css.href = pre.href;
  doc.head.appendChild(css);
  return true;
}
