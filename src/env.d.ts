/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API for the Capacitor app build, e.g. https://ertegi-english.vercel.app. Empty on the website. */
  readonly VITE_API_BASE?: string;
  /** Public site address used in shared links. Defaults to the current origin. */
  readonly VITE_PUBLIC_URL?: string;
  /** package.json version plus the commit, set in vite.config.ts; stamped on learning events. */
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
