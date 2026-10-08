import { describe, expect, it } from "vitest";
import { Schema } from "effect";
import { AreaId, CommodityId, IsoDate } from "../src/schemas.ts";

describe("AreaId", () => {
  it("accepts national and the 34 PIHPS provinces", () => {
    expect([0, 1, 13, 34].map(Schema.is(AreaId))).toEqual([true, true, true, true]);
  });

  it("rejects an unknown province id", () => {
    expect([35, -1, 1.5].map(Schema.is(AreaId))).toEqual([false, false, false]);
  });
});

describe("CommodityId", () => {
  it("accepts categories and variants", () => {
    expect(["cat_1", "cat_10", "com_14", "com_21"].map(Schema.is(CommodityId))).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });

  it("rejects an unknown commodity id", () => {
    expect(["cat_11", "com_22", "1_3"].map(Schema.is(CommodityId))).toEqual([false, false, false]);
  });
});

describe("IsoDate", () => {
  it("accepts a calendar day", () => {
    expect(["2026-10-07", "2024-02-29"].map(Schema.is(IsoDate))).toEqual([true, true]);
  });

  it("rejects a malformed date", () => {
    expect(["07/10/2026", "2026-13-01", "2026-02-30", "2026-1-07"].map(Schema.is(IsoDate))).toEqual(
      [false, false, false, false],
    );
  });
});
