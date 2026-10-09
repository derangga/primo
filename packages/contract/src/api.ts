import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { StorageUnavailable } from "./errors.ts";
import { DatesResponse } from "./schemas.ts";

// The only thing the backend and the website share. The backend implements it and the website
// derives its client from it, so neither redeclares a request, a response or an error.
export class PricesApi extends HttpApi.make("PricesApi").add(
  HttpApiGroup.make("prices").add(
    HttpApiEndpoint.get("dates", "/dates", { success: DatesResponse, error: StorageUnavailable }),
  ),
) {}
