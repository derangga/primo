import { PricesApi } from "@primo/contract/api";
import { Effect, Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/http";
import { HttpApiBuilder } from "effect/http-api";
import { PriceRepo } from "./price-repo.ts";
import { hideStorageFailure } from "./storage.ts";

export const PricesHandlers = HttpApiBuilder.group(
  PricesApi,
  "prices",
  Effect.fnUntraced(function* (handlers) {
    const repo = yield* PriceRepo;

    return handlers.handle("dates", () =>
      repo.dates().pipe(
        Effect.map((dates) => ({ dates })),
        hideStorageFailure,
      ),
    );
  }),
);

// The routes the Worker serves. The API is public, read-only data with no credentials, so any
// origin may call it (docs/adr/0001).
export const ApiRoutes = Layer.mergeAll(HttpApiBuilder.layer(PricesApi), HttpRouter.cors()).pipe(
  Layer.provide(PricesHandlers),
  Layer.provide(HttpServer.layerServices),
);
