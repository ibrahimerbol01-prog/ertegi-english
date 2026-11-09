/* Research build (R4): no wordbank. vite.config.ts swaps WordbankScreen.tsx
   for this file, so the research build carries neither the screen nor the
   word lists (a dynamic import in a dead branch would still emit their chunks). */
export default function WordbankScreen(): null {
  return null;
}
