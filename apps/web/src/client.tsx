import { StartClient } from "@tanstack/react-start/client";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";

// The prerendered HTML is the whole page, so it paints first: a timeout queued from a frame
// callback runs after that frame is drawn. Hydrating sooner holds the first paint behind it.
requestAnimationFrame(() => {
  setTimeout(() => {
    startTransition(() => {
      hydrateRoot(
        document,
        <StrictMode>
          <StartClient />
        </StrictMode>,
      );
    });
  });
});
