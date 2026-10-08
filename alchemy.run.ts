import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";
import Backend from "./apps/backend/src/worker.ts";

export default Alchemy.Stack(
  "Primo",
  { providers: Cloudflare.providers(), state: Cloudflare.state() },
  Effect.gen(function* () {
    const backend = yield* Backend;

    return { apiUrl: backend.url };
  }),
);
