import * as D1Client from "@effect/sql-d1/D1Client";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect, Layer } from "effect";
import * as FetchHttpClient from "effect/http/FetchHttpClient";
import * as HttpServerResponse from "effect/http/HttpServerResponse";
import { ingest, windowEnding } from "./ingest.ts";
import { Pihps } from "./pihps.ts";
import { PriceRepo } from "./price-repo.ts";

export const Prices = Cloudflare.D1.Database("Prices", {
  name: "primo-prices",
  migrations: "./apps/backend/migrations",
});

// 01:00 UTC is 08:00 WIB.
const dailyAt0800Wib = "0 1 * * *";

export default Cloudflare.Worker(
  "Backend",
  {
    name: "primo-api",
    domain: "primo-api.rangga.site",
    main: import.meta.url,
    compatibility: { date: "2026-10-01" },
    observability: { enabled: true },
  },
  Effect.gen(function* () {
    const prices = yield* Cloudflare.D1.QueryDatabase(yield* Prices);

    const sql = Layer.unwrap(Effect.map(prices.raw, (db) => D1Client.layer({ db })));

    const ingestLayer = Layer.mergeAll(Pihps.layer, PriceRepo.layer).pipe(
      Layer.provide([FetchHttpClient.layer, sql]),
    );

    yield* Cloudflare.Workers.cron(dailyAt0800Wib, (controller) =>
      ingest(windowEnding(new Date(controller.scheduledTime), 7)).pipe(
        Effect.provide(ingestLayer),
        // Alchemy swallows a failed cron handler, failures and defects alike, so they are logged here or nowhere.
        Effect.tapCause((cause) => Effect.logError("ingest failed", cause)),
      ),
    );

    // The prices API is mounted here by a later change.
    return {
      fetch: Effect.succeed(HttpServerResponse.text("primo-api", { status: 404 })),
    };
  }).pipe(
    Effect.provide(
      Layer.mergeAll(Cloudflare.Workers.CronEventSourceLive, Cloudflare.D1.QueryDatabaseBinding),
    ),
  ),
);
