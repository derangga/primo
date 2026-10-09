import { Schema } from "effect";
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { StorageUnavailable } from "./errors.ts";
import {
  AreaId,
  CommodityId,
  DatesResponse,
  Days,
  IsoDate,
  SeriesPoint,
  Snapshot,
} from "./schemas.ts";

// The only thing the backend and the website share. The backend implements it and the website
// derives its client from it, so neither redeclares a request, a response or an error.
export class PricesApi extends HttpApi.make("PricesApi").add(
  HttpApiGroup.make("prices")
    .add(
      HttpApiEndpoint.get("dates", "/dates", { success: DatesResponse, error: StorageUnavailable }),
    )
    .add(
      HttpApiEndpoint.get("snapshot", "/snapshot", {
        query: Schema.Struct({ commodityId: CommodityId, date: IsoDate }),
        success: Snapshot,
        error: StorageUnavailable,
      }),
    )
    .add(
      HttpApiEndpoint.get("series", "/series", {
        query: Schema.Struct({
          commodityId: CommodityId,
          areaId: Schema.NumberFromString.pipe(Schema.decodeTo(AreaId)),
          days: Days,
        }),
        success: Schema.Array(SeriesPoint),
        error: StorageUnavailable,
      }),
    ),
) {}
