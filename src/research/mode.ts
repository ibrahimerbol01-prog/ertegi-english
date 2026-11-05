/* R4: the research build. One code base, two Vercel projects: the ordinary
   site, and a frozen study site built with VITE_RESEARCH_MODE=1
   (docs/research-build.md). The flag is fixed at build time (vite.config.ts
   defines __ERTEGI_RESEARCH__ as the literal true or false), so `if (RESEARCH_MODE)` folds away and the
   ordinary build carries none of the research code. */

export const RESEARCH_MODE: boolean = __ERTEGI_RESEARCH__;

/** Study id stamped on every event of the research build, e.g. "ertegi-stage0-2027". */
export const STUDY_ID: string = import.meta.env.VITE_STUDY_ID || "";
