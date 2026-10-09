import { provinces } from "@primo/contract/reference";
import { AreaId, IsoDate } from "@primo/contract/schemas";
import { Effect, Schema } from "effect";
import { Pihps } from "./pihps.ts";
import { PriceRepo } from "./price-repo.ts";

// The cron and the backfill run this same program; only the window and the layers behind it differ.

export const areas: ReadonlyArray<AreaId> = [0, ...provinces.map((province) => province.id)].map(
  (id) => AreaId.make(id),
);

// Fetch from..to, then delete everything before keepFrom.
export type IngestWindow = {
  readonly from: IsoDate;
  readonly to: IsoDate;
  readonly keepFrom: IsoDate;
};

const retentionDays = 90;

const dayMs = 24 * 60 * 60 * 1000;

const daysBefore = (now: Date, days: number) =>
  IsoDate.make(new Date(now.getTime() - days * dayMs).toISOString().slice(0, 10));

// The last `fetchDays` days up to `now` (UTC), keeping the last 90. The cron fetches 7, the backfill 90.
export const windowEnding = (now: Date, fetchDays: number): IngestWindow => ({
  from: daysBefore(now, fetchDays),
  to: daysBefore(now, 0),
  keepFrom: daysBefore(now, retentionDays),
});

export type IngestReport = {
  readonly areasOk: number;
  readonly areasFailed: ReadonlyArray<AreaId>;
  readonly rows: number;
  readonly rowsWritten: number;
};

// Every area failed in one run: BI is down or blocking Cloudflare.
export class IngestFailed extends Schema.TaggedError<IngestFailed>()("IngestFailed", {
  failedAreas: Schema.Array(AreaId),
}) {}

export const ingest = Effect.fn("ingest")(function* (window: IngestWindow) {
  const pihps = yield* Pihps;
  const repo = yield* PriceRepo;

  // A failed area is skipped, not retried: the next run refetches the same days (docs/adr/0004).
  const [fetched, failures] = yield* Effect.partition(
    areas,
    (areaId) => pihps.fetchArea(areaId, window.from, window.to),
    {
      concurrency: 5,
    },
  );

  yield* Effect.forEach(failures, (error) => Effect.logWarning("skipped an area", error), {
    discard: true,
  });

  const failedAreas = failures.map((error) => error.areaId);

  if (fetched.length === 0) {
    return yield* new IngestFailed({ failedAreas });
  }

  const rows = fetched.flat();

  const rowsWritten = yield* repo.upsert(rows);

  yield* repo.prune(window.keepFrom).pipe(
    // escape hatch: the prices are stored; old rows cost nothing for one more day
    Effect.catchTag("SqlError", (error) => Effect.logWarning("prune failed", error)),
  );

  const report: IngestReport = {
    areasOk: fetched.length,
    areasFailed: failedAreas,
    rows: rows.length,
    rowsWritten,
  };

  yield* Effect.log("ingest finished", report);

  return report;
});
