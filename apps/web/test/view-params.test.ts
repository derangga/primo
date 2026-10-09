import { IsoDate } from "@primo/contract/schemas";
import { expect, it } from "vitest";
import { resolveDate, stepDate, validateViewSearch } from "../src/view-params";

const day = (date: string) => IsoDate.make(date);

const dates = [day("2026-10-06"), day("2026-10-07"), day("2026-10-08")];

it("keeps a valid commodity and date and drops each invalid one on its own", () => {
  expect(validateViewSearch({ commodity: "com_3", date: "2026-10-07" })).toEqual({
    commodity: "com_3",
    date: "2026-10-07",
    area: undefined,
    range: undefined,
  });
  // toStrictEqual: the invalid key must be present and undefined, or the router keeps the raw URL value.
  expect(validateViewSearch({ commodity: "cat_99", date: "2026-10-07" })).toStrictEqual({
    commodity: undefined,
    date: "2026-10-07",
    area: undefined,
    range: undefined,
  });
  expect(validateViewSearch({ commodity: "cat_2", date: "2026-02-30" })).toStrictEqual({
    commodity: "cat_2",
    date: undefined,
    area: undefined,
    range: undefined,
  });
  expect(validateViewSearch({ commodity: 5, date: ["x"] })).toStrictEqual({
    commodity: undefined,
    date: undefined,
    area: undefined,
    range: undefined,
  });
  expect(validateViewSearch({})).toStrictEqual({
    commodity: undefined,
    date: undefined,
    area: undefined,
    range: undefined,
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

it("accepts a province 1 to 34, and not the national figure", () => {
  expect(validateViewSearch({ area: 13 }).area).toBe(13);
  expect(validateViewSearch({ area: 34 }).area).toBe(34);
  expect(validateViewSearch({ area: 0 }).area).toBeUndefined();
  expect(validateViewSearch({ area: 35 }).area).toBeUndefined();
  expect(validateViewSearch({ area: "13" }).area).toBeUndefined();
  expect(validateViewSearch({ area: 1.5 }).area).toBeUndefined();
});

it("accepts the three ranges and drops any other", () => {
  expect(validateViewSearch({ range: 90 }).range).toBe(90);
  expect(validateViewSearch({ range: 14 }).range).toBeUndefined();
  expect(validateViewSearch({ range: "30" }).range).toBeUndefined();
});
