import { useSyncExternalStore } from "react";

// Whether a media query matches, kept current as the window changes. The server and the first client
// render say false, so a prerendered page and its hydration agree; the real answer follows at once.
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const list = matchMedia(query);

      list.addEventListener("change", notify);

      return () => list.removeEventListener("change", notify);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}
