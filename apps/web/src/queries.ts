import { Effect } from "effect";
import { createEffectQuery } from "effect-query/react";
import { ApiClient } from "~/api-client";

const eq = createEffectQuery(ApiClient.layer);

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
