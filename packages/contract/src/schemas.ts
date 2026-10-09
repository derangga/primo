import { Schema } from "effect";
import { categories, provinces, variants } from "./reference.ts";

const areaIds = new Set<number>([0, ...provinces.map((province) => province.id)]);

// 0 is the national figure, 1..34 are PIHPS province ids.
export const AreaId = Schema.Int.pipe(
  Schema.check(Schema.makeFilter((id: number) => areaIds.has(id))),
  Schema.brand("AreaId"),
);

export type AreaId = typeof AreaId.Type;

export const CommodityId = Schema.Literals([
  ...categories.map((category) => category.id),
  ...variants.map((variant) => variant.id),
]);

export type CommodityId = typeof CommodityId.Type;

// A real calendar day as yyyy-mm-dd: 2026-02-30 fails.
const isCalendarDay = (text: string) => {
  const day = new Date(`${text}T00:00:00Z`);

  return !Number.isNaN(day.getTime()) && day.toISOString().slice(0, 10) === text;
};

export const IsoDate = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/), Schema.makeFilter(isCalendarDay)),
  Schema.brand("IsoDate"),
);

export type IsoDate = typeof IsoDate.Type;

// Whole rupiah per kg.
export const Rupiah = Schema.Int.pipe(Schema.brand("Rupiah"));

export type Rupiah = typeof Rupiah.Type;

// Every date that has prices, oldest first.
export const DatesResponse = Schema.Struct({ dates: Schema.Array(IsoDate) });

export type DatesResponse = typeof DatesResponse.Type;

// One commodity on one date. `national` is the PIHPS figure for area 0, null when it has no row.
// `byArea` lists the provinces (1..34) that have a row: an absent province has no data.
export const Snapshot = Schema.Struct({
  date: IsoDate,
  national: Schema.NullOr(Rupiah),
  byArea: Schema.Array(Schema.Struct({ areaId: AreaId, price: Rupiah })),
});

export type Snapshot = typeof Snapshot.Type;

// How many days back a series reaches. Arrives in a query string, so it decodes from text: only the
// three ranges the Chart tab offers pass.
export const Days = Schema.NumberFromString.pipe(
  Schema.check(Schema.makeFilter((days: number) => days === 7 || days === 30 || days === 90)),
);

export type Days = typeof Days.Type;

// One stored day of one commodity in one area.
export const SeriesPoint = Schema.Struct({ date: IsoDate, price: Rupiah });

export type SeriesPoint = typeof SeriesPoint.Type;
