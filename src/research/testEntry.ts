import { lazy } from "react";

/* R5: the test screen, a chunk of its own. The ordinary build swaps this file
   for testEntry.off.ts (alias in vite.config.ts): a dynamic import in a dead
   branch would still emit the chunk, and the PWA would precache it. */
export const TestScreen = lazy(() => import("./test/TestScreen"));
