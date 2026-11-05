/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API for the Capacitor app build, e.g. https://ertegi-english.vercel.app. Empty on the website. */
  readonly VITE_API_BASE?: string;
  /** Public site address used in shared links. Defaults to the current origin. */
  readonly VITE_PUBLIC_URL?: string;
  /** package.json version plus the commit, set in vite.config.ts; stamped on learning events. */
  readonly VITE_APP_VERSION?: string;
  /** "1" in the research build (R4, docs/research-build.md); "0" otherwise. Fixed at build time. */
  readonly VITE_RESEARCH_MODE?: string;
  /** Study id stamped on every event of the research build. */
  readonly VITE_STUDY_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** true in the research build (VITE_RESEARCH_MODE=1), false otherwise; a literal set in vite.config.ts. Use RESEARCH_MODE from src/research/mode.ts. */
declare const __ERTEGI_RESEARCH__: boolean;
