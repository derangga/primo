import { AreaId, IsoDate, Rupiah } from "@primo/contract/schemas";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import type { PriceRow } from "../src/pihps.ts";
import { PriceRepo } from "../src/price-repo.ts";
import { makeFakeD1 } from "./support/fake-d1.ts";

const row = (date: string, price: number): PriceRow => ({
  date: IsoDate.make(date),
  areaId: AreaId.make(13),
  commodityId: "cat_1",
  price: Rupiah.make(price),
});

const withRepo = () => {
  const d1 = makeFakeD1();

  return { ...d1, layer: PriceRepo.layer.pipe(Layer.provide(d1.layer)) };
};

const stored = (sqlite: ReturnType<typeof makeFakeD1>["sqlite"]) =>
  sqlite.prepare("SELECT commodity_id, area_id, date, price FROM prices ORDER BY date").all();

describe("prices table", () => {
  it("has the primary key (commodity_id, area_id, date) and no other index", () => {
    const { sqlite } = makeFakeD1();

    const keyColumns = sqlite
      .prepare("SELECT name FROM pragma_table_info('prices') WHERE pk > 0 ORDER BY pk")
      .all()
      .map((column) => column["name"]);

    const indexes = sqlite.prepare("SELECT name, origin FROM pragma_index_list('prices')").all();

    assert.deepStrictEqual(keyColumns, ["commodity_id", "area_id", "date"]);
    assert.isTrue(indexes.every((index) => index["origin"] === "pk"));
    assert.lengthOf(sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all(), 0);
  });
});

describe("PriceRepo", () => {
  it.effect("storing the same rows twice leaves one copy of each", () => {
    const { sqlite, queries, layer } = withRepo();

    return Effect.gen(function* () {
      const repo = yield* PriceRepo;
      const rows = [row("2026-10-06", 16_950), row("2026-10-07", 16_950)];

      const first = yield* repo.upsert(rows);
      const second = yield* repo.upsert(rows);

      assert.lengthOf(stored(sqlite), 2);
      assert.strictEqual(first, 2);
      assert.strictEqual(second, 0, "an unchanged row is not written again");
      assert.lengthOf(queries, 2);
    }).pipe(Effect.provide(layer));
  });

  it.effect("storing a row whose price changed updates it", () => {
    const { sqlite, layer } = withRepo();

    return Effect.gen(function* () {
      const repo = yield* PriceRepo;

      yield* repo.upsert([row("2026-10-07", 16_950)]);
      const written = yield* repo.upsert([row("2026-10-07", 17_100)]);

      assert.strictEqual(written, 1);

      assert.deepStrictEqual(
        stored(sqlite).map((price) => ({ ...price })),
        [{ commodity_id: "cat_1", area_id: 13, date: "2026-10-07", price: 17_100 }],
      );
    }).pipe(Effect.provide(layer));
  });

  it.effect("prune removes rows before the cutoff and keeps rows on or after it", () => {
    const { sqlite, layer } = withRepo();

    return Effect.gen(function* () {
      const repo = yield* PriceRepo;

      yield* repo.upsert([row("2026-07-09", 1), row("2026-07-10", 2), row("2026-07-11", 3)]);
      yield* repo.prune(IsoDate.make("2026-07-10"));

      assert.deepStrictEqual(
        stored(sqlite).map((price) => price["date"]),
        ["2026-07-10", "2026-07-11"],
      );
    }).pipe(Effect.provide(layer));
  });

  it.effect("the backfill's layer writes one statement per area", () => {
    const { sqlite, queries, layer } = makeFakeD1();

    return Effect.gen(function* () {
      const repo = yield* PriceRepo;

      const written = yield* repo.upsert([
        row("2026-10-07", 1),
        { ...row("2026-10-07", 2), areaId: AreaId.make(0) },
        { ...row("2026-10-06", 3), areaId: AreaId.make(0) },
        { ...row("2026-10-07", 4), areaId: AreaId.make(34) },
      ]);

      assert.lengthOf(queries, 3);
      assert.lengthOf(stored(sqlite), 4);
      assert.strictEqual(written, 4);
    }).pipe(Effect.provide(PriceRepo.layerPerArea.pipe(Layer.provide(layer))));
  });
});
