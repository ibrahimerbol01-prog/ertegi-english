/* Where the serverless API lives. On the website it is the same origin, so
   paths stay relative. Inside the Capacitor app the page is served from
   capacitor://localhost (iOS) or https://localhost (Android), so the build
   for the app sets VITE_API_BASE=https://ertegi-english.vercel.app. */
const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/+$/, "");

export const apiUrl = (path: string) => `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

/* The public address of the site, for links people share (class invites).
   In the app window.location.origin is not a real web address. */
export const PUBLIC_URL = (import.meta.env.VITE_PUBLIC_URL ?? (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/+$/, "");
