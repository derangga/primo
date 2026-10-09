import { type AreaId, IsoDate, Rupiah } from "@primo/contract/schemas";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Layer, Logger } from "effect";
import { areas, ingest, IngestFailed, windowEnding } from "../src/ingest.ts";
import { Pihps, PihpsUnreachable } from "../src/pihps.ts";
import { PriceRepo } from "../src/price-repo.ts";
import { makeFakeD1 } from "./support/fake-d1.ts";

const window = {
  from: IsoDate.make("2026-10-01"),
  to: IsoDate.make("2026-10-07"),
  keepFrom: IsoDate.make("2026-07-09"),
};

// PIHPS answers with two prices per area, except for the areas in `failing`.
const setUp = (failing: ReadonlySet<AreaId>, failingStatement?: RegExp) => {
  const d1 = makeFakeD1(failingStatement);
  const requests: Array<AreaId> = [];
  const warnings: Array<unknown> = [];

  const pihps = Layer.succeed(
    Pihps,
    Pihps.of({
      fetchArea: (areaId) => {
        requests.push(areaId);

        if (failing.has(areaId)) {
          return Effect.fail(new PihpsUnreachable({ areaId, cause: "test" }));
        }

        return Effect.succeed([
          {
            date: IsoDate.make("2026-10-06"),
            areaId,
            commodityId: "cat_1" as const,
            price: Rupiah.make(16_950),
          },
          {
            date: IsoDate.make("2026-10-07"),
            areaId,
            commodityId: "cat_1" as const,
            price: Rupiah.make(17_000),
          },
        ]);
      },
    }),
  );

  const layer = Layer.mergeAll(
    pihps,
    PriceRepo.layer.pipe(Layer.provide(d1.layer)),
    Logger.layer([Logger.make(({ message }) => warnings.push(message))]),
  );

  return { ...d1, requests, warnings, layer };
};

const storedCount = (sqlite: ReturnType<typeof makeFakeD1>["sqlite"]) =>
  sqlite.prepare("SELECT count(*) AS n FROM prices").get()?.["n"];

describe("ingest", () => {
  it.effect("stores the areas that answered and reports the ones that failed", () => {
    const failing = new Set([areas[0], areas[5]].filter((areaId) => areaId !== undefined));
    const { sqlite, queries, requests, layer } = setUp(failing);

    return Effect.gen(function* () {
      const report = yield* ingest(window);

      assert.strictEqual(report.areasOk, 33);
      assert.sameMembers([...report.areasFailed], [...failing]);
      assert.strictEqual(report.rows, 66);
      assert.strictEqual(report.rowsWritten, 66);
      assert.strictEqual(storedCount(sqlite), 66);
      assert.isAtMost(requests.length, 35);
      assert.isAtMost(queries.length, 2);
    }).pipe(Effect.provide(layer));
  });

  it.effect("fails with IngestFailed when every area fails, and touches no table", () => {
    const { queries, layer } = setUp(new Set(areas));

    return Effect.gen(function* () {
      const error = yield* Effect.flip(ingest(window));

      assert.instanceOf(error, IngestFailed);
      assert.lengthOf(error.failedAreas, 35);
      assert.lengthOf(queries, 0);
    }).pipe(Effect.provide(layer));
  });

  it.effect("logs a failed prune and still succeeds", () => {
    const { sqlite, warnings, layer } = setUp(new Set(), /DELETE/);

    return Effect.gen(function* () {
      const report = yield* ingest(window);

      assert.strictEqual(report.areasOk, 35);
      assert.strictEqual(storedCount(sqlite), 70);
      assert.include(JSON.stringify(warnings), "prune failed");
    }).pipe(Effect.provide(layer));
  });

  it.effect("fails the run when the upsert fails", () => {
    const { layer } = setUp(new Set(), /INSERT/);

    return Effect.gen(function* () {
      const error = yield* Effect.flip(ingest(window));

      assert.strictEqual(error._tag, "SqlError");
    }).pipe(Effect.provide(layer));
  });

  it("the cron's window fetches the last 7 days and keeps the last 90", () => {
    assert.deepStrictEqual(windowEnding(new Date("2026-10-08T01:00:00Z"), 7), {
      from: "2026-10-01",
      to: "2026-10-08",
      keepFrom: "2026-07-10",
    });
  });
});
