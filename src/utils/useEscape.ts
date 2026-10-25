import { useEffect, useRef } from "react";

/* Escape closes only the topmost open window (a sheet over the card deck closes first). */
const escapeStack: { current: () => void }[] = [];
if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && escapeStack.length) escapeStack[escapeStack.length - 1].current();
  });
}
export function useEscape(active: boolean, onClose: () => void) {
  const ref = useRef(onClose);
  useEffect(() => { ref.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!active) return;
    const entry = { current: () => ref.current() };
    escapeStack.push(entry);
    return () => { escapeStack.splice(escapeStack.indexOf(entry), 1); };
  }, [active]);
}
