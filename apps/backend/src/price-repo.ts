import { IsoDate } from "@primo/contract/schemas";
import { Context, Effect, Layer, Schedule, Schema } from "effect";
import { SqlClient } from "effect/sql/SqlClient";
import type { PriceRow } from "./pihps.ts";

// What D1 reports for a write. rows_written is what the Free plan's 100,000 a day counts.
const decodeWriteResult = Schema.decodeUnknownEffect(
  Schema.Struct({ meta: Schema.Struct({ rows_written: Schema.Number }) }),
);

const decodeDates = Schema.decodeUnknownEffect(Schema.Array(Schema.Struct({ date: IsoDate })));

export class PriceRepo extends Context.Service<PriceRepo>()("PriceRepo", {
  make: Effect.gen(function* () {
    const sql = yield* SqlClient;

    // One statement and one bound parameter for the whole batch: D1 caps a statement at 100
    // parameters and a run at 50 queries (docs/adr/0004). The WHERE on DO UPDATE skips unchanged rows.
    // Returns the rows D1 counted as written.
    const upsert = Effect.fn("PriceRepo.upsert")(
      function* (rows: ReadonlyArray<PriceRow>) {
        yield* Effect.annotateCurrentSpan("rows", rows.length);

        const batch = JSON.stringify(
          rows.map((row) => [row.commodityId, row.areaId, row.date, row.price]),
        );

        const result = yield* sql`
          INSERT INTO prices (commodity_id, area_id, date, price)
          SELECT value ->> 0, value ->> 1, value ->> 2, value ->> 3 FROM json_each(${batch}) WHERE true
          ON CONFLICT (commodity_id, area_id, date)
          DO UPDATE SET price = excluded.price WHERE prices.price <> excluded.price
        `.raw;

        const { meta } = yield* decodeWriteResult(result);

        return meta.rows_written;
      },
      // D1 always reports meta.rows_written; another shape is a bug in this client, not a D1 failure.
      (effect) => effect.pipe(Effect.catchTag("SchemaError", (error) => Effect.die(error))),
    );

    const prune = Effect.fn("PriceRepo.prune")(function* (before: IsoDate) {
      yield* sql`DELETE FROM prices WHERE date < ${before}`;
    });

    // Every date that has prices, oldest first. Beras at the national level (cat_1, area 0) stands for the
    // whole run, and the WHERE keeps the read to the primary key's range: a bare max(date) would scan every row.
    const dates = Effect.fn("PriceRepo.dates")(
      function* () {
        const rows = yield* sql`
          SELECT date FROM prices WHERE commodity_id = 'cat_1' AND area_id = 0 ORDER BY date
        `;

        const decoded = yield* decodeDates(rows);

        return decoded.map((row) => row.date);
      },
      // Dates in the table were written through IsoDate, so another shape is a bug here, not a D1 failure.
      (effect) => effect.pipe(Effect.catchTag("SchemaError", (error) => Effect.die(error))),
    );

    return { upsert, prune, dates };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);

  // For the backfill, which has no subrequest cap: one statement per area, because 90 days of all
  // 35 areas is about 2 MB of JSON, past D1's limit on one string. Each area is about 60 KB.
  // A failed statement is retried, since rerunning the whole load would spend the day's write budget.
  static readonly layerPerArea = Layer.effect(
    this,
    Effect.map(this.make, (repo) =>
      PriceRepo.of({
        ...repo,
        upsert: (rows) =>
          Effect.forEach(Map.groupBy(rows, (row) => row.areaId).values(), (area) =>
            repo
              .upsert(area)
              .pipe(Effect.retry({ times: 2, schedule: Schedule.exponential("1 second") })),
          ).pipe(Effect.map((written) => written.reduce((sum, rows) => sum + rows, 0))),
      }),
    ),
  );
}
