/* Research build (R4): no profile editor. vite.config.ts swaps ProfileEditor.tsx
   for this file, so the research build carries neither the editor nor its texts'
   logic, and the study's conditions stay the same for every group. */
export default function ProfileEditor(): null {
  return null;
}
