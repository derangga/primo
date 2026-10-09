import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";
import Backend from "./apps/backend/src/worker.ts";

export default Alchemy.Stack(
  "Primo",
  { providers: Cloudflare.providers(), state: Cloudflare.state() },
  Effect.gen(function* () {
    const backend = yield* Backend;

    const website = yield* Cloudflare.Website.Vite("Website", {
      name: "primo",
      domain: "primo.rangga.site",
      rootDir: "apps/web",
      // Inlined into the website bundle at build time as import.meta.env.VITE_API_URL.
      env: { VITE_API_URL: backend.url.as<string>() },
      // The router's URLs have no trailing slash, so /chart must be served without a redirect to /chart/.
      assets: { htmlHandling: "drop-trailing-slash" },
    });

    return { apiUrl: backend.url, websiteUrl: website.url };
  }),
);
