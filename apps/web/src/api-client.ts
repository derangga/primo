import { PricesApi } from "@primo/contract/api";
import { Context, Layer } from "effect";
import { FetchHttpClient, HttpClient, HttpClientRequest } from "effect/http";
import { HttpApiClient } from "effect/http-api";

// The browser's only way to the backend. Every method, parameter, response and error comes from the
// contract, and responses are decoded against the same schemas the backend encodes with.
export class ApiClient extends Context.Service<ApiClient, HttpApiClient.ForApi<typeof PricesApi>>()(
  "primo/ApiClient",
) {
  static readonly layer = Layer.effect(
    ApiClient,
    HttpApiClient.make(PricesApi, {
      transformClient: HttpClient.mapRequest(
        HttpClientRequest.prependUrl(import.meta.env.VITE_API_URL),
      ),
    }),
  ).pipe(Layer.provide(FetchHttpClient.layer));
}
