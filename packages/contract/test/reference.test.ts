import { expect, it } from "vitest";
import { categories, provinces, variants } from "../src/reference.ts";

it("holds 34 provinces, 10 categories and 21 variants", () => {
  expect([provinces.length, categories.length, variants.length]).toEqual([34, 10, 21]);
});

it("matches the published UMP 2026 for DKI Jakarta and Jawa Barat", () => {
  const ump = new Map(provinces.map((province) => [province.name, province.ump2026]));

  expect([ump.get("DKI Jakarta"), ump.get("Jawa Barat")]).toEqual([5_729_876, 2_317_601]);
});
