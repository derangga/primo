import { expect, it } from "vitest";
import { IsoDate } from "../src/schemas";
import { dayOf, windowStart } from "../src/window";

const day = (text: string) => IsoDate.make(text);

it("starts a range of n calendar days that ends today", () => {
  expect(windowStart(day("2026-10-09"), 7)).toBe("2026-10-03");
  expect(windowStart(day("2026-10-09"), 30)).toBe("2026-09-10");
  expect(windowStart(day("2026-10-09"), 90)).toBe("2026-07-12");
  expect(windowStart(day("2026-03-02"), 7)).toBe("2026-02-24");
});

it("reads the UTC calendar day of a moment", () => {
  expect(dayOf(new Date("2026-10-09T23:59:59Z"))).toBe("2026-10-09");
  expect(dayOf(new Date("2026-10-10T00:00:00Z"))).toBe("2026-10-10");
});
