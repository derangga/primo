import type { AreaId, CommodityId, IsoDate } from "@primo/contract/schemas";
import type { RangeDays } from "@primo/contract/window";
import { Effect, Layer, Schema } from "effect";
import { keepPreviousData } from "@tanstack/react-query";
import { createEffectQuery } from "effect-query/react";
import { FetchHttpClient, HttpClient } from "effect/http";
import { ApiClient } from "~/api-client";
import { ProvinceOutlines } from "~/provinces";

const eq = createEffectQuery(Layer.mergeAll(ApiClient.layer, FetchHttpClient.layer));

const oneHour = 60 * 60 * 1000;

// The data changes once a day, so an hour-old answer is fresh enough and a failure gets one retry.
export const datesOptions = eq.queryOptions({
  queryKey: ["dates"],
  queryFn: () =>
    Effect.gen(function* () {
      const client = yield* ApiClient;

      return yield* client.prices.dates();
    }),
  staleTime: oneHour,
  retry: 1,
});

// The same answer for a commodity and a date until the next daily run, so it is fresh for the hour too.
// Without a date the query is disabled, which is while the list of dates loads: the Effect never runs.
export const snapshotOptions = (commodityId: CommodityId, date: IsoDate | undefined) =>
  eq.queryOptions({
    queryKey: ["snapshot", commodityId, date],
    queryFn: () =>
      date === undefined
        ? Effect.never
        : Effect.gen(function* () {
            const client = yield* ApiClient;

            return yield* client.prices.snapshot({ query: { commodityId, date } });
          }),
    enabled: date !== undefined,
    staleTime: oneHour,
    retry: 1,
    // A new commodity or date keeps the old map on screen, dimmed, until its snapshot arrives.
    placeholderData: keepPreviousData,
  });

// The province outlines are a static file of the website, so they never go stale.
export const provincesOptions = eq.queryOptions({
  queryKey: ["provinces"],
  queryFn: () =>
    Effect.gen(function* () {
      const response = yield* HttpClient.get("/provinces.json");
      const body = yield* response.json;

      return yield* Schema.decodeUnknownEffect(ProvinceOutlines)(body);
    }),
  staleTime: Infinity,
  retry: 1,
});

// One commodity in one area over the last `days`. It comes back with the range it was asked for,
// because a refetch keeps the old answer on screen and the chart must draw it with its own range.
export const seriesOptions = (commodityId: CommodityId, areaId: AreaId, days: RangeDays) =>
  eq.queryOptions({
    queryKey: ["series", commodityId, areaId, days],
    queryFn: () =>
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const points = yield* client.prices.series({ query: { commodityId, areaId, days } });

        return { days, points };
      }),
    staleTime: oneHour,
    retry: 1,
    placeholderData: keepPreviousData,
  });
