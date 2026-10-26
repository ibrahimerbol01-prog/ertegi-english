import { useEffect, useRef } from "react";

/* Keyboard focus for a modal window: moves into it on open, Tab and
   Shift+Tab stay inside it, and on close focus goes back to whatever opened
   it (if that is still on the page). */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialogFocus<T extends HTMLElement>(open: boolean) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const box = ref.current;
    if (!box) return;
    // The window's title if it has one, else the window itself; not the close
    // button, so a screen reader starts with what the window is about.
    const start = box.querySelector<HTMLElement>("h1, h2, h3") ?? box;
    if (!start.hasAttribute("tabindex")) start.setAttribute("tabindex", "-1");
    start.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const inside = box.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !inside)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // Back to the opener; if it is gone (a removed row), the window's caller decides.
      if (opener && opener.isConnected && opener !== document.body) setTimeout(() => opener.focus({ preventScroll: true }), 0);
    };
  }, [open]);
  return ref;
}
