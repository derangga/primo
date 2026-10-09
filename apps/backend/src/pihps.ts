import { categories, variants } from "@primo/contract/reference";
import { AreaId, type CommodityId, IsoDate, Rupiah } from "@primo/contract/schemas";
import { Context, type Duration, Effect, Layer, Schema, SchemaTransformation } from "effect";
import * as HttpClient from "effect/http/HttpClient";

// The only place that knows PIHPS's response format. .FINDINGS.md "Price endpoint to use" has every quirk.
const gridUrl = "https://www.bi.go.id/hargapangan/WebSite/TabelHarga/GetGridDataDaerah";

export type PriceRow = {
  readonly date: IsoDate;
  readonly areaId: AreaId;
  readonly commodityId: CommodityId;
  readonly price: Rupiah;
};

// Network failure, timeout or a non-2xx status.
export class PihpsUnreachable extends Schema.TaggedError<PihpsUnreachable>()("PihpsUnreachable", {
  areaId: AreaId,
  cause: Schema.String,
}) {}

// The body is not the shape this module expects: BI changed its response.
export class PihpsMalformed extends Schema.TaggedError<PihpsMalformed>()("PihpsMalformed", {
  areaId: AreaId,
  issue: Schema.String,
}) {}

// "01/10/2026" decodes to "2026-10-01"; 31/02/2026 fails as IsoDate.
const DateKey = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^\d{2}\/\d{2}\/\d{4}$/)),
  Schema.decodeTo(
    IsoDate,
    SchemaTransformation.transform({
      decode: (key: string) => `${key.slice(6)}-${key.slice(3, 5)}-${key.slice(0, 2)}`,
      encode: (date: string) => `${date.slice(8)}/${date.slice(5, 7)}/${date.slice(0, 4)}`,
    }),
  ),
);

// "16,400" decodes to 16400.
const Price = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^\d{1,3}(,\d{3})*$/)),
  Schema.decodeTo(
    Rupiah,
    SchemaTransformation.transform({
      decode: (text: string) => Number(text.replaceAll(",", "")),
      encode: (price: number) => price.toLocaleString("en-US"),
    }),
  ),
);

// Every key besides no, name and level is a date. Excess keys are rejected at decode, so a renamed
// date format fails loudly instead of decoding to zero prices.
const GridRow = Schema.StructWithRest(
  Schema.Struct({
    no: Schema.Union([Schema.String, Schema.Number]),
    name: Schema.String,
    level: Schema.Literals([1, 2]),
  }),
  [Schema.Record(DateKey, Schema.Union([Schema.Literal("-"), Price]))],
);

const decodeGrid = Schema.decodeUnknownEffect(
  Schema.fromJsonString(Schema.Struct({ data: Schema.Array(GridRow) })),
);

// Level 1 is a category average and level 2 a variant; the key needs both because names alone may repeat.
const commodityKey = (level: 1 | 2, name: string) => `${level}:${name.trim()}`;

const commodityIds = new Map<string, CommodityId>([
  ...categories.map((category) => [commodityKey(1, category.name), category.id] as const),
  ...variants.map((variant) => [commodityKey(2, variant.name), variant.id] as const),
]);

const pivot = (areaId: AreaId, grid: ReadonlyArray<typeof GridRow.Type>) => {
  const rows: Array<PriceRow> = [];
  const unknownNames: Array<string> = [];

  for (const { no: _no, name, level, ...cells } of grid) {
    const commodityId = commodityIds.get(commodityKey(level, name));

    if (commodityId === undefined) {
      unknownNames.push(name);
      continue;
    }

    for (const [date, price] of Object.entries<Rupiah | "-">(cells)) {
      if (price === "-") {
        continue;
      }

      // SAFETY: GridRow decoded every key outside no, name and level with DateKey, so each is an IsoDate.
      rows.push({ date: date as IsoDate, areaId, commodityId, price });
    }
  }

  return { rows, unknownNames };
};

// How long one fetchArea may take, retries included. The cron keeps 10 s; the backfill's 90-day requests need longer.
export const PihpsTimeout = Context.Reference<Duration.Input>("PihpsTimeout", {
  defaultValue: () => "10 seconds",
});

export class Pihps extends Context.Service<Pihps>()("Pihps", {
  make: Effect.gen(function* () {
    const client = (yield* HttpClient.HttpClient).pipe(HttpClient.filterStatusOk);
    const timeout = yield* PihpsTimeout;

    const fetchArea = Effect.fn("Pihps.fetchArea")(
      function* (areaId: AreaId, from: IsoDate, to: IsoDate) {
        yield* Effect.annotateCurrentSpan("areaId", areaId);

        const response = yield* client.get(gridUrl, {
          urlParams: {
            price_type_id: "1",
            comcat_id: "",
            province_id: areaId === 0 ? "" : String(areaId),
            regency_id: "",
            market_id: "",
            tipe_laporan: "1",
            start_date: from,
            end_date: to,
          },
        });

        const grid = yield* decodeGrid(yield* response.text, { onExcessProperty: "error" });
        const { rows, unknownNames } = pivot(areaId, grid.data);

        if (unknownNames.length > 0) {
          yield* Effect.logWarning(
            "PIHPS sent commodities not in reference.ts; their rows were skipped",
            {
              areaId,
              names: unknownNames,
            },
          );
        }

        return rows;
      },
      (effect, areaId) =>
        effect.pipe(
          Effect.timeout(timeout),
          Effect.catchTags({
            HttpClientError: (error) =>
              new PihpsUnreachable({
                areaId,
                cause:
                  error.cause === undefined
                    ? error.message
                    : `${error.message}: ${String(error.cause)}`,
              }),
            TimeoutError: (error) => new PihpsUnreachable({ areaId, cause: error.message }),
            SchemaError: (error) => new PihpsMalformed({ areaId, issue: error.message }),
          }),
        ),
    );

    return { fetchArea };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
