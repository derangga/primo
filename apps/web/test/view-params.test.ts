import { IsoDate } from "@primo/contract/schemas";
import { expect, it } from "vitest";
import { resolveDate, stepDate, validateChartSearch, validateMapSearch } from "../src/view-params";

const day = (date: string) => IsoDate.make(date);

const dates = [day("2026-10-06"), day("2026-10-07"), day("2026-10-08")];

it("keeps a valid commodity and date and drops each invalid one on its own", () => {
  expect(validateMapSearch({ commodity: "com_3", date: "2026-10-07" })).toEqual({
    commodity: "com_3",
    date: "2026-10-07",
    area: undefined,
  });
  // toStrictEqual: the invalid key must be present and undefined, or the router keeps the raw URL value.
  expect(validateMapSearch({ commodity: "cat_99", date: "2026-10-07" })).toStrictEqual({
    commodity: undefined,
    date: "2026-10-07",
    area: undefined,
  });
  expect(validateMapSearch({ commodity: "cat_2", date: "2026-02-30" })).toStrictEqual({
    commodity: "cat_2",
    date: undefined,
    area: undefined,
  });
  expect(validateMapSearch({ commodity: 5, date: ["x"] })).toStrictEqual({
    commodity: undefined,
    date: undefined,
    area: undefined,
  });
  expect(validateMapSearch({})).toStrictEqual({
    commodity: undefined,
    date: undefined,
    area: undefined,
  });
});

it("shows the requested date when it has data and the newest otherwise", () => {
  expect(resolveDate(dates, day("2026-10-07"))).toBe("2026-10-07");
  expect(resolveDate(dates, day("2026-10-03"))).toBe("2026-10-08");
  expect(resolveDate(dates, undefined)).toBe("2026-10-08");
  expect(resolveDate([], undefined)).toBeUndefined();
});

it("steps one available date and stops at both ends", () => {
  expect(stepDate(dates, day("2026-10-07"), -1)).toBe("2026-10-06");
  expect(stepDate(dates, day("2026-10-07"), 1)).toBe("2026-10-08");
  expect(stepDate(dates, day("2026-10-06"), -1)).toBeUndefined();
  expect(stepDate(dates, day("2026-10-08"), 1)).toBeUndefined();
});

it("accepts a province 1 to 34 on the Map tab, and not the national figure", () => {
  expect(validateMapSearch({ area: 13 }).area).toBe(13);
  expect(validateMapSearch({ area: 34 }).area).toBe(34);
  expect(validateMapSearch({ area: 0 }).area).toBeUndefined();
  expect(validateMapSearch({ area: 35 }).area).toBeUndefined();
  expect(validateMapSearch({ area: "13" }).area).toBeUndefined();
  expect(validateMapSearch({ area: 1.5 }).area).toBeUndefined();
});

it("accepts the national figure, a province and the three ranges on the Chart tab", () => {
  expect(validateChartSearch({ commodity: "cat_1", area: 0, range: 90 })).toStrictEqual({
    commodity: "cat_1",
    area: 0,
    range: 90,
  });
  expect(validateChartSearch({ area: 35, range: 14, commodity: "x" })).toStrictEqual({
    commodity: undefined,
    area: undefined,
    range: undefined,
  });
});
