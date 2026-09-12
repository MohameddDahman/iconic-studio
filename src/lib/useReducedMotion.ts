import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(notify: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
}

/** True when the visitor has asked for reduced motion. Always false during SSR. */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
