import { assert, describe, it } from "@effect/vitest";
import { AreaId, IsoDate, Rupiah } from "@primo/contract/schemas";
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
