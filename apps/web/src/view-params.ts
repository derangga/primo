import { AreaId, CommodityId, IsoDate } from "@primo/contract/schemas";
import { Option, Schema } from "effect";

// The URL's search params are untrusted. Each one is decoded on its own with the contract's schema,
// and one that fails is dropped, so the view falls back to that param's default (DESIGN.md, Interface).
const decodeCommodity = Schema.decodeUnknownOption(CommodityId);

const decodeDate = Schema.decodeUnknownOption(IsoDate);

// A province on the Map tab: 1..34. AreaId also allows 0, the national figure, which is not a province.
const decodeArea = Schema.decodeUnknownOption(AreaId);

const decodeProvince = Schema.decodeUnknownOption(
  AreaId.pipe(Schema.check(Schema.makeFilter((areaId: number) => areaId !== 0))),
);

export type MapSearch = {
  readonly commodity: CommodityId | undefined;
  readonly date: IsoDate | undefined;
  readonly area: AreaId | undefined;
};

// A param that fails is returned as an explicit undefined, not left out: the router merges what this
// returns over the raw URL params, so a missing key would let the invalid value through.
export function validateMapSearch(search: {
  readonly commodity?: unknown;
  readonly date?: unknown;
  readonly area?: unknown;
}): MapSearch {
  return {
    commodity: Option.getOrUndefined(decodeCommodity(search["commodity"])),
    date: Option.getOrUndefined(decodeDate(search["date"])),
    area: Option.getOrUndefined(decodeProvince(search["area"])),
  };
}

// The Chart tab's range in days, as the series endpoint takes it: 7 days, 1 month, 3 months.
const decodeRange = Schema.decodeUnknownOption(Schema.Literals([7, 30, 90]));

export type Range = 7 | 30 | 90;

export type ChartSearch = {
  readonly commodity: CommodityId | undefined;
  readonly area: AreaId | undefined;
  readonly range: Range | undefined;
};

export function validateChartSearch(search: {
  readonly commodity?: unknown;
  readonly area?: unknown;
  readonly range?: unknown;
}): ChartSearch {
  return {
    commodity: Option.getOrUndefined(decodeCommodity(search["commodity"])),
    area: Option.getOrUndefined(decodeArea(search["area"])),
    range: Option.getOrUndefined(decodeRange(search["range"])),
  };
}

// The date to show: the requested one when it has data, otherwise the newest.
// `dates` is the API's list, oldest first.
export function resolveDate(dates: ReadonlyArray<IsoDate>, requested: IsoDate | undefined) {
  return requested !== undefined && dates.includes(requested) ? requested : dates.at(-1);
}

// The date one step from `current` in `dates` (oldest first): -1 is older, 1 is newer.
// Undefined past either end, which is when the control's button is disabled.
export function stepDate(dates: ReadonlyArray<IsoDate>, current: IsoDate, direction: -1 | 1) {
  return dates[dates.indexOf(current) + direction];
}
