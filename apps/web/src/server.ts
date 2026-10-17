import handler from "@tanstack/react-start/server-entry";
import { paraglideMiddleware } from "./paraglide/server.js";

// Cloudflare serves the built HTML as static files, so this handler only runs while the build
// prerenders each locale's page. The middleware sets the locale a request's URL names. The router's
// own rewrite localizes URLs, so the handler gets the original request, not the middleware's copy.
export default {
  fetch: (request: Request) => paraglideMiddleware(request, () => handler.fetch(request)),
};
