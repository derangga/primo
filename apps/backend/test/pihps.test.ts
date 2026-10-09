import { AreaId, IsoDate } from "@primo/contract/schemas";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Layer, Logger } from "effect";
import * as HttpClient from "effect/http/HttpClient";
import { HttpClientError, TransportError } from "effect/http/HttpClientError";
import * as HttpClientResponse from "effect/http/HttpClientResponse";
import { readFileSync } from "node:fs";
import { Pihps, PihpsMalformed, PihpsUnreachable } from "../src/pihps.ts";

// DKI Jakarta (13), 2026-10-01 to 2026-10-08, saved from PIHPS on 2026-10-08: 31 commodities x 6 weekdays.
const fixture = readFileSync(new URL("fixtures/grid-dki-7d.json", import.meta.url), "utf8");

const dki = AreaId.make(13);

const from = IsoDate.make("2026-10-01");

const to = IsoDate.make("2026-10-08");

const serving = (body: string, status: number) =>
  Pihps.layer.pipe(
    Layer.provide(
      Layer.succeed(
        HttpClient.HttpClient,
        HttpClient.make((request) =>
          Effect.succeed(HttpClientResponse.fromWeb(request, new Response(body, { status }))),
        ),
      ),
    ),
  );

const fetchDki = Effect.gen(function* () {
  const pihps = yield* Pihps;

  return yield* pihps.fetchArea(dki, from, to);
});

const priceOf = (
  rows: ReadonlyArray<{ commodityId: string; date: string; price: number }>,
  commodityId: string,
  date: string,
) => rows.find((row) => row.commodityId === commodityId && row.date === date)?.price;

describe("Pihps.fetchArea", () => {
  it.effect("decodes the saved DKI response into one row per commodity and weekday", () =>
    Effect.gen(function* () {
      const rows = yield* fetchDki;

      assert.strictEqual(rows.length, 31 * 6);
      assert.strictEqual(priceOf(rows, "cat_1", "2026-10-07"), 16_950);
      assert.isTrue(rows.every((row) => row.areaId === dki));
    }).pipe(Effect.provide(serving(fixture, 200))),
  );

  it.effect("resolves the commodity whose source name has a trailing space", () =>
    Effect.gen(function* () {
      assert.include(fixture, '"Cabai Merah Keriting "');

      const rows = yield* fetchDki;

      assert.strictEqual(rows.filter((row) => row.commodityId === "com_14").length, 6);
    }).pipe(Effect.provide(serving(fixture, 200))),
  );

  it.effect("produces no row for a dash", () =>
    Effect.gen(function* () {
      const rows = yield* fetchDki;

      assert.strictEqual(rows.length, 31 * 6 - 1);
      assert.isUndefined(priceOf(rows, "cat_1", "2026-10-08"));
    }).pipe(
      Effect.provide(serving(fixture.replace('"08/10/2026":"16,950"', '"08/10/2026":"-"'), 200)),
    ),
  );

  // PIHPS has no category and variant with the same name today, so the case is made by renaming
  // the variant "Daging Ayam Ras Segar" to its category's name "Daging Ayam".
  it.effect("keeps a category and a variant that share a name apart", () =>
    Effect.gen(function* () {
      const rows = yield* fetchDki.pipe(
        Effect.provide(serving(fixture.replace('"Daging Ayam Ras Segar"', '"Daging Ayam"'), 200)),
      );

      assert.strictEqual(rows.filter((row) => row.commodityId === "cat_2").length, 6);
      assert.strictEqual(rows.filter((row) => row.commodityId === "com_7").length, 0);
    }),
  );

  it.effect("skips and logs a commodity it does not know", () =>
    Effect.gen(function* () {
      const warnings: Array<unknown> = [];
      const recording = Logger.layer([Logger.make(({ message }) => warnings.push(message))]);

      const rows = yield* fetchDki.pipe(
        Effect.provide(
          Layer.merge(
            serving(fixture.replace('"Gula Pasir Lokal"', '"Gula Aren"'), 200),
            recording,
          ),
        ),
      );

      assert.strictEqual(rows.length, 31 * 6 - 6);
      assert.include(JSON.stringify(warnings), "Gula Aren");
    }),
  );

  it.effect("fails with PihpsMalformed on a cell that is neither a number nor a dash", () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(fetchDki);

      assert.instanceOf(error, PihpsMalformed);
      assert.strictEqual(error.areaId, dki);
    }).pipe(
      Effect.provide(serving(fixture.replace('"08/10/2026":"16,950"', '"08/10/2026":"n/a"'), 200)),
    ),
  );

  it.effect("fails with PihpsMalformed when the body is not JSON", () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(fetchDki);

      assert.instanceOf(error, PihpsMalformed);
    }).pipe(Effect.provide(serving("<html>blocked</html>", 200))),
  );

  it.effect("fails with PihpsUnreachable on a non-2xx status", () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(fetchDki);

      assert.instanceOf(error, PihpsUnreachable);
    }).pipe(Effect.provide(serving(fixture, 503))),
  );

  it.effect("fails with PihpsUnreachable on a network failure", () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(fetchDki);

      assert.instanceOf(error, PihpsUnreachable);
    }).pipe(
      Effect.provide(
        Pihps.layer.pipe(
          Layer.provide(
            Layer.succeed(
              HttpClient.HttpClient,
              HttpClient.make((request) =>
                Effect.fail(
                  new HttpClientError({
                    reason: new TransportError({ request, description: "connection reset" }),
                  }),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
});
