import { useSyncExternalStore } from "react";

/* Whether the browser thinks it has a network. navigator.onLine can say "online"
   on a network without internet, so this only drives an honest hint, never logic. */
const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export const useOnline = () =>
  useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
