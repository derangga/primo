import { assert, describe, it } from "@effect/vitest";
import { AreaId, IsoDate, Rupiah, SeriesPoint, type CommodityId } from "@primo/contract/schemas";
import { StorageUnavailable } from "@primo/contract/errors";
import { Effect, Layer, Schema } from "effect";
import { HttpRouter } from "effect/http";
import { ApiRoutes } from "../src/handlers.ts";
import { PriceRepo } from "../src/price-repo.ts";
import { makeFakeD1 } from "./support/fake-d1.ts";

// The route stack the Worker serves, over a real PriceRepo on a fake D1.
const serve = (failingStatement?: RegExp) => {
  const d1 = makeFakeD1(failingStatement);
  const repo = PriceRepo.layer.pipe(Layer.provide(d1.layer));
  const web = HttpRouter.toWebHandler(ApiRoutes.pipe(Layer.provide(repo)));

  return {
    ...d1,
    repo,
    web,
    request: (path: string) => web.handler(new Request(`http://api${path}`)),
  };
};

const national = (date: string) => ({
  date: IsoDate.make(date),
  areaId: AreaId.make(0),
  commodityId: "cat_1" as const,
  price: Rupiah.make(16_400),
});

describe("GET /dates", () => {
  it.effect("returns the stored dates, newest last, for any origin", () => {
    const { repo, request, web } = serve();

    return Effect.gen(function* () {
      yield* PriceRepo.use((prices) =>
        prices.upsert([national("2026-10-08"), national("2026-10-07")]),
      );

      const response = yield* Effect.promise(() => request("/dates"));

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.headers.get("access-control-allow-origin"), "*");
      assert.deepStrictEqual(yield* Effect.promise(() => response.json()), {
        dates: ["2026-10-07", "2026-10-08"],
      });
    }).pipe(Effect.provide(repo), Effect.ensuring(Effect.promise(() => web.dispose())));
  });

  it.effect("answers a browser's preflight request", () => {
    const { web } = serve();

    return Effect.gen(function* () {
      const response = yield* Effect.promise(() =>
        web.handler(
          new Request("http://api/dates", {
            method: "OPTIONS",
            headers: {
              origin: "https://primo.rangga.site",
              "access-control-request-method": "GET",
            },
          }),
        ),
      );

      assert.strictEqual(response.headers.get("access-control-allow-origin"), "*");
    }).pipe(Effect.ensuring(Effect.promise(() => web.dispose())));
  });

  it.effect("a database failure is a 503 that says nothing about the database", () => {
    const { request, web } = serve(/SELECT date/);

    return Effect.gen(function* () {
      const response = yield* Effect.promise(() => request("/dates"));
      const body = yield* Effect.promise(() => response.text());

      assert.strictEqual(response.status, 503);
      assert.instanceOf(
        yield* Schema.decodeUnknownEffect(StorageUnavailable)(JSON.parse(body)),
        StorageUnavailable,
      );
      assert.deepStrictEqual(Object.keys(JSON.parse(body)), ["_tag"]);
      assert.notInclude(body, "injected failure");
    }).pipe(Effect.ensuring(Effect.promise(() => web.dispose())));
  });
});

const row = (
  areaId: number,
  price: number,
  date = "2026-10-08",
  commodityId: CommodityId = "cat_1",
) => ({
  date: IsoDate.make(date),
  areaId: AreaId.make(areaId),
  commodityId,
  price: Rupiah.make(price),
});

describe("GET /snapshot", () => {
  it.effect("returns one price per province with a row, and the national price", () => {
    const { repo, request, web } = serve();

    return Effect.gen(function* () {
      yield* PriceRepo.use((prices) =>
        prices.upsert([
          row(0, 16_400),
          row(13, 18_000),
          row(16, 15_000),
          row(13, 17_000, "2026-10-07"),
          row(13, 90_000, "2026-10-08", "com_1"),
        ]),
      );

      const response = yield* Effect.promise(() =>
        request("/snapshot?commodityId=cat_1&date=2026-10-08"),
      );

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.headers.get("access-control-allow-origin"), "*");

      const body = yield* Effect.promise(() => response.json());

      assert.deepStrictEqual(body, {
        date: "2026-10-08",
        national: 16_400,
        byArea: [
          { areaId: 13, price: 18_000 },
          { areaId: 16, price: 15_000 },
        ],
      });
    }).pipe(Effect.provide(repo), Effect.ensuring(Effect.promise(() => web.dispose())));
  });

  it.effect("a date with no rows is an empty snapshot with no national price", () => {
    const { request, web } = serve();

    return Effect.gen(function* () {
      const response = yield* Effect.promise(() =>
        request("/snapshot?commodityId=cat_1&date=2026-10-08"),
      );

      assert.deepStrictEqual(yield* Effect.promise(() => response.json()), {
        date: "2026-10-08",
        national: null,
        byArea: [],
      });
    }).pipe(Effect.ensuring(Effect.promise(() => web.dispose())));
  });

  it.effect(
    "rejects a bad commodity, a bad date or a missing parameter with 400 before any query",
    () => {
      const { queries, request, web } = serve();

      return Effect.gen(function* () {
        for (const query of [
          "commodityId=cat_99&date=2026-10-08",
          "commodityId=cat_1&date=2026-02-30",
          "commodityId=cat_1&date=yesterday",
          "commodityId=cat_1",
          "",
        ]) {
          const response = yield* Effect.promise(() => request(`/snapshot?${query}`));

          assert.strictEqual(response.status, 400, query);
        }

        assert.strictEqual(queries.length, 0);
      }).pipe(Effect.ensuring(Effect.promise(() => web.dispose())));
    },
  );

  it.effect("a database failure is a 503", () => {
    const { request, web } = serve(/SELECT area_id/);

    return Effect.gen(function* () {
      const response = yield* Effect.promise(() =>
        request("/snapshot?commodityId=cat_1&date=2026-10-08"),
      );

      assert.strictEqual(response.status, 503);
    }).pipe(Effect.ensuring(Effect.promise(() => web.dispose())));
  });
});

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

describe("GET /series", () => {
  it.effect("returns the stored days of one commodity and area in the range, oldest first", () => {
    const { repo, request, web } = serve();

    return Effect.gen(function* () {
      yield* PriceRepo.use((prices) =>
        prices.upsert([
          row(13, 16_900, daysAgo(0)),
          row(13, 16_800, daysAgo(2)),
          row(13, 16_700, daysAgo(6)),
          // 7 days ending today start 6 days ago, so this one is out of a 7 day range
          row(13, 16_000, daysAgo(7)),
          // another area, another commodity
          row(16, 15_000, daysAgo(1)),
          row(13, 90_000, daysAgo(1), "com_1"),
        ]),
      );

      const week = yield* Effect.promise(() =>
        request("/series?commodityId=cat_1&areaId=13&days=7"),
      );

      assert.strictEqual(week.status, 200);
      assert.strictEqual(week.headers.get("access-control-allow-origin"), "*");
      assert.deepStrictEqual(yield* Effect.promise(() => week.json()), [
        { date: daysAgo(6), price: 16_700 },
        { date: daysAgo(2), price: 16_800 },
        { date: daysAgo(0), price: 16_900 },
      ]);

      const month = yield* Effect.promise(() =>
        request("/series?commodityId=cat_1&areaId=13&days=30"),
      );

      const points = yield* Schema.decodeUnknownEffect(Schema.Array(SeriesPoint))(
        yield* Effect.promise(() => month.json()),
      );

      assert.lengthOf(points, 4);
    }).pipe(Effect.provide(repo), Effect.ensuring(Effect.promise(() => web.dispose())));
  });

  it.effect("serves the national figure as area 0", () => {
    const { repo, request, web } = serve();

    return Effect.gen(function* () {
      yield* PriceRepo.use((prices) => prices.upsert([row(0, 16_400, daysAgo(0))]));

      const response = yield* Effect.promise(() =>
        request("/series?commodityId=cat_1&areaId=0&days=7"),
      );

      assert.deepStrictEqual(yield* Effect.promise(() => response.json()), [
        { date: daysAgo(0), price: 16_400 },
      ]);
    }).pipe(Effect.provide(repo), Effect.ensuring(Effect.promise(() => web.dispose())));
  });

  it.effect(
    "rejects a bad commodity, area, range or a missing parameter with 400 before any query",
    () => {
      const { queries, request, web } = serve();

      return Effect.gen(function* () {
        for (const query of [
          "commodityId=cat_99&areaId=13&days=7",
          "commodityId=cat_1&areaId=35&days=7",
          "commodityId=cat_1&areaId=-1&days=7",
          "commodityId=cat_1&areaId=abc&days=7",
          "commodityId=cat_1&areaId=13&days=14",
          "commodityId=cat_1&areaId=13&days=seven",
          "commodityId=cat_1&areaId=13",
          "",
        ]) {
          const response = yield* Effect.promise(() => request(`/series?${query}`));

          assert.strictEqual(response.status, 400, query);
        }

        assert.strictEqual(queries.length, 0);
      }).pipe(Effect.ensuring(Effect.promise(() => web.dispose())));
    },
  );

  it.effect("a database failure is a 503", () => {
    const { request, web } = serve(/SELECT date, price/);

    return Effect.gen(function* () {
      const response = yield* Effect.promise(() =>
        request("/series?commodityId=cat_1&areaId=13&days=7"),
      );

      assert.strictEqual(response.status, 503);
    }).pipe(Effect.ensuring(Effect.promise(() => web.dispose())));
  });
});
