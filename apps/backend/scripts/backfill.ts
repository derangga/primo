import * as BunRuntime from "@effect/platform-bun/BunRuntime";
import * as D1Client from "@effect/sql-d1/D1Client";
import { Clock, Config, Effect, Layer, Redacted, Schema } from "effect";
import * as FetchHttpClient from "effect/http/FetchHttpClient";
import * as HttpClient from "effect/http/HttpClient";
import { ingest, windowEnding } from "../src/ingest.ts";
import { Pihps, PihpsTimeout } from "../src/pihps.ts";
import { PriceRepo } from "../src/price-repo.ts";

// Loads the last 90 days for all 35 areas into the remote D1. Run it once, before the first cron:
//   bun run backfill
// with CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_TOKEN (D1 edit) and PRIMO_D1_DATABASE_ID in the environment.
// The load writes about 70,000 rows of D1 Free's 100,000 a day, so check the day's writes before a rerun.

// A failed request answers `result: null`, so result is nullable and errors carries the reason.
const D1RestResponse = Schema.Struct({
  success: Schema.Boolean,
  errors: Schema.Array(Schema.Struct({ message: Schema.String })),
  result: Schema.NullOr(
    Schema.Array(
      Schema.Struct({
        results: Schema.Array(Schema.Record(Schema.String, Schema.Unknown)),
        meta: Schema.Struct({ rows_written: Schema.Number }),
      }),
    ),
  ),
});

// D1's REST API refused the statement: a bad token, a wrong database id, or a SQL error.
class D1QueryRejected extends Schema.TaggedError<D1QueryRejected>()("D1QueryRejected", {
  status: Schema.Number,
  message: Schema.String,
}) {}

// D1 accepted the request but sent no result for the one statement in it.
class D1ResultMissing extends Schema.TaggedError<D1ResultMissing>()("D1ResultMissing", {
  message: Schema.String,
}) {}

// A D1 binding over Cloudflare's REST API, implementing only what D1Client calls. It sends one
// statement per request and passes D1's result through, meta included. Its methods must return
// Promises, so failures are thrown; D1Client turns each into a SqlError that keeps it as the cause.
const restD1 = (accountId: string, databaseId: string, token: Redacted.Redacted) => {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  const query = async (sql: string, params: ReadonlyArray<unknown>) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${Redacted.value(token)}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    });

    const body = Schema.decodeUnknownSync(D1RestResponse)(await response.json());

    if (!response.ok || !body.success) {
      throw new D1QueryRejected({
        status: response.status,
        message: body.errors.map((error) => error.message).join("; "),
      });
    }

    const [statement] = body.result ?? [];

    if (statement === undefined) {
      throw new D1ResultMissing({ message: `no result for: ${sql}` });
    }

    return statement;
  };

  const binding = {
    prepare: (sql: string) => ({
      bind: (...params: ReadonlyArray<unknown>) => ({
        all: () => query(sql, params).then((statement) => ({ ...statement, success: true })),
        raw: () =>
          query(sql, params).then((statement) =>
            statement.results.map((row) => Object.values(row)),
          ),
      }),
    }),
  };

  // SAFETY: D1Client only calls prepare, bind, all and raw, which binding implements over the REST API.
  const db = binding as D1Client.D1ClientConfig["db"];

  return D1Client.layer({ db });
};

const program = Effect.gen(function* () {
  const accountId = yield* Config.String("CLOUDFLARE_ACCOUNT_ID");
  const token = yield* Config.Redacted("CLOUDFLARE_D1_TOKEN");
  const databaseId = yield* Config.String("PRIMO_D1_DATABASE_ID");

  const d1 = restD1(accountId, databaseId, token);

  // PIHPS from a local machine: retry transient failures (Bun's TLS check of bi.go.id fails now and
  // then) and allow 60 s, since a 90-day request takes about 4.5 s.
  const pihps = Pihps.layer.pipe(
    Layer.provide([
      Layer.effect(
        HttpClient.HttpClient,
        Effect.map(HttpClient.HttpClient, HttpClient.retryTransient({ times: 3 })),
      ).pipe(Layer.provide(FetchHttpClient.layer)),
      Layer.succeed(PihpsTimeout, "60 seconds"),
    ]),
  );

  const now = yield* Clock.currentTimeMillis;

  const report = yield* ingest(windowEnding(new Date(now), 90)).pipe(
    Effect.provide(Layer.mergeAll(pihps, PriceRepo.layerPerArea.pipe(Layer.provide(d1)))),
  );

  yield* Effect.log("backfill finished", report);
});

BunRuntime.runMain(program);
