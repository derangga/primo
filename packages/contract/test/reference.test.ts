import { expect, it } from "vitest";
import { categories, provinces, variants } from "../src/reference.ts";

it("holds 34 provinces, 10 categories and 21 variants", () => {
  expect([provinces.length, categories.length, variants.length]).toEqual([34, 10, 21]);
});
